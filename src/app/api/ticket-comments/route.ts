import {NextResponse} from 'next/server';
import {db,transaction} from '@/lib/db';
import {requireSession,fail,isUUID,textVal} from '@/lib/common';
import {authorize} from '@/lib/access';
export async function GET(req:Request){const s=await requireSession();if(!s)return fail('ورود لازم است.',401);if(!authorize(s,'tickets'))return fail('مجوز ندارید.',403);
 const id=new URL(req.url).searchParams.get('ticketId');if(!isUUID(id))return fail('تیکت معتبر نیست.');
 const ticket=await db().query('SELECT id FROM tickets WHERE id=$1 AND org_id=$2',[id,s.orgId]);if(!ticket.rowCount)return fail('تیکت یافت نشد.',404);
 const comments=await db().query('SELECT t.id,t.body,t.created_at,u.name author FROM ticket_comments t LEFT JOIN users u ON u.id=t.author_id WHERE t.org_id=$1 AND t.ticket_id=$2 ORDER BY t.created_at',[s.orgId,id]);
 return NextResponse.json({items:comments.rows});}
export async function POST(req:Request){const s=await requireSession();if(!s)return fail('ورود لازم است.',401);if(!authorize(s,'tickets',true))return fail('مجوز ندارید.',403);
 const b=await req.json(),body=textVal(b.body,5000);if(!isUUID(b.ticketId)||!body)return fail('تیکت و پیام الزامی‌اند.');
 const item=await transaction(async c=>{const ticket=await c.query('SELECT id,title FROM tickets WHERE id=$1 AND org_id=$2',[b.ticketId,s.orgId]);if(!ticket.rowCount)return null;
 const r=await c.query('INSERT INTO ticket_comments(org_id,ticket_id,author_id,body) VALUES($1,$2,$3,$4) RETURNING id,body,created_at',[s.orgId,b.ticketId,s.userId,body]);
 await c.query('INSERT INTO activities(org_id,user_id,entity,entity_id,action,description) VALUES($1,$2,$3,$4,$5,$6)',[s.orgId,s.userId,'tickets',b.ticketId,'comment',`پاسخ به تیکت: ${ticket.rows[0].title}`]);
 return {...r.rows[0],author:s.name};});return item?NextResponse.json({item},{status:201}):fail('تیکت یافت نشد.',404);}
