import {randomUUID} from 'node:crypto';
import type {PoolClient} from 'pg';

/**
 * Fictional demo content, scoped to one organization.
 * No provider can send these records: all contacts lack messaging consent,
 * outbound messages are drafts, and signing requests are unsigned drafts.
 * Called inside an existing transaction, protected by the org row lock.
 */
type Value=string|number|boolean|Date|null;
type RecordValue=Record<string,Value>;
type Table='contacts'|'deals'|'tasks'|'documents'|'contracts'|'tickets'
  |'ticket_comments'|'interactions'|'automation_rules'|'activities'
  |'notifications'|'message_outbox'|'signature_requests';
const VERSION=1;
const DAY=86_400_000;
const today=()=>new Date();
const daysFromNow=(days:number)=>new Date(Date.now()+days*DAY).toISOString().slice(0,10);
const daysAgo=(days:number)=>new Date(Date.now()-days*DAY);
const monthAgo=(months:number)=>new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth()-months,15,12));

async function insertRows(c:PoolClient,table:Table,rows:RecordValue[]){
 if(!rows.length)return;
 const columns=Object.keys(rows[0]);
 const values:Value[]=[];
 const placeholders=rows.map((row,i)=>'('+columns.map((col,j)=>{
  values.push(row[col]??null);
  return '$'+(i*columns.length+j+1);
 }).join(',')+')');
 await c.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders.join(',')}`,values);
}
export type DemoSeedResult={seeded:boolean;counts:Record<string,number>};
export async function seedDemoData(c:PoolClient,orgId:string,ownerId:string):Promise<DemoSeedResult>{
 const org=await c.query('SELECT id FROM organizations WHERE id=$1 FOR UPDATE',[orgId]);
 if(!org.rowCount)throw new Error('Demo workspace does not exist');
 const existing=await c.query('SELECT version FROM demo_seed_runs WHERE org_id=$1',[orgId]);
 if(existing.rowCount)return {seeded:false,counts:{}};

 const contactFixtures=[
  ['سارا احمدی','استودیو نگاه','customer','اینستاگرام',96,'طراحی، وفادار'],
  ['امیرحسین رضایی','فروشگاه رایا','customer','وب‌سایت',85,'فروشگاه، دائمی'],
  ['نگار کریمی','گروه خلاقیت آرتا','prospect','معرفی دوستان',74,'طراحی، مذاکره'],
  ['علی موسوی','شرکت دنا','lead','اینستاگرام',49,'سرنخ جدید'],
  ['مهسا شریفی','کلینیک مهر','customer','گوگل',91,'خدمات، سازمانی'],
  ['محمد پارسا','فروشگاه نارون','prospect','وب‌سایت',66,'فروشگاه'],
  ['پرنیا قاسمی','آکادمی روشنا','lead','نمایشگاه',57,'آموزشی'],
  ['آرمان بهرامی','مجموعه نوآوران','customer','معرفی دوستان',93,'سازمانی'],
  ['الناز مرادی','بوتیک نیکا','lead','اینستاگرام',34,'پوشاک'],
  ['کیان نادری','شرکت فراز','prospect','گوگل',69,'سازمانی'],
  ['شیوا رستمی','خانه طراحان','inactive','وب‌سایت',20,'آرشیو'],
  ['پیمان حسینی','کافه روم','customer','معرفی دوستان',82,'رستوران'],
  ['نرگس ملکی','تولیدی سروش','lead','وب‌سایت',46,'تولیدی'],
  ['پویا رفیعی','مؤسسه ایرانیان','prospect','اینستاگرام',77,'آموزشی']
 ] as const;
 const contacts=contactFixtures.map(([name,company,status,source,score,tags],i)=>({
  id:randomUUID(),org_id:orgId,name,company,
  email:`demo${String(i+1).padStart(2,'0')}@daira.example`,
  phone:'شماره آزمایشی '+String(i+1).padStart(2,'0'),
  status,source,score,tags:'دمو، '+tags,
  notes:'دادهٔ نمایشی برای آشنایی با CRM؛ این شخص و مشخصات تماس واقعی نیستند.',
  delivery_consent:false,
  created_at:daysAgo(4+i*6)
 }));
 await insertRows(c,'contacts',contacts);
 const dealsSpec=[
  ['طراحی فروشگاه اینترنتی رایا',1,68000000,'won',100,4],
  ['راه‌اندازی CRM استودیو نگاه',0,34500000,'won',100,0],
  ['طراحی سایت کلینیک مهر',4,42000000,'won',100,2],
  ['بازطراحی سامانه نوآوران',7,92500000,'won',100,5],
  ['مدیریت فروش بوتیک نیکا',8,27000000,'new',20,null],
  ['پنل مشتریان مجموعه دنا',3,54000000,'qualified',45,null],
  ['اتوماسیون فروش آکادمی روشنا',6,36000000,'proposal',60,null],
  ['داشبورد سفارش نارون',5,48000000,'negotiation',80,null],
  ['پرتال سازمانی شرکت فراز',9,78000000,'negotiation',70,null],
  ['مدیریت باشگاه مشتریان ایرانیان',13,59000000,'proposal',55,null],
  ['پنل ثبت سفارش کافه روم',11,19000000,'lost',0,null],
  ['همکاری فصلی خانه طراحان',10,22000000,'lost',0,null]
 ] as const;
 const deals=dealsSpec.map(([title,index,amount,stage,probability,wonMonths],i)=>({
  id:randomUUID(),org_id:orgId,contact_id:contacts[index].id,title,
  amount,stage,probability,expected_at:daysFromNow(5+i*3),
  won_at:wonMonths===null?null:monthAgo(wonMonths),
  notes:'[دمو] فرصت فروش آزمایشی. مبالغ صرفاً برای نمایش گزارش‌ها هستند.',
  created_at:daysAgo(25+i*7)
 }));
 await insertRows(c,'deals',deals);
 const tasksSpec=[
  ['تماس پیگیری با شرکت دنا',3,5,'urgent','todo',-2],
  ['ارسال پروپوزال آکادمی روشنا',6,6,'high','doing',1],
  ['برگزاری جلسه آنلاین با نارون',5,7,'normal','todo',3],
  ['بازبینی نسخه اولیه سایت رایا',1,0,'normal','done',-10],
  ['پیگیری پیش‌پرداخت کلینیک مهر',4,2,'high','doing',0],
  ['گزارش هفتگی فروش',0,1,'normal','todo',4],
  ['به‌روزرسانی شرایط قرارداد فراز',9,8,'high','todo',2],
  ['پاسخ به پیام بوتیک نیکا',8,4,'normal','todo',-1],
  ['ارسال فایل نهایی استودیو نگاه',0,1,'low','done',-7],
  ['هماهنگی جلسه با مؤسسه ایرانیان',13,9,'normal','todo',5],
  ['بررسی نیازهای تولیدی سروش',12,5,'high','todo',6],
  ['آماده‌سازی دمو محصول برای نارون',5,7,'normal','doing',1],
  ['بررسی رضایت مشتریان قبلی',11,10,'low','todo',8],
  ['جمع‌بندی مذاکره شرکت فراز',9,8,'urgent','todo',-3],
  ['تأیید نهایی صفحه خدمات کلینیک',4,2,'normal','done',-4]
 ] as const;
 const tasks=tasksSpec.map(([title,contactIndex,dealIndex,priority,status,due],i)=>({
  id:randomUUID(),org_id:orgId,title,contact_id:contacts[contactIndex].id,
  deal_id:deals[dealIndex].id,priority,status,due_at:daysFromNow(due),
  notes:'[دمو] وظیفهٔ نمونه، برای تمرین مدیریت پیگیری‌ها.',
  created_at:daysAgo((i+1)*2)
 }));
 await insertRows(c,'tasks',tasks);
 const docSpec=[
  ['DEMO-INV-1001','فاکتور طراحی سایت رایا','invoice',1,68000000,'paid',-8],
  ['DEMO-INV-1002','فاکتور خدمات کلینیک مهر','invoice',4,42000000,'paid',-23],
  ['DEMO-INV-1003','فاکتور اجرای CRM نگاه','invoice',0,34500000,'sent',8],
  ['DEMO-INV-1004','فاکتور داشبورد نوآوران','invoice',7,92500000,'accepted',5],
  ['DEMO-QUO-1005','پیش‌فاکتور شرکت دنا','quote',3,54000000,'draft',12],
  ['DEMO-QUO-1006','پیش‌فاکتور فروشگاه نارون','quote',5,48000000,'sent',7],
  ['DEMO-QUO-1007','پیش‌فاکتور شرکت فراز','quote',9,78000000,'accepted',17],
  ['DEMO-QUO-1008','پیشنهاد قیمت مؤسسه ایرانیان','quote',13,59000000,'draft',21]
 ] as const;
 const documents=docSpec.map(([number,title,kind,contactIndex,amount,status,due],i)=>({
  id:randomUUID(),org_id:orgId,number,title,kind,contact_id:contacts[contactIndex].id,
  amount,status,due_at:daysFromNow(due),notes:'[دمو] سند مالی نمایشی؛ پرداخت واقعی صورت نگرفته است.',
  created_at:daysAgo(i*4+2)
 }));
 await insertRows(c,'documents',documents);
 const contractSpec=[
  ['DEMO-CNT-01','قرارداد استودیو نگاه',0,1,34500000,'active',-50,35],
  ['DEMO-CNT-02','قرارداد طراحی رایا',1,0,68000000,'completed',-110,-15],
  ['DEMO-CNT-03','قرارداد توسعه کلینیک مهر',4,2,42000000,'signed',-30,65],
  ['DEMO-CNT-04','پیشنویس قرارداد شرکت دنا',3,5,54000000,'draft',5,105],
  ['DEMO-CNT-05','قرارداد همکاری شرکت فراز',9,8,78000000,'sent',12,120],
  ['DEMO-CNT-06','قرارداد مؤسسه ایرانیان',13,9,59000000,'draft',18,150]
 ] as const;
 const contracts=contractSpec.map(([number,title,contactIndex,dealIndex,amount,status,start,end],i)=>({
  id:randomUUID(),org_id:orgId,number,title,contact_id:contacts[contactIndex].id,
  deal_id:deals[dealIndex].id,amount,status,start_at:daysFromNow(start),end_at:daysFromNow(end),
  terms:'[دمو] این صرفاً متن آزمایشی قرارداد است و ارزش حقوقی ندارد.',
  notes:'قرارداد نمایشی. امضای واقعی یا تعهد حقوقی ایجاد نشده است.',
  created_at:daysAgo((i+1)*10)
 }));
 await insertRows(c,'contracts',contracts);
 const ticketSpec=[
  ['مشکل در ورود به حساب مشتری',1,'open','urgent','راهنمایی دربارهٔ بازنشانی رمز عبور'],
  ['درخواست تغییر رنگ داشبورد',4,'in_progress','normal','پیشنهاد تغییر رنگ در بخش گزارش‌ها'],
  ['گزارش خطای نمایش موبایل',0,'resolved','high','بررسی و رفع نمایش در موبایل'],
  ['پیگیری وضعیت نسخه نهایی',7,'waiting','normal','پرسش دربارهٔ زمان تحویل نسخهٔ نمونه'],
  ['درخواست گزارش سفارشی',11,'open','low','نمایش تعداد سفارش‌ها به تفکیک روز'],
  ['پرسش دربارهٔ روش پرداخت',5,'closed','normal','توضیح روش‌های پرداخت احتمالی در آینده']
 ] as const;
 const tickets=ticketSpec.map(([title,index,status,priority,description],i)=>({
  id:randomUUID(),org_id:orgId,contact_id:contacts[index].id,title,
  status,priority,description:'[دمو] '+description,due_at:daysFromNow((i+1)*2),
  closed_at:['closed','resolved'].includes(status)?daysAgo(2):null,
  created_at:daysAgo((i+1)*3)
 }));
 await insertRows(c,'tickets',tickets);
 const ticketComments=[
  [0,'سلام، درخواست شما دریافت شد و بررسی می‌شود.'],
  [0,'برای آزمایش، وضعیت تیکت را تغییر دهید.'],
  [1,'این مورد به تیم طراحی ارجاع شد.'],
  [2,'نسخهٔ اصلاح‌شده در محیط نمونه بررسی شد.'],
  [2,'ممنون، مشکل نمایش رفع شد.'],
  [3,'جزئیات نهایی را در همین گفتگو ارسال می‌کنیم.'],
  [4,'درخواست گزارش سفارشی ثبت شد.'],
  [5,'پاسخ راهنما برای مشتری ارسال شد (نمایشی).']
 ] as const;
 await insertRows(c,'ticket_comments',ticketComments.map(([index,body],i)=>({
  id:randomUUID(),org_id:orgId,ticket_id:tickets[index].id,author_id:ownerId,
  body:'[دمو] '+body,created_at:daysAgo(i+1)
 })));
 const interactionSpec=[
  ['تماس اولیه با شرکت دنا',3,5,'call','outbound',2],
  ['جلسه بررسی نیازهای نارون',5,7,'meeting','inbound',4],
  ['ارسال ایمیل معرفی خدمات به فراز',9,8,'email','outbound',6],
  ['جلسه پیشبرد قرارداد کلینیک مهر',4,2,'meeting','outbound',9],
  ['پیام پیگیری مؤسسه ایرانیان',13,9,'message','outbound',12],
  ['تماس رضایت‌سنجی فروشگاه رایا',1,0,'call','inbound',15],
  ['ثبت نکات درباره استودیو نگاه',0,1,'note','inbound',20],
  ['جلسه ارائه طرح آکادمی روشنا',6,6,'meeting','outbound',5],
  ['تماس هماهنگی با بوتیک نیکا',8,4,'call','outbound',1]
 ] as const;
 const interactions=interactionSpec.map(([title,index,dealIndex,kind,direction,day])=>({
  id:randomUUID(),org_id:orgId,contact_id:contacts[index].id,deal_id:deals[dealIndex].id,
  title,kind,direction,notes:'[دمو] ارتباط آزمایشی؛ هیچ تماسی در دنیای واقعی انجام نشده است.',
  occurred_at:daysAgo(day),created_at:daysAgo(day)
 }));
 await insertRows(c,'interactions',interactions);
 const automationRules=[
  ['یادآوری سرنخ جدید','contacts.created','task','تماس اولیه با سرنخ جدید'],
  ['اطلاع از فروش موفق','deals.won','notification','یک فرصت فروش بسته شد'],
  ['پیگیری درخواست پشتیبانی','tickets.created','task','بررسی تیکت مشتری']
 ] as const;
 const rules=automationRules.map(([title,event,action,payload])=>({
  id:randomUUID(),org_id:orgId,title:'[دمو] '+title,event,action,payload,
  enabled:false // demo rules must never trigger on real business operations
 }));
 await insertRows(c,'automation_rules',rules);
 const activities=[...contacts.slice(0,7).map(x=>['contacts',x.id,'ثبت مخاطب نمونه: '+x.name] as const),
  ...deals.slice(0,6).map(x=>['deals',x.id,'ثبت فرصت نمونه: '+x.title] as const),
  ...tasks.slice(0,3).map(x=>['tasks',x.id,'ایجاد وظیفه نمونه: '+x.title] as const),
  ...tickets.slice(0,3).map(x=>['tickets',x.id,'ثبت تیکت نمونه: '+x.title] as const),
  ...contracts.slice(0,2).map(x=>['contracts',x.id,'ثبت قرارداد نمونه: '+x.title] as const)];
 await insertRows(c,'activities',activities.map(([entity,entityId,description],i)=>({
  id:randomUUID(),org_id:orgId,user_id:ownerId,entity,entity_id:entityId,
  action:'create',description:'[دمو] '+description,created_at:daysAgo(i+1)
 })));
 const notifications=[
  ['contacts','مخاطب جدید','اطلاعات نمونه برای آشنایی با بخش مخاطبان افزوده شد.'],
  ['deals','فرصت فروش جدید','یک پیشنهاد فروش نمایشی در قیف قرار گرفت.'],
  ['tasks','پیگیری سررسیدشده','یک وظیفهٔ نمونه برای امروز ثبت شده است.'],
  ['tickets','تیکت باز','درخواست پشتیبانی نمونه نیاز به رسیدگی دارد.'],
  ['contracts','قرارداد در انتظار','پیش‌نویس قرارداد نمونه آمادهٔ بررسی است.'],
  ['documents','پیش‌فاکتور ثبت شد','یک پیش‌فاکتور نمایشی برای مشتری نمونه اضافه شد.'],
  ['interactions','جلسه ثبت شد','خلاصهٔ ارتباط آزمایشی به تاریخچه افزوده شد.']
 ] as const;
 await insertRows(c,'notifications',notifications.map(([entity,title,body],i)=>({
  id:randomUUID(),org_id:orgId,entity,title:'[دمو] '+title,body,
  created_at:daysAgo(i)
 })));
 const outbox=[
  {contactIndex:0,subject:'پیگیری جلسه معرفی',body:'این یک ایمیل نمونه و صرفاً پیش‌نویس است.'},
  {contactIndex:1,subject:'ارسال پیشنهاد همکاری',body:'این پیام واقعی ارسال نمی‌شود و داده نمایشی است.'}
 ];
 await insertRows(c,'message_outbox',outbox.map(({contactIndex,subject,body})=>({
  id:randomUUID(),org_id:orgId,contact_id:contacts[contactIndex].id,
  created_by:ownerId,channel:'email',recipient:contacts[contactIndex].email,
  subject:'[دمو] '+subject,body,status:'draft'
 })));
 await insertRows(c,'signature_requests',[{
  id:randomUUID(),org_id:orgId,contract_id:contracts[3].id,
  created_by:ownerId,signer_name:'امضاکننده نمونه',signer_email:'signer@daira.example',
  status:'draft'
 }]);
 await c.query('INSERT INTO demo_seed_runs(org_id,version) VALUES($1,$2)',[orgId,VERSION]);
 return {seeded:true,counts:{
  contacts:contacts.length,deals:deals.length,tasks:tasks.length,documents:documents.length,
  contracts:contracts.length,tickets:tickets.length,interactions:interactions.length,
  automation_rules:rules.length,notifications:notifications.length
 }};
}
