import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {authorize} from '@/lib/access';
import {requireSession,fail,isUUID,textVal} from '@/lib/common';
import {signingConfigured,submitSignatureRequest} from '@/lib/signature-provider';

export async function GET(){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 if(!authorize(s,'contracts'))return fail('مجوز ندارید.',403);
 const result=await db().query(`SELECT r.id,r.contract_id,c.title contract_title,r.signer_name,
   r.signer_email,r.status,r.signing_url,r.created_at,r.signed_at
   FROM signature_requests r JOIN contracts c ON c.id=r.contract_id AND c.org_id=r.org_id
   WHERE r.org_id=$1 ORDER BY r.created_at DESC LIMIT 100`,[s.orgId]);
 return NextResponse.json({items:result.rows,providerConfigured:signingConfigured()});
}
export async function POST(req:Request){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 if(!authorize(s,'contracts',true))return fail('مجوز ندارید.',403);
 const b=await req.json().catch(()=>null);
 if(!isUUID(b?.contractId))return fail('قرارداد نامعتبر است.');
 const signerName=textVal(b?.signerName,160),signerEmail=textVal(b?.signerEmail,255).toLowerCase();
 if(signerName.length<2||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(signerEmail))
  return fail('نام و ایمیل امضاکننده الزامی است.');
 const contract=await db().query('SELECT id FROM contracts WHERE id=$1 AND org_id=$2 AND status NOT IN (\'cancelled\',\'signed\')',[b.contractId,s.orgId]);
 if(!contract.rowCount)return fail('قرارداد معتبر برای امضا پیدا نشد.',404);
 const r=await db().query(`INSERT INTO signature_requests(org_id,contract_id,created_by,signer_name,signer_email)
  VALUES($1,$2,$3,$4,$5) RETURNING id,status`,[s.orgId,b.contractId,s.userId,signerName,signerEmail]);
 return NextResponse.json({item:r.rows[0]},{status:201});
}
export async function PATCH(req:Request){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 if(!authorize(s,'contracts',true))return fail('مجوز ندارید.',403);
 const b=await req.json().catch(()=>null);
 if(!isUUID(b?.id)||!['send','cancel'].includes(b.action))return fail('درخواست نامعتبر است.');
 if(b.action==='cancel'){
  const changed=await db().query(`UPDATE signature_requests SET status='cancelled',updated_at=now()
   WHERE id=$1 AND org_id=$2 AND status='draft' RETURNING id`,[b.id,s.orgId]);
  return changed.rowCount?NextResponse.json({ok:true}):fail('درخواست قابل لغو نیست.',409);
 }
 if(!signingConfigured())return fail('سرویس امضای دیجیتال هنوز متصل نشده است.',409);
 const marked=await db().query(`UPDATE signature_requests r SET status='pending',updated_at=now()
  FROM contracts c WHERE r.id=$1 AND r.org_id=$2 AND r.status='draft'
  AND c.id=r.contract_id AND c.org_id=r.org_id AND c.status NOT IN ('cancelled','signed')
  RETURNING r.id,r.signer_name,r.signer_email,c.number,c.title,c.amount,c.terms`,[b.id,s.orgId]);
 const r=marked.rows[0];if(!r)return fail('درخواست قبلاً ارسال شده یا قابل ارسال نیست.',409);
 try{
  const sent=await submitSignatureRequest({
   id:r.id,signerName:r.signer_name,signerEmail:r.signer_email,
   contractNumber:r.number,contractTitle:r.title,amount:String(r.amount),terms:r.terms
  });
  await db().query(`UPDATE signature_requests SET provider_request_id=$2,signing_url=$3,
    updated_at=now() WHERE id=$1 AND org_id=$4 AND status='pending'`,
    [r.id,sent.providerRequestId,sent.signingUrl,s.orgId]);
  return NextResponse.json({ok:true,signingUrl:sent.signingUrl});
 }catch(e){
  await db().query("UPDATE signature_requests SET status='draft',updated_at=now() WHERE id=$1 AND org_id=$2 AND status='pending' AND provider_request_id IS NULL",[r.id,s.orgId]);
  console.error('signature submit',e instanceof Error?e.message:'provider failure');
  return fail('درخواست امضا ارسال نشد؛ تنظیمات سرویس را بررسی کنید.',502);
 }
}
