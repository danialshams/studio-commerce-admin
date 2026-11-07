import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireSession,fail,isUUID} from '@/lib/common';
export async function GET(){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 try {const r=await db().query(`SELECT n.id,n.title,n.body,n.created_at,(r.user_id IS NOT NULL) AS is_read
 FROM notifications n LEFT JOIN notification_reads r ON r.notification_id=n.id AND r.user_id=$2
 WHERE n.org_id=$1 ORDER BY n.created_at DESC LIMIT 50`,[s.orgId,s.userId]);
 return NextResponse.json({items:r.rows,unread:r.rows.filter(x=>!x.is_read).length});
 }catch(e){console.error('notifications',e);return fail('خطا در اعلان‌ها',500)}
}
export async function PATCH(req:Request){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 const b=await req.json();if(!isUUID(b.id))return fail('شناسه نامعتبر');
 const r=await db().query(`INSERT INTO notification_reads(notification_id,user_id)
 SELECT id,$2 FROM notifications WHERE id=$1 AND org_id=$3 ON CONFLICT DO NOTHING RETURNING notification_id`,[b.id,s.userId,s.orgId]);
 return NextResponse.json({ok:true,changed:r.rowCount===1});
}
