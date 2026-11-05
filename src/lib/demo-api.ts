"use client";
/**
 * Public interactive showroom for the UI ONLY.
 * Activated solely by NEXT_PUBLIC_STUDIO_DEMO=1 in the demo deployment.
 * All writes stay in this tab's memory and never reach the real server.
 * Production installs must leave this variable unset.
 */
import {editionTwoDefaults,type EditionTwoConfig} from "@/lib/edition-two";
export const DEMO_MODE = process.env.NEXT_PUBLIC_STUDIO_DEMO === "1";
type Item = Record<string,unknown> & {id:string};
type DemoState = {settings:Record<string,unknown>;records:Record<string,Item[]>};
const createdAt="2026-10-29T10:30:00.000Z";
const item=(id:string,fields:Record<string,unknown>):Item=>({id,createdAt,updatedAt:createdAt,...fields});
const seeds:Record<string,Item[]>={
 products:[
  item("p1",{name:"کیف چرمی مینیمال",slug:"leather-bag",sku:"BAG-01",price:1890000,comparePrice:2190000,inventory:18,lowStockAt:5,status:"ACTIVE",featured:true,description:"کیف روزمره با طراحی ساده",gallery:[],variants:[],coverUrl:null}),
  item("p2",{name:"کفش روزمره سفید",slug:"white-sneakers",sku:"SHO-02",price:2450000,inventory:5,lowStockAt:7,status:"ACTIVE",featured:true,description:"مدل راحتی",gallery:[],variants:[{id:"v1",label:"سایز ۴۱",sku:"SHO-41",price:2450000,inventory:2}],coverUrl:null}),
  item("p3",{name:"پیراهن کتان آبی",slug:"blue-linen-shirt",sku:"SHI-03",price:980000,inventory:24,status:"ACTIVE",description:"پیراهن سبک",gallery:[],variants:[]}),
  item("p4",{name:"ساعت کلاسیک",slug:"classic-watch",sku:"WAT-04",price:4250000,inventory:3,status:"DRAFT",description:"ساعت با طراحی کلاسیک",gallery:[],variants:[]})],
 categories:[item("c1",{name:"پوشاک",slug:"clothing",description:"پوشاک زنانه و مردانه"}),item("c2",{name:"اکسسوری",slug:"accessories",description:"کیف و اکسسوری"}),item("c3",{name:"کفش",slug:"shoes",description:"کفش‌های روزمره"})],
 orders:[
  item("o1",{number:1042,customerId:"cu1",customerName:"سارا احمدی",customerPhone:"09120000000",
   customerEmail:"sara@example.invalid",customer:{id:"cu1",fullName:"سارا احمدی",phone:"09120000000",email:"sara@example.invalid"},
   shippingAddress:{recipientName:"سارا احمدی",recipientPhone:"09120000000",province:"تهران",city:"تهران",street:"خیابان نمونه",plaque:"۱۲",unit:"۴",postalCode:"۱۱۱۱۱۱۱۱۱۱"},
   shippingMethod:"پست پیشتاز",shippingCost:85000,subtotal:4340000,discountTotal:150000,total:4275000,status:"PACKING",
   trackingCode:"",note:"لطفاً پیش از ارسال هماهنگ شود.",
   items:[
    {id:"oi1",productId:"p2",title:"کفش روزمره سفید",sku:"SHO-41",variantLabel:"سایز ۴۱",selectedOptions:{سایز:"۴۱",رنگ:"سفید"},quantity:1,unitPrice:2450000,total:2450000,product:{name:"کفش روزمره سفید",sku:"SHO-02",coverUrl:null}},
    {id:"oi3",productId:"p1",title:"کیف چرمی مینیمال",sku:"BAG-01",selectedOptions:{رنگ:"مشکی"},quantity:1,unitPrice:1890000,total:1890000,product:{name:"کیف چرمی مینیمال",sku:"BAG-01",coverUrl:null}}
   ],payments:[{id:"py1",status:"PAID",amount:4275000,provider:"درگاه آزمایشی",reference:"DEMO-10042",createdAt:"2026-10-29T10:30:00.000Z"}]}),
  item("o2",{number:1041,customerId:"cu2",customerName:"امیر رضایی",customerPhone:"09120000001",customerEmail:"amir@example.invalid",
   customer:{id:"cu2",fullName:"امیر رضایی",phone:"09120000001",email:"amir@example.invalid"},
   shippingAddress:{recipientName:"امیر رضایی",province:"اصفهان",city:"اصفهان",street:"آدرس آزمایشی",postalCode:"۲۲۲۲۲۲۲۲۲۲"},shippingMethod:"پست",shippingCost:60000,subtotal:1890000,discountTotal:0,total:1950000,
   status:"SHIPPED",trackingCode:"DEMO-123",items:[{id:"oi2",title:"کیف چرمی مینیمال",sku:"BAG-01",selectedOptions:{رنگ:"قهوه‌ای"},quantity:1,unitPrice:1890000,total:1890000}],
   payments:[{id:"py2",status:"PAID",amount:1950000,provider:"درگاه آزمایشی",reference:"DEMO-10041"}]}),
  item("o3",{number:1040,customerId:"cu3",customerName:"مینا موسوی",customerPhone:"09120000002",customer:{id:"cu3",fullName:"مینا موسوی",phone:"09120000002",email:"mina@example.invalid"},
   shippingAddress:{province:"فارس",city:"شیراز",street:"خیابان نمونه"},shippingMethod:"پست",shippingCost:85000,subtotal:980000,discountTotal:0,total:1065000,
   status:"PENDING",items:[{id:"oi4",title:"پیراهن کتان آبی",sku:"SHI-03",variantLabel:"سایز متوسط",quantity:1,unitPrice:980000,total:980000,selectedOptions:{سایز:"M"}}],payments:[]})],
 customers:[item("cu1",{fullName:"سارا احمدی",phone:"09120000000",email:"sara@example.invalid"}),item("cu2",{fullName:"امیر رضایی",phone:"09120000001",email:"amir@example.invalid"}),item("cu3",{fullName:"مینا موسوی",phone:"09120000002",email:"mina@example.invalid"})],
 coupons:[item("co1",{code:"WELCOME10",type:"PERCENT",amount:10,minSubtotal:600000,usedCount:4,usageLimit:100,enabled:true,expiresAt:null})],
 shipping:[item("sh1",{title:"پست پیشتاز",cost:85000,freeAbove:3000000,estimatedDays:"۲ تا ۴ روز",enabled:true}),item("sh2",{title:"ارسال شهری",cost:60000,estimatedDays:"یک روز",enabled:true})],
 payments:[item("pay1",{orderId:"o1",provider:"درگاه آزمایشی",reference:"DEMO-1001",amount:2450000,status:"PAID"})],
 reviews:[item("r1",{author:"مینا",rating:5,body:"کیفیت عالی بود",status:"PENDING",productId:"p1"})],
 pages:[item("pg1",{title:"درباره ما",slug:"about",body:"متن نمونه معرفی کسب‌وکار",status:"PUBLISHED"}),item("pg2",{title:"سؤالات متداول",slug:"faq",status:"DRAFT"})],
 articles:[item("a1",{title:"راهنمای انتخاب سایز",slug:"size-guide",summary:"راهنمای خرید",body:"محتوای نمونه مقاله",status:"PUBLISHED"})],
 banners:[item("b1",{title:"فروش ویژه فصل",subtitle:"پیشنهادهای جدید",position:1,active:true,imageUrl:null})],
 services:[item("s1",{title:"طراحی هویت بصری",slug:"branding",description:"خدمات مشاوره و طراحی",active:true})],
 projects:[item("pr1",{title:"پروژه فروشگاه نمونه",description:"طراحی و اجرا",active:true})],
 leads:[item("l1",{name:"مشتری آزمایشی",phone:"09120000003",subject:"درخواست مشاوره",message:"سلام، برای دریافت اطلاعات تماس می‌گیرم.",status:"NEW"})]
};
let state:DemoState|undefined;
let editionTwoDraft:EditionTwoConfig|undefined;
let editionTwoPublished:EditionTwoConfig|undefined;
function getState(){
 if(!state)state={
   settings:{id:"main",siteType:"STORE",themeId:"design-2",storeName:"ESSENTIAL",description:"محیط آزمایشی پنل مدیریت",logoUrl:null,contactEmail:"hello@example.invalid",contactPhone:"",address:"",instagram:"",orderNoticeEmail:"",seoTitle:"فروشگاه نمونه",seoDescription:"",homeSections:[
    {id:"home-1",title:"بنر اصلی",description:"جدیدترین محصولات",imageUrl:null,enabled:true,position:0},
    {id:"home-2",title:"محصولات منتخب",description:"انتخاب‌های ویژه",imageUrl:null,enabled:true,position:1}]},
   records:JSON.parse(JSON.stringify(seeds))
 };return state;
}
function response(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}})}
export async function adminFetch(input:RequestInfo|URL,init?:RequestInit):Promise<Response>{
 if(!DEMO_MODE)return globalThis.fetch(input,init);
 const url=new URL(typeof input==="string"?input:input.toString(),"https://demo.invalid");
 const path=url.pathname,method=(init?.method||"GET").toUpperCase(),data=getState();
 if(path==="/api/auth/logout")return response({ok:true});
 if(path==="/api/admin/edition-2"){
  const categories=data.records.categories.map(x=>({id:String(x.id),name:String(x.name),slug:String(x.slug||""),imageUrl:String(x.imageUrl||"")}));
  const products=data.records.products.filter(x=>x.status==="ACTIVE").map(x=>({id:String(x.id),name:String(x.name),slug:String(x.slug||""),imageUrl:String(x.coverUrl||"")}));
  const articles=data.records.articles.filter(x=>x.status==="PUBLISHED").map(x=>({id:String(x.id),name:String(x.title),slug:String(x.slug||""),imageUrl:String(x.coverUrl||"")}));
  const pages=[...data.records.pages.filter(x=>x.status==="PUBLISHED").map(x=>({id:String(x.id),name:String(x.title),slug:String(x.slug||"")})),
   {id:"about",name:"درباره ما",slug:"about"},{id:"contact",name:"تماس با ما",slug:"contact"},
   {id:"terms",name:"قوانین و مقررات",slug:"terms"},{id:"privacy",name:"حریم خصوصی",slug:"privacy"},
   {id:"blog",name:"ژورنال",slug:"blog"},{id:"faq",name:"سوالات متداول",slug:"faq"}];
  if(method==="GET")return response({draft:editionTwoDraft||editionTwoPublished||editionTwoDefaults,
   published:editionTwoPublished||null,hasUnpublishedDraft:Boolean(editionTwoDraft),
   catalog:{categories,products,articles,pages}});
  if(method==="PUT"){editionTwoDraft=JSON.parse(String(init?.body||"{}")) as EditionTwoConfig;return response({saved:true})}
  if(method==="POST"){if(!editionTwoDraft)return response({error:"ابتدا پیش‌نویس را ذخیره کنید"},400);
   editionTwoPublished=editionTwoDraft;editionTwoDraft=undefined;return response({published:true})}
 }

 if(path==="/api/admin/upload")return response({error:"آپلود در دمو غیرفعال است. از آدرس تصویر استفاده کن."},400);
 if(path==="/api/admin/settings"){
  if(method==="GET")return response({settings:data.settings});
  if(method==="PUT"){const body=JSON.parse(String(init?.body||"{}"));data.settings={...data.settings,...body};return response({settings:data.settings});}
 }
 if(path==="/api/admin/summary"){
   const store=data.settings.siteType!=="CORPORATE",products=data.records.products,orders=data.records.orders;
   return response({siteType:data.settings.siteType,storeName:data.settings.storeName,
     stats:store?[
      {label:"فروش پرداخت‌شده این ماه",value:4340000,money:true},{label:"سفارش‌های در جریان",value:orders.filter(o=>["PENDING","CONFIRMED","PACKING"].includes(String(o.status))).length},
      {label:"مشتریان",value:data.records.customers.length},{label:"محصولات منتشرشده",value:products.filter(p=>p.status==="ACTIVE").length}
     ]:[
      {label:"درخواست‌های دریافتی",value:data.records.leads.length},{label:"خدمات",value:data.records.services.length},
      {label:"نمونه‌کارها",value:data.records.projects.length},{label:"صفحات",value:data.records.pages.length}
     ],
     recent:store?orders.slice(0,5):data.records.leads.slice(0,5),
     lowStock:store?products.filter(p=>Number(p.inventory)<=Number(p.lowStockAt||5)).map(p=>({id:p.id,name:p.name,inventory:p.inventory})):[]});
 }
 const match=path.match(/^\/api\/admin\/([a-z]+)(?:\/([^/]+))?$/);
 if(!match||!data.records[match[1]])return response({error:"بخش آزمایشی یافت نشد"},404);
 const [,resource,id]=match,rows=data.records[resource];
 if(method==="GET"){
  const q=(url.searchParams.get("q")||"").trim().toLowerCase(),page=Math.max(1,Number(url.searchParams.get("page"))||1);
  const limit=Math.min(250,Math.max(1,Number(url.searchParams.get("limit"))||15));
  const filtered=q?rows.filter(x=>JSON.stringify(x).toLowerCase().includes(q)):rows;
  return response({items:filtered.slice((page-1)*limit,page*limit),total:filtered.length,page,pages:Math.max(1,Math.ceil(filtered.length/limit))});
 }
 if(method==="POST"){const body=JSON.parse(String(init?.body||"{}"));const record=item("demo-"+Math.random().toString(36).slice(2,12),body);rows.unshift(record);return response({item:record},201)}
 const idx=rows.findIndex(x=>x.id===id);if(idx<0)return response({error:"مورد پیدا نشد"},404);
 if(method==="PATCH"){const body=JSON.parse(String(init?.body||"{}"));rows[idx]={...rows[idx],...body,updatedAt:new Date().toISOString()};return response({item:rows[idx]})}
 if(method==="DELETE"){if(resource==="products"){rows[idx]={...rows[idx],status:"ARCHIVED"};}else rows.splice(idx,1);return response({ok:true})}
 return response({error:"درخواست نامعتبر"},405);
}
