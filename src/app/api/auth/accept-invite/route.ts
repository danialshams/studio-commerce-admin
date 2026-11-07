import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { transaction } from '@/lib/db';
import { setSession } from '@/lib/auth';
import { fail,textVal } from '@/lib/common';
export async function POST(req:Request){
 try {
  const b=await req.json();const token=String(b.token||''),name=textVal(b.name,120),password=String(b.password||'');
  if(token.length<32||name.length<2||password.length<10||password.length>100)return fail('اطلاعات دعوت معتبر نیست.');
  const tokenHash=createHash('sha256').update(token).digest('hex');const passwordHash=await bcrypt.hash(password,12);
  const user=await transaction(async c=>{
   const invite=await c.query('SELECT * FROM invitations WHERE token_hash=$1 AND accepted_at IS NULL AND expires_at>now() FOR UPDATE',[tokenHash]);
   if(!invite.rowCount)throw new Error('invalid-invite');
   const i=invite.rows[0];
   const created=await c.query('INSERT INTO users(org_id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5) RETURNING id,org_id,name,role,session_rev',[i.org_id,name,i.email,passwordHash,i.role]);
   await c.query('UPDATE invitations SET accepted_at=now() WHERE id=$1',[i.id]);
   return created.rows[0];
  });
  await setSession({userId:user.id,orgId:user.org_id,name:user.name,role:user.role,rev:user.session_rev});
  return NextResponse.json({ok:true});
 } catch(e){if(e instanceof Error&&e.message==='invalid-invite')return fail('لینک دعوت منقضی یا استفاده‌شده است.',410);if((e as {code?:string})?.code==='23505')return fail('ایمیل قبلاً ثبت شده است.',409);return fail('پذیرش دعوت انجام نشد.',500)}
}
