import { NextRequest,NextResponse } from "next/server";
import { db } from "@/lib/db";
import {createSession,loginKey,sameOrigin,verifyPassword} from "@/lib/security";
import {z} from "zod";
export const runtime="nodejs";
const input=z.object({email:z.email().max(200),password:z.string().min(1).max(256)});
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return NextResponse.json({error:"مبدا نامعتبر"},{status:403});
  const parsed=input.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"ورودی نامعتبر"},{status:400});
  const email=parsed.data.email.toLowerCase().trim();
  const key=loginKey(req,email),window=new Date(Date.now()-15*60*1000);
  const attempts=await db.loginAttempt.count({where:{key,createdAt:{gte:window}}});
  if(attempts>=8)return NextResponse.json({error:"تلاش بیش از حد. بعداً دوباره امتحان کنید"},{status:429});
  const admin=await db.admin.findUnique({where:{email}});
  const correct=admin && verifyPassword(parsed.data.password,admin.passwordHash);
  if(!correct){await db.loginAttempt.create({data:{key}});return NextResponse.json({error:"ایمیل یا رمز عبور نادرست است"},{status:401});}
  await db.loginAttempt.deleteMany({where:{key}});
  await createSession(admin.id);
  return NextResponse.json({ok:true});
}
