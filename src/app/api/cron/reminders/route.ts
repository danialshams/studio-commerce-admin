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
    SELECT t.org_id,t.id,t.title,
       CASE WHEN t.due_at=CURRENT_DATE THEN 'task_due' ELSE 'task_overdue' END AS kind
    FROM tasks t
    WHERE t.due_at<=CURRENT_DATE AND t.status<>'done' AND t.notes NOT LIKE '[دمو]%'
    AND NOT EXISTS (
      SELECT 1 FROM reminder_runs r
      WHERE r.org_id=t.org_id AND r.entity_id=t.id
      AND r.kind=CASE WHEN t.due_at=CURRENT_DATE THEN 'task_due' ELSE 'task_overdue' END
      AND r.run_date=CURRENT_DATE
    )
    ORDER BY t.due_at,t.id LIMIT 200
   ), marked AS (
    INSERT INTO reminder_runs(org_id,entity_id,kind,run_date)
    SELECT org_id,id,kind,CURRENT_DATE FROM due
    ON CONFLICT DO NOTHING RETURNING org_id,entity_id,kind
   ), made AS (
    INSERT INTO notifications(org_id,entity,title,body)
    SELECT m.org_id,'tasks',
      CASE WHEN m.kind='task_due' THEN 'موعد پیگیری امروز' ELSE 'پیگیری عقب‌افتاده' END,
      LEFT(CASE WHEN m.kind='task_due' THEN 'موعد «'||t.title||'» امروز است.'
        ELSE 'موعد «'||t.title||'» گذشته است.' END,500)
    FROM marked m JOIN tasks t ON t.id=m.entity_id AND t.org_id=m.org_id
    RETURNING id
   ) SELECT count(*)::int AS generated FROM made`);
  return NextResponse.json({ok:true,generated:r.rows[0]?.generated||0});
 }catch(e){console.error('reminders',e);return NextResponse.json({error:'Job failed'},{status:500})}
}
// Vercel Cron invokes GET; independent VPS schedulers may use POST.
export const GET=execute;
export const POST=execute;
