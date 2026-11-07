import type {PoolClient} from 'pg';
type Event='contacts.created'|'deals.won'|'tickets.created'|'contracts.signed';
export async function runWorkflows(c:PoolClient,orgId:string,userId:string,event:Event,detail:{id:string;title:string;contactId?:string|null}){
 const rules=await c.query('SELECT id,title,action,payload FROM automation_rules WHERE org_id=$1 AND enabled=true AND event=$2',[orgId,event]);
 for(const rule of rules.rows.slice(0,30)){
  if(rule.action==='notification'){
   await c.query('INSERT INTO notifications(org_id,entity,title,body) VALUES($1,$2,$3,$4)',[orgId,event.split('.')[0],rule.title,`${detail.title}: ${rule.payload}`.slice(0,500)]);
  } else if(rule.action==='task'){
   await c.query("INSERT INTO tasks(org_id,contact_id,title,notes,status,priority,due_at) VALUES($1,$2,$3,$4,'todo','normal',CURRENT_DATE+1)",[
    orgId,detail.contactId||null,rule.payload.slice(0,200)||`پیگیری ${detail.title}`,`قانون: ${rule.title} / ${detail.title}`]);
  }
  await c.query('INSERT INTO activities(org_id,user_id,entity,entity_id,action,description) VALUES($1,$2,$3,$4,$5,$6)',[orgId,userId,'automation_rules',rule.id,'execute',`اجرای قانون: ${rule.title}`]);
 }
}
