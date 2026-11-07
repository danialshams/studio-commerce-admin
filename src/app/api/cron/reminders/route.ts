import {NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {db} from '@/lib/db';
function authorized(auth:string|null){
 const secret=process.env.CRON_SECRET;
 if(!secret||secret.length<32||!auth?.startsWith('Bearer '))return false;
 const expected=Buffer.from(secret), supplied=Buffer.from(auth.slice(7));
 return supplied.length===expected.length&&timingSafeEqual(supplied,expected);
}
async function execute(req:Request){
 if(!authorized(req.headers.get('authorization')))return NextResponse.json({error:'Unauthorized'},{status:401});
 try {
  const r=await db().query(`WITH due AS (
    SELECT org_id,id,title FROM tasks WHERE due_at<current_date AND status<>'done'
    ORDER BY due_at LIMIT 200
   ), marked AS (
    INSERT INTO reminder_runs(org_id,entity_id,kind,run_date)
    SELECT org_id,id,'task_overdue',current_date FROM due
    ON CONFLICT DO NOTHING RETURNING org_id,entity_id
   ), made AS (
    INSERT INTO notifications(org_id,title,body)
    SELECT m.org_id,'پیگیری عقب‌افتاده',LEFT('موعد «'||t.title||'» گذشته است.',500)
    FROM marked m JOIN tasks t ON t.id=m.entity_id AND t.org_id=m.org_id
    RETURNING id
   ) SELECT count(*)::int AS generated FROM made`);
  return NextResponse.json({ok:true,generated:r.rows[0]?.generated||0});
 }catch(e){console.error('reminders',e);return NextResponse.json({error:'Job failed'},{status:500})}
}
// Vercel Cron invokes GET; independent VPS schedulers may use POST.
export const GET=execute;
export const POST=execute;
