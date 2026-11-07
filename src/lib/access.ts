import { db } from './db';
import { getSession, type Session } from './auth';
export type Role='owner'|'admin'|'sales'|'support'|'viewer';
const readModules:Record<Role,string[]>={
 owner:['*'],admin:['*'],
 sales:['contacts','deals','tasks','documents','contracts','activities','automation_rules','tickets'],
 support:['contacts','tasks','tickets','activities'],viewer:['contacts','deals','tasks','documents','contracts','tickets','activities']
};
const writeModules:Record<Role,string[]>={
 owner:['*'],admin:['*'],sales:['contacts','deals','tasks','documents','contracts','tickets'],
 support:['contacts','tasks','tickets'],viewer:[]
};
export function authorize(s:Session,entity:string,write=false){
 const role=s.role as Role;const modules=(write?writeModules:readModules)[role]||[];
 return modules.includes('*')||modules.includes(entity);
}
export function manageTeam(s:Session){return s.role==='owner'||s.role==='admin'}
export async function currentSession():Promise<Session|null>{
 const jwt=await getSession();if(!jwt)return null;
 const result=await db().query('SELECT id,org_id,name,role,is_active,session_rev FROM users WHERE id=$1 AND org_id=$2',[jwt.userId,jwt.orgId]);
 const u=result.rows[0];if(!u||!u.is_active||Number(u.session_rev)!==Number(jwt.rev??0))return null;
 return {userId:u.id,orgId:u.org_id,name:u.name,role:u.role,rev:u.session_rev};
}
