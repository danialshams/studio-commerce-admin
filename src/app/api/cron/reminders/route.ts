import {NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {db,transaction} from '@/lib/db';
function valid(auth:string|null){
 const secret=process.env.CRON_SECRET;
 if(!secret||secret.length<32||!auth?.startsWith('Bearer '))return false;
 const supplied=Buffer.from(auth.slice(7));const expected=Buffer.from(secret);
 return supplied.length===expected.length&&timingSafeEqual(supplied,expected);
}
export async function POST(req:Request){
 if(!valid(req.headers.get('authorization')))return NextResponse.json({error:'Unauthorized'},{status:401});
 try {
  const data=await transaction(async c=>{
   const overdue=await c.query(`SELECT id,org_id,title FROM tasks WHERE due_at<current_date AND status<>'done' ORDER BY due_at LIMIT 250`);
   let generated=0;
   for(const task of overdue.rows){
    const marker=await c.query("INSERT INTO reminder_runs(org_id,entity_id,kind,run_date) VALUES($1,$2,'task_overdue',current_date) ON CONFLICT DO NOTHING RETURNING id",[task.org_id,task.id]);
    if(!marker.rowCount)continue;
    await c.query('INSERT INTO notifications(org_id,title,body) VALUES($1,$2,$3)',[task.org_id,'پیگیری عقب‌افتاده',`موعد «${task.title}» گذشته است.`.slice(0,500)]);
    generated++;
   }
   return {checked:overdue.rows.length,generated};
  });
  return NextResponse.json({ok:true,...data});
 }catch(e){console.error('reminders',e);return NextResponse.json({error:'Job failed'},{status:500})}
}
