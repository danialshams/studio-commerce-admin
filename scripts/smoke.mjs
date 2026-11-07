// Integration smoke test: two separate tenants, team invitations, role enforcement and CRM workflows.
// Runs only against a disposable PostgreSQL database, never production.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const base=process.env.SMOKE_URL||'http://127.0.0.1:3000';
const prefix=randomUUID().slice(0,8);
const passwords={owner:'correct-horse-battery-secret-123',viewer:'some-unique-long-password-123'};
async function api(path,{method='GET',body,cookie,headers={}}={}){
 const res=await fetch(base+path,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...headers},body:body?JSON.stringify(body):undefined,redirect:'manual'});
 const text=await res.text();let data;try{data=JSON.parse(text)}catch{data=text}
 return {status:res.status,data,cookie:res.headers.get('set-cookie')?.split(';')[0]||null};
}
const must=(r,status,label)=>{assert.equal(r.status,status,`${label} expected ${status}, got ${r.status}: ${JSON.stringify(r.data).slice(0,300)}`);return r.data};
const register=async(label)=>{
 const r=await api('/api/auth/signup',{method:'POST',body:{name:'Integration '+label,company:'Tenant '+label,email:`${label}-${prefix}@example.test`,password:passwords.owner}});
 must(r,200,'signup '+label);assert.ok(r.cookie);return r.cookie;
};
const a=await register('a'),b=await register('b');
must(await api('/api/data/contacts',{method:'POST',cookie:a,headers:{Origin:'https://external.example'},body:{name:'Cross-site attempt'}}),403,'cross-origin write rejected');
const contact=must(await api('/api/data/contacts',{method:'POST',cookie:a,body:{name:'Client A',phone:'09120000001',status:'lead'}}),201,'create A contact').item;
assert.ok(contact.id);
must(await api('/api/data/deals',{method:'POST',cookie:a,body:{title:'Negative deal',amount:-200}}),400,'invalid negative amount');
must(await api('/api/data/tasks',{method:'POST',cookie:a,body:{title:'Bad date',due_at:'2026-02-30'}}),400,'invalid date');
const aList=must(await api('/api/data/contacts',{cookie:a}),200,'A list');assert.ok(aList.items.some(x=>x.id===contact.id));
const bList=must(await api('/api/data/contacts',{cookie:b}),200,'B list');assert.ok(!bList.items.some(x=>x.id===contact.id));
must(await api('/api/data/contacts',{method:'PATCH',cookie:b,body:{id:contact.id,name:'Attacked'}}),404,'cross tenant patch');
must(await api('/api/data/deals',{method:'POST',cookie:b,body:{title:'Foreign deal',contact_id:contact.id,amount:1000}}),400,'cross tenant reference');
const rule=must(await api('/api/data/automation_rules',{method:'POST',cookie:a,body:{title:'New lead follow-up',event:'contacts.created',action:'task',payload:'Call the new lead',enabled:true}}),201,'workflow create').item;
assert.ok(rule.id);
const c2=must(await api('/api/data/contacts',{method:'POST',cookie:a,body:{name:'Second client',status:'lead'}}),201,'trigger workflow').item;
assert.ok(c2.id);
const taskList=must(await api('/api/data/tasks',{cookie:a}),200,'tasks list');assert.ok(taskList.items.some(t=>t.title==='Call the new lead'));
const ticket=must(await api('/api/data/tickets',{method:'POST',cookie:a,body:{title:'Support request',contact_id:contact.id,status:'open',description:'Example issue'}}),201,'ticket create').item;
must(await api('/api/ticket-comments',{method:'POST',cookie:a,body:{ticketId:ticket.id,body:'We are investigating.'}}),201,'ticket comment');
const comments=must(await api('/api/ticket-comments?ticketId='+ticket.id,{cookie:a}),200,'ticket comments');assert.equal(comments.items.length,1);
must(await api('/api/data/contracts',{method:'POST',cookie:a,body:{number:'TEST-'+prefix,title:'Website agreement',contact_id:contact.id,amount:420000,status:'draft'}}),201,'contract');
must(await api('/api/data/interactions',{method:'POST',cookie:a,body:{title:'Follow-up call',kind:'call',contact_id:contact.id}}),201,'interaction');
must(await api('/api/import/contacts',{method:'POST',cookie:a,body:{rows:[{name:'Imported CSV person',phone:'09120000002',status:'prospect'}]}}),200,'CSV import');
const csv=await api('/api/export?entity=contacts',{cookie:a});assert.equal(csv.status,200);assert.match(csv.data,/Imported CSV person/);
const invite=must(await api('/api/team',{method:'POST',cookie:a,body:{email:`viewer-${prefix}@example.test`,role:'viewer'}}),200,'invite');
const token=new URL(invite.inviteUrl).searchParams.get('token');assert.ok(token);
const accepted=await api('/api/auth/accept-invite',{method:'POST',body:{token,name:'Read Only',password:passwords.viewer}});must(accepted,200,'accept invite');assert.ok(accepted.cookie);
must(await api('/api/data/contacts',{method:'POST',cookie:accepted.cookie,body:{name:'Illicit create'}}),403,'viewer write rejected');
must(await api('/api/data/contacts',{cookie:accepted.cookie}),200,'viewer read allowed');
const members=must(await api('/api/team',{cookie:a}),200,'members');const v=members.members.find(x=>x.email===`viewer-${prefix}@example.test`);assert.ok(v);
must(await api('/api/team',{method:'PATCH',cookie:a,body:{id:v.id,is_active:false}}),200,'disable member');
must(await api('/api/data/contacts',{cookie:accepted.cookie}),401,'disabled member rejected');
const notifications=must(await api('/api/notifications',{cookie:a}),200,'notifications');assert.ok(notifications.items.length>0);
must(await api('/api/notifications',{method:'PATCH',cookie:a,body:{id:notifications.items[0].id}}),200,'mark read');
must(await api('/api/cron/reminders'),401,'cron requires secret');
const today=new Date().toISOString().slice(0,10);
must(await api('/api/data/tasks',{method:'POST',cookie:a,body:{title:'Due today for integration test',due_at:today}}),201,'due today task');
const secret=process.env.CRON_SECRET;
assert.ok(secret&&secret.length>=32);
const first=must(await api('/api/cron/reminders',{method:'POST',headers:{Authorization:'Bearer '+secret}}),200,'first authorized cron');
assert.ok(first.generated>=1,'today reminder generated');
const second=must(await api('/api/cron/reminders',{method:'POST',headers:{Authorization:'Bearer '+secret}}),200,'repeat authorized cron');
assert.equal(second.generated,0,'cron does not duplicate generated reminders');
const cron=await api('/api/cron/reminders',{method:'POST'});assert.equal(cron.status,401);
const changed=await api('/api/settings',{method:'PUT',cookie:a,body:{old:passwords.owner,password:'another-unique-long-password-123'}});must(changed,200,'password update');
must(await api('/api/data/contacts',{cookie:a}),401,'old session revoked');
console.log('SMOKE PASS: tenant isolation, CRUD, workflows, tickets, contracts, interactions, CSV, team invite, RBAC, origin guard, due reminders, notifications, revocation.');
