import { NextResponse } from 'next/server';
import { db,transaction } from '@/lib/db';
import { setSession } from '@/lib/auth';
import { fail,textVal } from '@/lib/common';
import bcrypt from 'bcryptjs';
export async function POST(req:Request){
try {
const b=await req.json(); const name=textVal(b.name,120),company=textVal(b.company,160),email=textVal(b.email,255).toLowerCase(),password=String(b.password||'');
if(name.length<2||company.length<2||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||password.length<10||password.length>100) return fail('نام، نام مجموعه، ایمیل معتبر و رمز حداقل ۱۰ کاراکتری لازم است.');
const count=await db().query('SELECT id FROM users WHERE email=$1',[email]);if(count.rowCount) return fail('این ایمیل قبلاً ثبت شده است.',409);
const hash=await bcrypt.hash(password,12);
const user=await transaction(async c=>{
 const org=await c.query('INSERT INTO organizations(name) VALUES ($1) RETURNING id',[company]);
 const u=await c.query('INSERT INTO users(org_id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5) RETURNING id,org_id,name,role',[org.rows[0].id,name,email,hash,'owner']);return u.rows[0];});
await setSession({userId:user.id,orgId:user.org_id,name:user.name,role:user.role});return NextResponse.json({ok:true});
} catch(e){console.error('signup',e);return fail('ثبت‌نام انجام نشد. دوباره تلاش کنید.',500)}
}
