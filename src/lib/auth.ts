import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
export type Session = { userId: string; orgId: string; name: string; role: string };
const cookieName='daira_crm_session';
function secret() { const s=process.env.SESSION_SECRET; if (!s || s.length<32) throw new Error('SESSION_SECRET must be at least 32 characters'); return new TextEncoder().encode(s); }
export async function setSession(s:Session) {
  const jwt=await new SignJWT(s).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret());
  (await cookies()).set(cookieName,jwt,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7});
}
export async function getSession():Promise<Session|null> {
  const t=(await cookies()).get(cookieName)?.value; if(!t) return null;
  try { const {payload}=await jwtVerify(t,secret()); if(typeof payload.userId!=='string'||typeof payload.orgId!=='string') return null; return {userId:payload.userId,orgId:payload.orgId,name:String(payload.name||''),role:String(payload.role||'member')}; } catch { return null; }
}
export async function clearSession() { (await cookies()).delete(cookieName); }
