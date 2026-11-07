import {NextResponse} from 'next/server';
import {requireSession,fail} from '@/lib/common';
import {db,transaction} from '@/lib/db';
import {seedDemoData} from '@/lib/demo-data';

export const runtime='nodejs';
export async function GET(){
 const s=await requireSession();
 if(!s)return fail('ورود لازم است.',401);
 if(s.role!=='owner')return fail('فقط مالک مجموعه اجازهٔ مدیریت اطلاعات نمونه را دارد.',403);
 const result=await db().query('SELECT version,seeded_at FROM demo_seed_runs WHERE org_id=$1',[s.orgId]);
 return NextResponse.json({
  seeded:Boolean(result.rowCount),
  seededAt:result.rows[0]?.seeded_at??null
 },{headers:{'Cache-Control':'no-store'}});
}
export async function POST(){
 const s=await requireSession();
 if(!s)return fail('ورود لازم است.',401);
 if(s.role!=='owner')return fail('فقط مالک مجموعه اجازهٔ افزودن اطلاعات نمونه را دارد.',403);
 try{
  const result=await transaction(c=>seedDemoData(c,s.orgId,s.userId));
  return NextResponse.json({
   ok:true,seeded:result.seeded,
   counts:result.counts,
   message:result.seeded?'اطلاعات نمونه اضافه شد.':'اطلاعات نمونه قبلاً در این مجموعه اضافه شده است.'
  },{status:result.seeded?201:200});
 }catch(err){
  console.error('Demo seed failed',err);
  return fail('افزودن اطلاعات نمونه انجام نشد.',500);
 }
}
