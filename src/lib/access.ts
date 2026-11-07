import { db } from './db';
import { getSession, type Session } from './auth';
export type Role='owner'|'admin'|'sales'|'support'|'viewer'|'demo';
// Reserved fictional workspace. Never redirect visitor traffic into customer tenants.
export const PUBLIC_DEMO_ORG='d0a1da1a-0000-4000-8000-000000000001';
export const PUBLIC_DEMO_USER='d0a1da1a-0000-4000-8000-000000000002';
const readModules:Record<Role,string[]>={
 owner:['*'],admin:['*'],demo:['*'],
 sales:['contacts','deals','tasks','documents','contracts','interactions','activities','automation_rules','tickets'],
 support:['contacts','tasks','tickets','interactions','activities'],viewer:['contacts','deals','tasks','documents','contracts','interactions','tickets','activities']
};
const writeModules:Record<Role,string[]>={
 owner:['*'],admin:['*'],sales:['contacts','deals','tasks','documents','contracts','interactions','tickets'],
 support:['contacts','tasks','tickets'],viewer:[],demo:[]
};
export function authorize(s:Session,entity:string,write=false){
 const role=s.role as Role;const modules=(write?writeModules:readModules)[role]||[];
 return modules.includes('*')||modules.includes(entity);
}
export function manageTeam(s:Session){return s.role==='owner'||s.role==='admin'}
export async function currentSession():Promise<Session|null>{
 const jwt=await getSession();
 if(!jwt)return {userId:PUBLIC_DEMO_USER,orgId:PUBLIC_DEMO_ORG,name:'بازدیدکنندهٔ دمو',role:'demo',rev:0};
 const result=await db().query('SELECT id,org_id,name,role,is_active,session_rev FROM users WHERE id=$1 AND org_id=$2',[jwt.userId,jwt.orgId]);
 const u=result.rows[0];if(!u||!u.is_active||Number(u.session_rev)!==Number(jwt.rev??0))return null;
 return {userId:u.id,orgId:u.org_id,name:u.name,role:u.role,rev:u.session_rev};
}
