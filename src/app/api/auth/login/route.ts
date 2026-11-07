import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { setSession } from '@/lib/auth';
import { fail,textVal } from '@/lib/common';
export async function POST(req:Request){
try {
const b=await req.json();const email=textVal(b.email,255).toLowerCase(),password=String(b.password||'');
const ip=(req.headers.get('x-forwarded-for')||'').split(',')[0].trim().slice(0,64);const key=email+'|'+ip;
const count=await db().query("SELECT count(*)::int as n FROM login_attempts WHERE identifier=$1 AND created_at>now()-interval '15 minutes'",[key]);
if(Number(count.rows[0].n)>=8) return fail('تلاش‌های زیاد؛ ۱۵ دقیقه دیگر دوباره امتحان کنید.',429);
const u=await db().query('SELECT id,org_id,name,role,password_hash FROM users WHERE email=$1',[email]);
const ok=u.rowCount===1&&await bcrypt.compare(password,u.rows[0].password_hash);
if(!ok){ await db().query('INSERT INTO login_attempts(identifier) VALUES($1)',[key]);return fail('ایمیل یا رمز عبور صحیح نیست.',401) }
await db().query('DELETE FROM login_attempts WHERE identifier=$1',[key]);
await setSession({userId:u.rows[0].id,orgId:u.rows[0].org_id,name:u.rows[0].name,role:u.rows[0].role});return NextResponse.json({ok:true});
} catch(e){console.error('login',e);return fail('ورود انجام نشد.',500)}
}
