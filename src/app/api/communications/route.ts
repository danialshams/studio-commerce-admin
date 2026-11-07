import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {authorize} from '@/lib/access';
import {requireSession,fail,isUUID,textVal} from '@/lib/common';
import {deliveryStatus} from '@/lib/providers';
import {processOutbox} from '@/lib/outbox';

export async function GET(){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 if(!authorize(s,'contacts'))return fail('مجوز ارسال پیام ندارید.',403);
 const rows=await db().query(`SELECT id,contact_id,channel,recipient,subject,body,status,attempts,
   last_error,created_at,sent_at FROM message_outbox WHERE org_id=$1
   ORDER BY created_at DESC LIMIT 100`,[s.orgId]);
 return NextResponse.json({items:rows.rows,providers:deliveryStatus()});
}
export async function POST(req:Request){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 if(!authorize(s,'contacts',true))return fail('مجوز ارسال پیام ندارید.',403);
 const b=await req.json().catch(()=>null),channel=b?.channel;
 if(!isUUID(b?.contactId)||!['sms','email'].includes(channel))return fail('مخاطب یا کانال نامعتبر است.');
 const subject=textVal(b?.subject,200),body=textVal(b?.body,3000);
 if(!body||body.length<3)return fail('متن پیام الزامی است.');
 const c=await db().query('SELECT email,phone FROM contacts WHERE org_id=$1 AND id=$2',[s.orgId,b.contactId]);
 if(!c.rowCount)return fail('مخاطب پیدا نشد.',404);
 const recipient=channel==='email'?c.rows[0].email:c.rows[0].phone;
 if(channel==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient||''))return fail('ایمیل مخاطب معتبر نیست.');
 if(channel==='sms'&&!/^\+?[0-9\s-]{8,20}$/.test(recipient||''))return fail('شماره مخاطب معتبر نیست.');
 const record=await db().query(`INSERT INTO message_outbox
   (org_id,contact_id,created_by,channel,recipient,subject,body,status)
   VALUES($1,$2,$3,$4,$5,$6,$7,'draft') RETURNING id,status`,
   [s.orgId,b.contactId,s.userId,channel,recipient,subject,body]);
 return NextResponse.json({item:record.rows[0]},{status:201});
}
export async function PATCH(req:Request){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 if(!authorize(s,'contacts',true))return fail('مجوز ارسال پیام ندارید.',403);
 const b=await req.json().catch(()=>null);
 if(!isUUID(b?.id)||!['queue','cancel'].includes(b.action))return fail('درخواست نامعتبر است.');
 if(b.action==='cancel'){
  const r=await db().query(`UPDATE message_outbox SET status='cancelled',updated_at=now()
  WHERE id=$1 AND org_id=$2 AND status IN ('draft','queued','failed') RETURNING id`,[b.id,s.orgId]);
  return r.rowCount?NextResponse.json({ok:true}):fail('امکان لغو این پیام وجود ندارد.',409);
 }
 const record=await db().query(`SELECT m.id,m.channel,m.status,c.delivery_consent
 FROM message_outbox m JOIN contacts c ON c.id=m.contact_id AND c.org_id=m.org_id
 WHERE m.id=$1 AND m.org_id=$2`,[b.id,s.orgId]);
 if(!record.rowCount)return fail('پیام پیدا نشد.',404);
 if(!record.rows[0].delivery_consent)return fail('رضایت مخاطب برای ارسال ثبت نشده است.',409);
 const configured=deliveryStatus();
 const channel=record.rows[0].channel as 'email'|'sms';
 if(!configured[channel])return fail('سرویس ارسال هنوز تنظیم نشده است. پیام در پیش‌نویس می‌ماند.',409);
 const queued=await db().query(`UPDATE message_outbox SET status='queued',attempts=0,
 next_attempt_at=now(),leased_at=NULL,last_error=NULL,updated_at=now()
 WHERE id=$1 AND org_id=$2 AND status IN ('draft','failed') RETURNING id`,[b.id,s.orgId]);
 if(!queued.rowCount)return fail('پیام قبلاً ارسال یا در صف قرار گرفته است.',409);
 const delivery=await processOutbox(1,b.id);
 return NextResponse.json({ok:true,delivery});
}
export async function DELETE(req:Request){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 if(!authorize(s,'contacts',true))return fail('مجوز ندارید.',403);
 const b=await req.json().catch(()=>null);if(!isUUID(b?.id))return fail('شناسه نامعتبر است.');
 const r=await db().query(`DELETE FROM message_outbox WHERE id=$1 AND org_id=$2
   AND status IN ('draft','cancelled') RETURNING id`,[b.id,s.orgId]);
 return r.rowCount?NextResponse.json({ok:true}):fail('فقط پیش‌نویس یا پیام لغوشده قابل حذف است.',409);
}
