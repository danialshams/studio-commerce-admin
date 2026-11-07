import { NextResponse } from 'next/server';
import { db } from '@/lib/db';import { requireSession,fail,isUUID } from '@/lib/common';
export async function GET(){const s=await requireSession();if(!s)return fail('ورود لازم است.',401);try{const r=await db().query('SELECT * FROM notifications WHERE org_id=$1 ORDER BY created_at DESC LIMIT 25',[s.orgId]);return NextResponse.json({items:r.rows,unread:r.rows.filter(x=>!x.is_read).length})}catch{return fail('خطا در اعلان‌ها',500)}}
export async function PATCH(req:Request){const s=await requireSession();if(!s)return fail('ورود لازم است.',401);const b=await req.json();if(!isUUID(b.id))return fail('شناسه نامعتبر');await db().query('UPDATE notifications SET is_read=true WHERE org_id=$1 AND id=$2',[s.orgId,b.id]);return NextResponse.json({ok:true})}
