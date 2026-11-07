import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
// Readiness endpoint: verifies the live PostgreSQL connection and additive
// integration migrations without returning credentials, tenant data or SQL.
export async function GET(){
 try{
  const r=await db().query(`SELECT (
   to_regclass('public.contacts') IS NOT NULL
   AND to_regclass('public.message_outbox') IS NOT NULL
   AND to_regclass('public.signature_requests') IS NOT NULL
  ) AS ready`);
  if(!r.rows[0]?.ready)return NextResponse.json({ok:false},{status:503,headers:{'Cache-Control':'no-store'}});
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({ok:false},{status:503,headers:{'Cache-Control':'no-store'})}
}
