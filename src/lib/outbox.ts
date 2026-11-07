import {db} from './db';
import {deliverMessage} from './providers';

type OutboxRow={
 id:string;channel:'email'|'sms';recipient:string;subject:string;body:string;attempts:number;
};
export async function processOutbox(limit=20,specificId?:string):Promise<{sent:number;failed:number}>{
 let sent=0,failed=0;
 for(let i=0;i<Math.max(1,Math.min(limit,20));i++){
  // Claim rows atomically; concurrent cron workers cannot claim the same row.
  const claimed=await db().query<OutboxRow>(`WITH ready AS (
   SELECT m.id FROM message_outbox m
   JOIN contacts c ON c.id=m.contact_id AND c.org_id=m.org_id
   WHERE c.delivery_consent=true
   AND (m.status='queued' OR (m.status='failed' AND m.next_attempt_at<=now())
        OR (m.status='processing' AND m.leased_at<now()-interval '15 minutes'))
   AND m.attempts<5 AND ($1::uuid IS NULL OR m.id=$1::uuid)
   ORDER BY m.created_at FOR UPDATE OF m SKIP LOCKED LIMIT 1
  ) UPDATE message_outbox m SET status='processing',attempts=m.attempts+1,
      leased_at=now(),updated_at=now(),last_error=NULL
    FROM ready WHERE m.id=ready.id
    RETURNING m.id,m.channel,m.recipient,m.subject,m.body,m.attempts`,[specificId||null]);
  const message=claimed.rows[0];if(!message)break;
  try {
   const providerId=await deliverMessage(message);
   await db().query(`UPDATE message_outbox SET status='sent',provider_id=$2,
     sent_at=now(),leased_at=NULL,updated_at=now()
     WHERE id=$1 AND status='processing'`,[message.id,providerId]);
   sent++;
  }catch(e){
   // Never persist provider credentials or raw provider error bodies.
   const diagnostic=e instanceof Error && e.message.startsWith('SMS provider returned HTTP ')
     ?e.message:'Delivery failed; verify provider settings or availability';
   const retryMinutes=Math.min(360,Math.pow(2,message.attempts)*5);
   await db().query(`UPDATE message_outbox SET status='failed',last_error=$2,
    leased_at=NULL,next_attempt_at=CASE WHEN attempts>=5 THEN NULL
      ELSE now()+($3::int * interval '1 minute') END,updated_at=now()
    WHERE id=$1 AND status='processing'`,[message.id,diagnostic,retryMinutes]);
   failed++;
  }
 }
 return {sent,failed};
}
