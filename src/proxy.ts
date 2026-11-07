import { NextResponse, type NextRequest } from 'next/server';
import {jwtVerify} from 'jose';

/**
 * The public showroom is deliberately read-only. Mutations must use a valid,
 * signed human session and cannot be invoked with the public demo identity.
 * Cron/webhook integrations and existing login flows use their own checks.
 */
export async function proxy(request: NextRequest) {
 const method=request.method.toUpperCase();
 if(!['POST','PATCH','PUT','DELETE'].includes(method))return NextResponse.next();
 const origin=request.headers.get('origin');
 if(request.headers.get('sec-fetch-site')==='cross-site'){
  return NextResponse.json({error:'Invalid request origin'},{status:403});
 }
 if(origin){
  try{
   if(new URL(origin).origin!==request.nextUrl.origin)
    return NextResponse.json({error:'Invalid request origin'},{status:403});
  }catch{
   return NextResponse.json({error:'Invalid origin header'},{status:403});
  }
 }
 const path=request.nextUrl.pathname;
 const serviceOrAuth=path.startsWith('/api/auth/')||path.startsWith('/api/cron/')||path.startsWith('/api/webhooks/');
 if(!serviceOrAuth){
  const token=request.cookies.get('daira_crm_session')?.value;
  const key=process.env.SESSION_SECRET;
  if(!token||!key||key.length<32)return NextResponse.json({error:'نسخهٔ عمومی فقط برای مشاهده است.'},{status:403});
  try{
   const {payload}=await jwtVerify(token,new TextEncoder().encode(key));
   if(typeof payload.userId!=='string'||payload.role==='demo')
    return NextResponse.json({error:'نسخهٔ عمومی فقط برای مشاهده است.'},{status:403});
  }catch{
   return NextResponse.json({error:'برای ویرایش لازم است وارد حساب خصوصی شوید.'},{status:403});
  }
 }
 return NextResponse.next();
}
export const config={matcher:['/api/:path*']};
