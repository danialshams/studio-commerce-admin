import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
export const COOKIE_NAME = "studio_admin_session";
const ONE_WEEK = 7 * 24 * 3600 * 1000;
export function passwordHash(password: string) {
  const salt=randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password,salt,64).toString("hex")}`;
}
export function verifyPassword(password: string, encoded: string) {
  const [algo,salt,hex]=encoded.split(":");
  if(algo!=="scrypt" || !salt || !hex || hex.length!==128) return false;
  const expected=Buffer.from(hex,"hex");
  const actual=scryptSync(password,salt,expected.length);
  return timingSafeEqual(actual,expected);
}
export function hashToken(token:string){return createHash("sha256").update(token).digest("hex");}
export async function createSession(adminId:string){
  const token=randomBytes(32).toString("base64url");
  const expiresAt=new Date(Date.now()+ONE_WEEK);
  await db.session.create({data:{adminId,tokenHash:hashToken(token),expiresAt}});
  (await cookies()).set(COOKIE_NAME,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",expires:expiresAt});
}
export async function clearSession(){
  const jar=await cookies();const token=jar.get(COOKIE_NAME)?.value;
  if(token) await db.session.deleteMany({where:{tokenHash:hashToken(token)}});
  jar.delete(COOKIE_NAME);
}
export async function currentAdmin(){
  const token=(await cookies()).get(COOKIE_NAME)?.value;
  if(!token)return null;
  const session=await db.session.findUnique({where:{tokenHash:hashToken(token)},include:{admin:true}});
  if(!session || session.expiresAt.getTime()<=Date.now())return null;
  return {id:session.admin.id,email:session.admin.email};
}
export function sameOrigin(request:NextRequest){
  const origin=request.headers.get("origin");
  if(!origin) return false;
  try {return new URL(origin).host===request.nextUrl.host && new URL(origin).protocol===request.nextUrl.protocol;}catch{return false;}
}
export async function requireApiAdmin(request:NextRequest){
  if(!sameOrigin(request) && !["GET","HEAD"].includes(request.method))return {error:"درخواست از مبدا نامعتبر است",status:403};
  const admin=await currentAdmin();
  if(!admin)return {error:"برای ادامه وارد پنل شوید",status:401};
  return {admin};
}
export function loginKey(_request:NextRequest,email:string){
  // Single-admin install: rate-limit by account, never by spoofable IP headers.
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}
