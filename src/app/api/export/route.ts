import {db} from '@/lib/db';
import {requireSession,fail} from '@/lib/common';
import {authorize} from '@/lib/access';
const allowed=['contacts','deals','tasks','documents','contracts','tickets','interactions','automation_rules','activities'];
const csvCell=(v:unknown)=>{
 let value=String(v??'').replace(/\r?\n/g,' ');
 // Prevent spreadsheet formula execution when opening untrusted CRM strings.
 if(/^[\s]*[=+@\-]/.test(value))value="'"+value;
 return '"'+value.replace(/"/g,'""')+'"';
};
export async function GET(req:Request){const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 const entity=new URL(req.url).searchParams.get('entity')||'';
 if(!allowed.includes(entity)||!authorize(s,entity))return fail('دسترسی مجاز نیست.',403);
 try{const r=await db().query(`SELECT * FROM ${entity} WHERE org_id=$1 ORDER BY created_at DESC LIMIT 20001`,[s.orgId]);
  if(r.rows.length>20000)return fail('برای خروجی بیش از ۲۰ هزار رکورد از پشتیبانی کمک بگیرید.',413);
  const columns=r.fields.map(f=>f.name).filter(n=>!['org_id','password_hash','token_hash'].includes(n));
  const text=['\uFEFF'+columns.map(csvCell).join(','),...r.rows.map(row=>columns.map(c=>csvCell(row[c])).join(','))].join('\r\n');
  return new Response(text,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="daira-${entity}.csv"`,'Cache-Control':'private, no-store'}});
 }catch(e){console.error('export',e);return fail('خروجی ناموفق بود.',500)}
}
