import { NextResponse } from 'next/server';
import { db, transaction } from '@/lib/db';
import { requireSession, fail, textVal, moneyVal, isoDate, isUUID, actionText } from '@/lib/common';
type Key='contacts'|'deals'|'tasks'|'documents'|'activities';
type Field={name:string;type:'text'|'money'|'number'|'date'|'foreign'|'enum';max?:number;allowed?:string[]};
const fields:Record<string,Field[]>={
 contacts:[{name:'name',type:'text',max:180},{name:'company',type:'text',max:180},{name:'email',type:'text',max:255},{name:'phone',type:'text',max:40},{name:'status',type:'enum',allowed:['lead','prospect','customer','inactive']},{name:'source',type:'text',max:100},{name:'tags',type:'text',max:400},{name:'notes',type:'text',max:5000}],
 deals:[{name:'title',type:'text',max:180},{name:'contact_id',type:'foreign'},{name:'amount',type:'money'},{name:'stage',type:'enum',allowed:['new','qualified','proposal','negotiation','won','lost']},{name:'probability',type:'number'},{name:'expected_at',type:'date'},{name:'notes',type:'text',max:5000}],
 tasks:[{name:'title',type:'text',max:200},{name:'contact_id',type:'foreign'},{name:'deal_id',type:'foreign'},{name:'priority',type:'enum',allowed:['low','normal','high','urgent']},{name:'status',type:'enum',allowed:['todo','doing','done']},{name:'due_at',type:'date'},{name:'notes',type:'text',max:5000}],
 documents:[{name:'number',type:'text',max:40},{name:'title',type:'text',max:200},{name:'kind',type:'enum',allowed:['quote','invoice']},{name:'contact_id',type:'foreign'},{name:'amount',type:'money'},{name:'status',type:'enum',allowed:['draft','sent','accepted','paid','cancelled']},{name:'due_at',type:'date'},{name:'notes',type:'text',max:5000}]
};
function entityOf(s:string):Key|null {return ['contacts','deals','tasks','documents','activities'].includes(s)?s as Key:null}
function cleanup(e:Key,body:Record<string,unknown>){const result:Record<string,unknown>={};for(const f of fields[e]||[]){if(!Object.hasOwn(body,f.name))continue;const v=body[f.name];if(f.type==='text')result[f.name]=textVal(v,f.max||250);if(f.type==='money')result[f.name]=moneyVal(v);if(f.type==='number')result[f.name]=Math.max(0,Math.min(100,Math.round(Number(v)||0)));if(f.type==='date')result[f.name]=isoDate(v);if(f.type==='foreign')result[f.name]=isUUID(v)?v:null;if(f.type==='enum')result[f.name]=f.allowed?.includes(String(v))?String(v):f.allowed?.[0];}return result}
async function validReferences(c:{query:(q:string,v?:unknown[])=>Promise<{rowCount:number|null}>},org:string,r:Record<string,unknown>){
for (const [key,table] of [['contact_id','contacts'],['deal_id','deals']] as const){if(!r[key])continue;const a=await c.query(`SELECT id FROM ${table} WHERE id=$1 AND org_id=$2`,[r[key],org]);if(!a.rowCount)return false;}return true;
}
const paramsKey={GET:0};
export async function GET(req:Request,{params}:{params:Promise<{entity:string}>}){
 const s=await requireSession();if(!s)return fail('لطفاً وارد شوید.',401);const e=entityOf((await params).entity);if(!e)return fail('بخش نامعتبر',404);
 try {const url=new URL(req.url),q=(url.searchParams.get('q')||'').trim().slice(0,100),page=Math.min(1000,Math.max(1,Number(url.searchParams.get('page'))||1));
 const clause=q?(e==='contacts'?" AND (name ILIKE $2 OR company ILIKE $2 OR phone ILIKE $2)":e==='activities'?" AND description ILIKE $2":" AND title ILIKE $2"):'',values=q?[s.orgId,`%${q}%`]:[s.orgId];
 const data=await db().query(`SELECT * FROM ${e} WHERE org_id=$1${clause} ORDER BY created_at DESC LIMIT 100 OFFSET $${values.length+1}`,[...values,(page-1)*100]);
 return NextResponse.json({items:data.rows,page,hasMore:data.rows.length===100});
 } catch(err){console.error('GET data',err);return fail('خطا در دریافت داده‌ها.',500)}
}
export async function POST(req:Request,{params}:{params:Promise<{entity:string}>}){
 const s=await requireSession();if(!s)return fail('لطفاً وارد شوید.',401);const e=entityOf((await params).entity);if(!e||e==='activities')return fail('عملیات مجاز نیست.',403);
 try {const b=await req.json(),r=cleanup(e,b);if(!textVal(r.name||r.title,200))return fail('عنوان یا نام الزامی است.');if(e==='documents'&&!textVal(r.number,40))return fail('شماره سند الزامی است.');
 const result=await transaction(async c=>{
 if(!await validReferences(c,s.orgId,r))throw new Error('invalid-ref');
 const keys=Object.keys(r);const cols=['org_id',...keys];const values=[s.orgId,...Object.values(r)];const marks=cols.map((_,i)=>`$${i+1}`);
 const inserted=await c.query(`INSERT INTO ${e} (${cols.join(',')}) VALUES(${marks.join(',')}) RETURNING *`,values);
 const item=inserted.rows[0];await c.query('INSERT INTO activities(org_id,user_id,entity,entity_id,action,description) VALUES($1,$2,$3,$4,$5,$6)',[s.orgId,s.userId,e,item.id,'create',`ایجاد ${actionText[e]}: ${item.name||item.title}`]);
 await c.query('INSERT INTO notifications(org_id,title,body) VALUES($1,$2,$3)',[s.orgId,`ثبت ${actionText[e]}`,String(item.name||item.title).slice(0,180)]);
 if(e==='contacts'&&item.status==='lead') await c.query("INSERT INTO tasks(org_id,contact_id,title,priority,due_at) VALUES($1,$2,$3,'normal',CURRENT_DATE + 1)",[s.orgId,item.id,`پیگیری مشتری: ${item.name}`]);
 return item;});return NextResponse.json({item:result},{status:201});
 }catch(err){if(err instanceof Error&&err.message==='invalid-ref')return fail('رکورد مرتبط معتبر نیست.',400);if((err as {code?:string}).code==='23505')return fail('شماره سند تکراری است.',409);console.error('POST',err);return fail('ذخیره انجام نشد.',500)}
}
export async function PATCH(req:Request,{params}:{params:Promise<{entity:string}>}){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);const e=entityOf((await params).entity);if(!e||e==='activities')return fail('عملیات مجاز نیست.',403);
 try{const b=await req.json();if(!isUUID(b.id))return fail('شناسه نامعتبر');const r=cleanup(e,b);const keys=Object.keys(r);if(!keys.length)return fail('تغییری ارسال نشده است.');
 const item=await transaction(async c=>{if(!await validReferences(c,s.orgId,r))throw new Error('invalid-ref');const columns=keys.map((k,i)=>`${k}=$${i+3}`);const v=[s.orgId,b.id,...Object.values(r)];const found=await c.query(`UPDATE ${e} SET ${columns.join(',')},updated_at=now() WHERE org_id=$1 AND id=$2 RETURNING *`,v);if(!found.rowCount)return null;await c.query('INSERT INTO activities(org_id,user_id,entity,entity_id,action,description) VALUES($1,$2,$3,$4,$5,$6)',[s.orgId,s.userId,e,b.id,'update',`ویرایش ${actionText[e]}: ${found.rows[0].name||found.rows[0].title}`]);return found.rows[0]});if(!item)return fail('رکورد پیدا نشد.',404);return NextResponse.json({item});}
 catch(err){if(err instanceof Error&&err.message==='invalid-ref')return fail('رکورد مرتبط معتبر نیست.');if((err as {code?:string}).code==='23505')return fail('شماره سند تکراری است.',409);console.error('PATCH',err);return fail('ویرایش انجام نشد.',500)}
}
export async function DELETE(req:Request,{params}:{params:Promise<{entity:string}>}){
 const s=await requireSession();if(!s)return fail('ورود لازم است.',401);const e=entityOf((await params).entity);if(!e||e==='activities')return fail('عملیات مجاز نیست.',403);
 try{const b=await req.json();if(!isUUID(b.id))return fail('شناسه نامعتبر');const ok=await transaction(async c=>{const r=await c.query(`DELETE FROM ${e} WHERE org_id=$1 AND id=$2 RETURNING *`,[s.orgId,b.id]);if(!r.rowCount)return false;await c.query('INSERT INTO activities(org_id,user_id,entity,entity_id,action,description) VALUES($1,$2,$3,$4,$5,$6)',[s.orgId,s.userId,e,b.id,'delete',`حذف ${actionText[e]}: ${r.rows[0].name||r.rows[0].title}`]);return true;});return ok?NextResponse.json({ok:true}):fail('رکورد پیدا نشد.',404)}catch(err){console.error('DELETE',err);return fail('حذف انجام نشد.',500)}
}
