import {NextResponse} from 'next/server';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {transaction} from '@/lib/db';
import {runWorkflows} from '@/lib/workflows';
export const runtime='nodejs';

export async function POST(req:Request){
 const secret=process.env.SIGN_WEBHOOK_SECRET;
 const stamp=req.headers.get('x-daira-timestamp');
 const signature=req.headers.get('x-daira-signature');
 const seconds=Number(stamp);
 if(!secret||secret.length<32)return NextResponse.json({error:'Signature integration unavailable'},{status:503});
 if(!stamp||!/^\d{10}$/.test(stamp)||!Number.isSafeInteger(seconds)
   ||Math.abs(Date.now()/1000-seconds)>300||!signature||!/^sha256=[0-9a-f]{64}$/i.test(signature))
  return NextResponse.json({error:'Invalid webhook signature'},{status:401});
 const body=await req.text();
 if(body.length>20000)return NextResponse.json({error:'Payload too large'},{status:413});
 const digest=createHmac('sha256',secret).update(stamp+'.'+body).digest();
 const provided=Buffer.from(signature.slice(7),'hex');
 if(digest.length!==provided.length||!timingSafeEqual(digest,provided))
  return NextResponse.json({error:'Invalid webhook signature'},{status:401});
 let event:{eventId?:unknown;providerRequestId?:unknown;status?:unknown};
 try{event=JSON.parse(body)}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 const id=event.eventId,providerId=event.providerRequestId,status=event.status;
 if(typeof id!=='string'||!/^[a-zA-Z0-9_.:-]{8,200}$/.test(id)
   ||typeof providerId!=='string'||!providerId||providerId.length>200
   ||!['signed','declined','expired'].includes(String(status)))
  return NextResponse.json({error:'Invalid event'},{status:400});
 try{
  const result=await transaction(async client=>{
   const existing=await client.query('INSERT INTO signature_webhook_events(event_id) VALUES($1) ON CONFLICT DO NOTHING RETURNING event_id',[id]);
   if(!existing.rowCount)return 'duplicate';
   const found=await client.query(`SELECT r.id,r.org_id,r.status,r.contract_id,c.title,c.contact_id
     FROM signature_requests r JOIN contracts c ON c.id=r.contract_id AND c.org_id=r.org_id
     WHERE r.provider_request_id=$1 FOR UPDATE OF r`,[providerId]);
   if(!found.rowCount)throw new Error('signature-not-found');
   const r=found.rows[0];if(r.status!=='pending')return 'ignored';
   await client.query(`UPDATE signature_requests SET status=$2,updated_at=now(),
     signed_at=CASE WHEN $2='signed' THEN now() ELSE NULL END WHERE id=$1`,[r.id,status]);
   if(status==='signed'){
    await client.query(`UPDATE contracts SET status='signed',updated_at=now()
      WHERE id=$1 AND org_id=$2 AND status NOT IN ('cancelled','completed')`,[r.contract_id,r.org_id]);
    await client.query(`INSERT INTO activities(org_id,entity,entity_id,action,description)
      VALUES($1,'contracts',$2,'signed',$3)`,
      [r.org_id,r.contract_id,('تأیید امضای قرارداد: '+r.title).slice(0,500)]);
    await client.query(`INSERT INTO notifications(org_id,entity,title,body)
      VALUES($1,'contracts','امضای دیجیتال تأیید شد',$2)`,[r.org_id,r.title.slice(0,500)]);
    await runWorkflows(client,r.org_id,null,'contracts.signed',{id:r.contract_id,title:r.title,contactId:r.contact_id});
   }
   return 'processed';
  });
  return NextResponse.json({ok:true,result});
 }catch(e){
  if(e instanceof Error&&e.message==='signature-not-found')return NextResponse.json({error:'Unknown request'},{status:404});
  console.error('signature webhook',e);return NextResponse.json({error:'Webhook processing failed'},{status:500});
 }
}
