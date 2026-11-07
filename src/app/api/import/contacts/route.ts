import {NextResponse} from 'next/server';
import {db,transaction} from '@/lib/db';
import {requireSession,fail,textVal} from '@/lib/common';
import {authorize} from '@/lib/access';
export async function POST(req:Request){const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 if(!authorize(s,'contacts',true))return fail('دسترسی ندارید.',403);
 const body=await req.json().catch(()=>null),rows=body?.rows;
 if(!Array.isArray(rows)||rows.length<1||rows.length>500)return fail('فهرست باید بین ۱ تا ۵۰۰ ردیف داشته باشد.');
 if(rows.some((r:unknown)=>!r||typeof r!=='object'||Array.isArray(r)))return fail('فرمت نامعتبر است.');
 let created=0,skipped=0;
 try{await transaction(async c=>{
  for(const row of rows){const r=row as Record<string,unknown>;
   const name=textVal(r.name,180),phone=textVal(r.phone,40),email=textVal(r.email,255).toLowerCase();
   if(name.length<2){skipped++;continue}
   if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){skipped++;continue}
   if(email||phone){const exists=await c.query('SELECT id FROM contacts WHERE org_id=$1 AND (($2 <> \'\' AND lower(email)=$2) OR ($3 <> \'\' AND phone=$3)) LIMIT 1',[s.orgId,email,phone]);if(exists.rowCount){skipped++;continue}}
   await c.query('INSERT INTO contacts(org_id,name,company,phone,email,source,notes,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[s.orgId,name,textVal(r.company,180),phone,email,textVal(r.source,100),textVal(r.notes,5000),['lead','prospect','customer','inactive'].includes(String(r.status))?r.status:'lead']);created++;
  }
  await c.query('INSERT INTO activities(org_id,user_id,entity,action,description) VALUES($1,$2,$3,$4,$5)',[s.orgId,s.userId,'contacts','import',`ورود گروهی مخاطبان: ${created} ثبت، ${skipped} رد`]);
 });return NextResponse.json({ok:true,created,skipped});
 }catch(e){console.error('import',e);return fail('ورود اطلاعات ناموفق بود.',500)}
}
