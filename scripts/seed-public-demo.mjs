// Intentional build-time fixture. NEVER copy customer records into this workspace.
// Fixed identifiers are public, not authentication secrets.
import pg from 'pg';
import bcrypt from 'bcryptjs';
import {randomBytes,randomUUID} from 'node:crypto';
const ORG='d0a1da1a-0000-4000-8000-000000000001';
const USER='d0a1da1a-0000-4000-8000-000000000002';
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required');
const url=new URL(process.env.DATABASE_URL);
if(['require','prefer','verify-ca'].includes(url.searchParams.get('sslmode')||''))url.searchParams.set('sslmode','verify-full');
const c=new pg.Client({connectionString:url.toString(),connectionTimeoutMillis:15000});
const date=(n)=>new Date(Date.now()+n*86400000).toISOString().slice(0,10);
const past=(n)=>new Date(Date.now()-n*86400000);
const stages=['new','qualified','proposal','negotiation','won','lost'];
const statuses=['lead','prospect','customer','customer','prospect','lead','inactive'];
const faNames=['سارا','امیرحسین','نگار','علی','مهسا','محمد','پرنیا','آرمان','الناز','کیان','شیوا','پیمان','نرگس','پویا','یاسمین','ماهان','سحر','سهیل','شادی','یوسف'];
const lastNames=['احمدی','رضایی','کریمی','موسوی','شریفی','پارسا','قاسمی','بهرامی','مرادی','نادری','رستمی','حسینی','ملکی','رفیعی','اکبری','عباسی','بیات'];
const businesses=['استودیو نگاه','فروشگاه رایا','آکادمی روشنا','شرکت دنا','کلینیک مهر','مجموعه نارون','گروه نوآوران','بوتیک نیکا','شرکت فراز','خانه طراحان','کافه روم','تولیدی سروش','مؤسسه ایرانیان','آژانس ابر','گالری آبان','فروشگاه طوس','استودیو صبح','شرکت چکاوک','خانه مد هور','گروه کارا','مرکز دانا','شرکت نارنج','کارگاه کارن','آژانس رهی'];
const services=['راه‌اندازی پنل فروش','طراحی فروشگاه اینترنتی','سامانه مدیریت مشتریان','داشبورد مدیریت پروژه','اتوماسیون پاسخگویی','مدیریت سفارش و انبار','بازطراحی وب‌سایت','پیاده‌سازی سیستم رزرو','باشگاه مشتریان','بهینه‌سازی فرایند فروش','یکپارچه‌سازی داده‌ها','طراحی پورتال سازمانی'];
const topics=['پیگیری سفارش و پرداخت','بررسی مشکل ورود','درخواست گزارش اختصاصی','راهنمایی استفاده از پنل','درخواست بهبود رابط کاربری','هماهنگی جلسه آموزش','بررسی نمایش موبایل','درخواست تغییر در فاکتور','پیگیری زمان تحویل','پشتیبانی اتصال سرویس'];
const roles=['admin','sales','sales','sales','support','support','viewer','sales','support','viewer'];
function rowsInsert(table,rows) {
 if(!rows.length)return Promise.resolve();
 const keys=Object.keys(rows[0]),values=[];
 const marks=rows.map((r,i)=>'('+keys.map((k,j)=>{values.push(r[k]??null);return '$'+(i*keys.length+j+1)}).join(',')+')');
 return c.query(`INSERT INTO ${table} (${keys.join(',')}) VALUES ${marks.join(',')}`,values);
}
let counts={};
try {
 await c.connect();await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(903117344)');
 await c.query("INSERT INTO organizations(id,name) VALUES($1,'دایرا | پیش‌نمایش عمومی') ON CONFLICT(id) DO NOTHING",[ORG]);
 const existing=await c.query('SELECT version FROM public_demo_versions WHERE org_id=$1',[ORG]);
 if(existing.rowCount){await c.query('COMMIT');console.log('Public CRM showcase already seeded; unchanged.');process.exit(0)}
 const randomHash=await bcrypt.hash(randomBytes(32).toString('hex'),12);
 await c.query(`INSERT INTO users(id,org_id,name,email,password_hash,role)
  VALUES($1,$2,'بازدیدکنندهٔ دمو','public-showcase@daira.example',$3,'demo')
  ON CONFLICT(id) DO NOTHING`,[USER,ORG,randomHash]);
 const members=Array.from({length:10},(_,i)=>({
  id:randomUUID(),org_id:ORG,name:faNames[(i*3+2)%faNames.length]+' '+lastNames[(i*5)%lastNames.length],
  email:`showcase-member-${i+1}@daira.example`,password_hash:randomHash,role:roles[i],is_active:true,
  created_at:past(i*7+3)
 }));
 await rowsInsert('users',members);counts.members=members.length;
 const contacts=Array.from({length:84},(_,i)=>({
  id:randomUUID(),org_id:ORG,
  name:faNames[(i*7+3)%faNames.length]+' '+lastNames[(i*11+1)%lastNames.length],
  company:businesses[i%businesses.length]+(i>=24?' '+Math.ceil(i/24):''),
  email:`showcase-client-${String(i+1).padStart(3,'0')}@daira.example`,
  phone:'شمارهٔ آزمایشی '+String(i+1).padStart(3,'0'),
  source:['اینستاگرام','معرفی دوستان','وب‌سایت','گوگل','نمایشگاه'][i%5],
  status:statuses[i%statuses.length],score:(i*13+17)%100,
  tags:'دمو، '+['همکاری جدید','مشتری وفادار','سازمانی','فروش اینترنتی','در حال مذاکره'][i%5],
  notes:'[دمو] مشخصات و تمامی ارتباطات این مخاطب ساختگی است و نباید برای تماس واقعی استفاده شود.',
  delivery_consent:false,created_at:past((i*3)%160+2)
 }));
 await rowsInsert('contacts',contacts);counts.contacts=contacts.length;
 const deals=Array.from({length:76},(_,i)=>{
  const stage=stages[(i*7+Math.floor(i/6))%6],won=stage==='won';
  return {
   id:randomUUID(),org_id:ORG,contact_id:contacts[(i*13)%contacts.length].id,
   title:services[i%services.length]+' · '+businesses[(i*7)%businesses.length],
   amount:(12+(i*7)%165)*1000000,stage,
   probability:won?100:stage==='lost'?0:[20,35,50,75][i%4],
   expected_at:date((i%40)-11),won_at:won?past((i*17)%170+2):null,
   assignee_id:members[i%members.length].id,
   notes:'[دمو] فرصت فروش نمونه برای مشاهدهٔ مراحل قیف و نمودارهای تحلیلی.',
   created_at:past((i*7)%180+1)
  };
 });
 await rowsInsert('deals',deals);counts.deals=deals.length;
 const tasks=Array.from({length:92},(_,i)=>({
  id:randomUUID(),org_id:ORG,contact_id:contacts[(i*7)%contacts.length].id,
  deal_id:deals[i%deals.length].id,assignee_id:members[i%members.length].id,
  title:['تماس با مشتری','ارسال پروپوزال','جلسهٔ بررسی نیاز','پیگیری قرارداد','بازبینی طرح','ارسال گزارش','تأیید نهایی سفارش','تهیهٔ پیش‌فاکتور'][i%8]
   +' · '+businesses[(i*3)%businesses.length],
  priority:['normal','high','low','urgent'][i%4],
  status:['todo','doing','done','todo','doing'][i%5],
  due_at:date((i*5)%30-9),notes:'[دمو] وظیفهٔ نمونه؛ یادآوری زمان‌بندی‌شده برای این مورد ارسال نمی‌شود.',
  created_at:past((i*2)%110+1)
 }));
 await rowsInsert('tasks',tasks);counts.tasks=tasks.length;
 const documents=Array.from({length:64},(_,i)=>({
  id:randomUUID(),org_id:ORG,contact_id:contacts[(i*5)%contacts.length].id,
  number:'SHOW-'+(i%3===0?'QUO-':'INV-')+String(i+1001),
  title:(i%3===0?'پیش‌فاکتور ':'فاکتور ')+services[i%services.length]+' · '+businesses[(i*3)%businesses.length],
  kind:i%3===0?'quote':'invoice',amount:(11+(i*9)%130)*1000000,
  status:['draft','sent','accepted','paid','sent','paid'][i%6],
  due_at:date((i%45)-15),notes:'[دمو] سند مالی فرضی؛ هیچ پرداخت واقعی ثبت نشده است.',
  created_at:past((i*4)%160+1)
 }));
 await rowsInsert('documents',documents);counts.documents=documents.length;
 const contracts=Array.from({length:38},(_,i)=>({
  id:randomUUID(),org_id:ORG,contact_id:contacts[(i*7)%contacts.length].id,
  deal_id:deals[(i*3)%deals.length].id,
  number:'SHOW-CNT-'+String(1000+i),title:'قرارداد '+services[i%services.length]+' · '+businesses[i%businesses.length],
  amount:(24+(i*13)%160)*1000000,
  status:['draft','sent','signed','active','completed','draft','sent'][i%7],
  start_at:date((i%40)-30),end_at:date((i%110)+30),
  terms:'[دمو] این سند صرفاً نمونهٔ نمایشی است و هیچ تعهد حقوقی ایجاد نمی‌کند.',
  notes:'[دمو] وضعیت قراردادی فرضی و مستقل از سرویس امضای دیجیتال.',
  created_at:past((i*5)%160+1)
 }));
 await rowsInsert('contracts',contracts);counts.contracts=contracts.length;
 const tickets=Array.from({length:58},(_,i)=>({
  id:randomUUID(),org_id:ORG,contact_id:contacts[(i*11)%contacts.length].id,
  assignee_id:members[i%members.length].id,title:topics[i%topics.length]+' · '+businesses[(i*7)%businesses.length],
  description:'[دمو] درخواست آزمایشی مشتری برای نمایش صندوق و روند رسیدگی.',
  priority:['low','normal','high','urgent'][i%4],
  status:['open','in_progress','waiting','resolved','closed'][i%5],
  due_at:date((i%20)-5),closed_at:i%5>2?past(i%7+1):null,
  created_at:past((i*3)%120+1)
 }));
 await rowsInsert('tickets',tickets);counts.tickets=tickets.length;
 const comments=tickets.flatMap((ticket,i)=>Array.from({length:2+(i%2)},(_,j)=>({
  id:randomUUID(),org_id:ORG,ticket_id:ticket.id,
  author_id:members[(i+j)%members.length].id,
  body:'[دمو] '+['درخواست شما ثبت شد و در حال بررسی است.','برای حل مسئله جزئیات بیشتری بررسی می‌کنیم.','نسخهٔ آزمایشی آمادهٔ ارزیابی است.'][j],
  created_at:past((i*2+j)%120+1)
 })));
 await rowsInsert('ticket_comments',comments);counts.ticket_comments=comments.length;
 const interactions=Array.from({length:88},(_,i)=>({
  id:randomUUID(),org_id:ORG,contact_id:contacts[(i*17)%contacts.length].id,
  deal_id:deals[(i*3)%deals.length].id,
  title:['تماس اولیه','جلسهٔ آنلاین','ایمیل معرفی خدمات','ثبت نکات مذاکره','پیام پیگیری','جلسهٔ ارائه طرح'][i%6]
   +' · '+businesses[(i*5)%businesses.length],
  kind:['call','meeting','email','note','message'][i%5],
  direction:i%3?'outbound':'inbound',
  notes:'[دمو] گزارش ساختگی از ارتباط نمونه؛ تماس یا پیام واقعی انجام نشده است.',
  occurred_at:past((i*2)%130+1),created_at:past((i*2)%130+1)
 }));
 await rowsInsert('interactions',interactions);counts.interactions=interactions.length;
 const events=['contacts.created','deals.won','tickets.created','contracts.signed'];
 const rules=Array.from({length:18},(_,i)=>({
  id:randomUUID(),org_id:ORG,
  title:'[دمو] '+['پیگیری سرنخ','ثبت فروش موفق','اعلان تیکت','اطلاع از قرارداد','وظیفهٔ تماس','پیگیری مشتری'][i%6]+' '+(i+1),
  event:events[i%events.length],action:i%2?'notification':'task',
  payload:'پیگیری خودکار نمونه شمارهٔ '+(i+1),enabled:false
 }));
 await rowsInsert('automation_rules',rules);counts.automation_rules=rules.length;
 const activities=[...contacts.slice(0,39).map(x=>({entity:'contacts',entity_id:x.id,description:'ثبت مخاطب: '+x.name})),
  ...deals.slice(0,32).map(x=>({entity:'deals',entity_id:x.id,description:'ثبت فرصت: '+x.title})),
  ...tasks.slice(0,20).map(x=>({entity:'tasks',entity_id:x.id,description:'ثبت پیگیری: '+x.title})),
  ...tickets.slice(0,15).map(x=>({entity:'tickets',entity_id:x.id,description:'درخواست پشتیبانی: '+x.title}))];
 await rowsInsert('activities',activities.map((a,i)=>({
  id:randomUUID(),org_id:ORG,user_id:members[i%members.length].id,entity:a.entity,
  entity_id:a.entity_id,action:i%4===0?'update':'create',
  description:'[دمو] '+a.description.slice(0,450),created_at:past((i*3)%130+1)
 })));counts.activities=activities.length;
 const entityList=['contacts','deals','tasks','tickets','contracts','documents','interactions','automation_rules'];
 const notifications=Array.from({length:62},(_,i)=>({
  id:randomUUID(),org_id:ORG,entity:entityList[i%entityList.length],
  title:'[دمو] '+['مشتری جدید','فرصت تازه','موعد پیگیری','تیکت ثبت‌شده','قرارداد جدید','پیش‌فاکتور','جلسهٔ تیم','قانون غیرفعال'][i%8],
  body:'اعلان نمایشی شمارهٔ '+(i+1)+' · '+businesses[(i*5)%businesses.length],
  created_at:past((i*2)%95)
 }));
 await rowsInsert('notifications',notifications);counts.notifications=notifications.length;
 const outbox=Array.from({length:34},(_,i)=>({
  id:randomUUID(),org_id:ORG,contact_id:contacts[i].id,
  created_by:members[i%members.length].id,channel:i%3===0?'sms':'email',
  recipient:i%3===0?contacts[i].phone:contacts[i].email,
  subject:'[دمو] '+['پیشنهاد همکاری','پیگیری جلسه','اطلاع از وضعیت سفارش'][i%3],
  body:'این یک پیش‌نویس نمونه است. هیچ پیام واقعی ارسال نشده است.',
  status:'draft',created_at:past((i*3)%55+1)
 }));
 await rowsInsert('message_outbox',outbox);counts.message_outbox=outbox.length;
 const envelopes=Array.from({length:20},(_,i)=>({
  id:randomUUID(),org_id:ORG,contract_id:contracts[i].id,
  created_by:members[i%members.length].id,
  signer_name:contacts[(i*3)%contacts.length].name,
  signer_email:contacts[(i*3)%contacts.length].email,
  status:'draft',created_at:past(i*2+1)
 }));
 await rowsInsert('signature_requests',envelopes);counts.signature_requests=envelopes.length;
 await c.query('INSERT INTO public_demo_versions(org_id,version) VALUES($1,1)',[ORG]);
 await c.query('COMMIT');
 console.log('Isolated fictional showcase seeded: '+JSON.stringify(counts));
} catch(e){
 try{await c.query('ROLLBACK')}catch{}
 console.error('Public CRM showcase seed failed:',e instanceof Error?e.message:'unknown');
 process.exitCode=1;
}finally{await c.end().catch(()=>{})}
