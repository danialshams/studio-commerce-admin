import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireSession,fail,isUUID} from '@/lib/common';
import {authorize,manageTeam} from '@/lib/access';

function readable(s:NonNullable<Awaited<ReturnType<typeof requireSession>>>){
 return ['contacts','deals','tasks','documents','contracts','tickets','interactions','automation_rules'].filter(x=>authorize(s,x));
}
export async function GET(){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 try {
  const r=await db().query(`SELECT n.id,n.title,n.body,n.entity,n.created_at,(r.user_id IS NOT NULL) AS is_read
   FROM notifications n LEFT JOIN notification_reads r ON r.notification_id=n.id AND r.user_id=$2
   WHERE n.org_id=$1 AND (n.recipient_id IS NULL OR n.recipient_id=$2)
   AND (n.entity=ANY($3::varchar[]) OR ($4::boolean AND n.entity IS NULL))
   ORDER BY n.created_at DESC LIMIT 50`,[s.orgId,s.userId,readable(s),manageTeam(s)]);
  return NextResponse.json({items:r.rows,unread:r.rows.filter(x=>!x.is_read).length});
 }catch(e){console.error('notifications',e);return fail('خطا در اعلان‌ها',500)}
}
export async function PATCH(req:Request){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 const b=await req.json().catch(()=>null);if(!isUUID(b?.id))return fail('شناسه نامعتبر');
 try{
  const r=await db().query(`INSERT INTO notification_reads(notification_id,user_id)
    SELECT id,$2 FROM notifications
    WHERE id=$1 AND org_id=$3 AND (recipient_id IS NULL OR recipient_id=$2)
    AND (entity=ANY($4::varchar[]) OR ($5::boolean AND entity IS NULL))
    ON CONFLICT DO NOTHING RETURNING notification_id`,[b.id,s.userId,s.orgId,readable(s),manageTeam(s)]);
  return NextResponse.json({ok:true,changed:r.rowCount===1});
 }catch(e){console.error('notification read',e);return fail('ثبت وضعیت اعلان ناموفق بود.',500)}
}
