import { NextResponse } from 'next/server';
import { randomBytes,createHash } from 'node:crypto';
import { db,transaction } from '@/lib/db';
import { requireSession,fail,isUUID,textVal } from '@/lib/common';
import { manageTeam } from '@/lib/access';
const allowed=['admin','sales','support','viewer'];
const hash=(token:string)=>createHash('sha256').update(token).digest('hex');
export async function GET(){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 if(!manageTeam(s))return fail('مجوز مدیریت تیم ندارید.',403);
 const [members,invites]=await Promise.all([
 db().query('SELECT id,name,email,role,is_active,created_at FROM users WHERE org_id=$1 ORDER BY created_at',[s.orgId]),
 db().query('SELECT id,email,role,expires_at,created_at FROM invitations WHERE org_id=$1 AND accepted_at IS NULL AND expires_at>now() ORDER BY created_at DESC',[s.orgId])]);
 return NextResponse.json({members:members.rows,invites:invites.rows});
}
export async function POST(req:Request){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 if(!manageTeam(s))return fail('مجوز مدیریت تیم ندارید.',403);
 const b=await req.json();const email=textVal(b.email,255).toLowerCase(),role=String(b.role||'sales');
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!allowed.includes(role)||(role==='admin'&&s.role!=='owner'))return fail('ایمیل یا سطح دسترسی معتبر نیست.');
 const exists=await db().query('SELECT id FROM users WHERE email=$1',[email]);if(exists.rowCount)return fail('این ایمیل در سیستم ثبت شده است.',409);
 const token=randomBytes(32).toString('base64url');
 try {await transaction(async c=>{
  const count=await c.query('SELECT count(*)::int n FROM invitations WHERE org_id=$1 AND accepted_at IS NULL AND expires_at>now()',[s.orgId]);
  if(count.rows[0].n>=25)throw new Error('limit');
  await c.query('UPDATE invitations SET expires_at=now() WHERE org_id=$1 AND email=$2 AND accepted_at IS NULL',[s.orgId,email]);
  await c.query("INSERT INTO invitations(org_id,email,role,token_hash,created_by,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '72 hours')",[s.orgId,email,role,hash(token),s.userId]);
 });} catch(e){return fail(e instanceof Error&&e.message==='limit'?'سقف ۲۵ دعوت فعال پر شده است.':'ایجاد دعوت ناموفق بود.',400)}
 const origin=new URL(req.url).origin;
 return NextResponse.json({ok:true,inviteUrl:`${origin}/join?token=${encodeURIComponent(token)}`,expiresInHours:72});
}
export async function PATCH(req:Request){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 if(!manageTeam(s))return fail('مجوز مدیریت تیم ندارید.',403);
 const b=await req.json();if(!isUUID(b.id)||b.id===s.userId)return fail('کاربر نامعتبر است.');
 const role=String(b.role||'');const active=b.is_active;
 if(role&&(!allowed.includes(role)||(role==='admin'&&s.role!=='owner')))return fail('نقش نامعتبر است.');
 if(active!==undefined&&typeof active!=='boolean')return fail('وضعیت نامعتبر است.');
 const member=await db().query('SELECT role FROM users WHERE id=$1 AND org_id=$2',[b.id,s.orgId]);
 if(!member.rowCount)return fail('عضو یافت نشد.',404);
 if(member.rows[0].role==='owner'||(member.rows[0].role==='admin'&&s.role!=='owner'))return fail('تغییر این عضو مجاز نیست.',403);
 const updates:string[]=[],values:unknown[]=[b.id,s.orgId];
 if(role){values.push(role);updates.push(`role=$${values.length}`)}
 if(active!==undefined){values.push(active);updates.push(`is_active=$${values.length}`)}
 if(!updates.length)return fail('تغییری ارسال نشده است.');
 const r=await db().query(`UPDATE users SET ${updates.join(',')},session_rev=session_rev+1 WHERE id=$1 AND org_id=$2 RETURNING id,name,email,role,is_active`,values);
 return NextResponse.json({member:r.rows[0]});
}
export async function DELETE(req:Request){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 if(!manageTeam(s))return fail('مجوز مدیریت تیم ندارید.',403);
 const b=await req.json();if(!isUUID(b.id))return fail('شناسه معتبر نیست.');
 const r=await db().query('DELETE FROM invitations WHERE id=$1 AND org_id=$2 AND accepted_at IS NULL RETURNING id',[b.id,s.orgId]);
 return r.rowCount?NextResponse.json({ok:true}):fail('دعوت پیدا نشد.',404);
}
