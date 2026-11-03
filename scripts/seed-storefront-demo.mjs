/**
 * Explicit, one-time, idempotent import of template-1 product fixtures.
 * Intentionally does not create fake real orders, payments or customers.
 * Use only on a new database. Existing records are never overwritten/deleted.
 */
import {PrismaClient} from "@prisma/client";
const db=new PrismaClient();
const categories=[
 {id:"clothing",name:"پوشاک",slug:"clothing",description:"پوشاک روزمره و شیک"},
 {id:"bags",name:"کیف",slug:"bags",description:"کیف‌های ساده و کاربردی"},
 {id:"shoes",name:"کفش",slug:"shoes",description:"کفش‌های راحت و روزمره"},
 {id:"accessories",name:"اکسسوری",slug:"accessories",description:"جزئیات خاص استایل"}
];
const goods=[
 ["demo-bag","minimal-leather-bag","کیف دستی چرمی زنانه","bags",2490000,2790000,18,true,[{"label":"قهوه‌ای","sku":"BAG-BR","inventory":12},{"label":"مشکی","sku":"BAG-BK","inventory":6}]],
 ["demo-sneakers","white-everyday-sneakers","کفش کتانی سفید مردانه","shoes",1790000,null,24,true,[{"label":"سایز ۴۰","inventory":7},{"label":"سایز ۴۱","inventory":9},{"label":"سایز ۴۲","inventory":8}]],
 ["demo-shirt","blue-linen-shirt","پیراهن لینن مردانه","clothing",1990000,null,32,true,[{"label":"سایز M","inventory":10},{"label":"سایز L","inventory":12},{"label":"سایز XL","inventory":10}]],
 ["demo-watch","classic-brown-watch","ساعت کلاسیک مردانه","accessories",3490000,null,7,true,[]],
 ["demo-bag-2","everyday-leather-bag","کیف چرمی روزمره","bags",2190000,null,12,false,[]],
 ["demo-shoes-2","urban-sneakers","کتانی اسپرت شهری","shoes",1890000,null,11,false,[]],
 ["demo-shirt-2","sky-blue-linen-shirt","پیراهن آبی آسمانی","clothing",1690000,null,13,false,[]],
 ["demo-sunglasses","classic-sunglasses","عینک آفتابی کلاسیک","accessories",890000,null,17,false,[]]
];
async function main(){
 const prior=await db.product.count();
 if(prior>0){console.log("Existing catalog detected; nothing seeded to avoid changing customer data.");return}
 await db.storeSettings.upsert({where:{id:"main"},update:{},create:{id:"main",siteType:"STORE",themeId:"design-1",storeName:"دایرا استور",description:"فروشگاه نمونه با محصولات نمایشی قابل ویرایش از پنل مدیریت"}});
 for(const c of categories)await db.category.upsert({where:{slug:c.slug},update:{},create:c});
 for(const [id,slug,name,categoryId,price,comparePrice,inventory,featured,variants] of goods){
  await db.product.upsert({where:{slug},update:{},create:{id,slug,name,categoryId,price,comparePrice,inventory,featured,
   description:`${name} — محصول نمونه قابل ویرایش از پنل مدیریت`,status:"ACTIVE",variants:{create:variants}}});
 }
 await db.shippingMethod.createMany({data:[{id:"demo-post",title:"ارسال با پست",cost:85000,freeAbove:3000000,enabled:true},{id:"demo-pickup",title:"تحویل حضوری",cost:0,freeAbove:0,enabled:true}],skipDuplicates:true});
 await db.coupon.upsert({where:{code:"WELCOME10"},update:{},create:{code:"WELCOME10",type:"PERCENT",amount:10,minSubtotal:0,enabled:true}});
 for(const entry of [
  {slug:"about",title:"درباره ما",body:"به فروشگاه ما خوش آمدید. این متن نمونه از پنل مدیریت قابل ویرایش است."},
  {slug:"contact",title:"ارتباط با ما",body:"برای ارتباط با فروشگاه از اطلاعات تماس درج‌شده در پایین سایت استفاده کنید."},
  {slug:"privacy",title:"حریم خصوصی",body:"اطلاعات سفارش خریداران در پایگاه داده اختصاصی فروشگاه ذخیره می‌شود و فقط برای پردازش سفارش استفاده می‌گردد. برای درخواست حذف یا دسترسی به اطلاعات با مدیر فروشگاه تماس بگیرید."},
  {slug:"terms",title:"قوانین و مقررات",body:"در این نسخه پرداخت بانکی فعال نیست و سفارش ثبت‌شده به‌معنی پرداخت یا تعهد ارسال نمی‌باشد. پیش از راه‌اندازی تجاری این متن باید توسط صاحب کسب‌وکار تکمیل شود."},
  {slug:"shipping",title:"ارسال و مرجوعی",body:"روش‌ها و هزینه‌های ارسال در پنل مدیریت فروشگاه قابل تغییر است. شرایط بازگشت کالا باید پیش از شروع فروش تکمیل شود."},
  {slug:"faq",title:"سؤالات متداول",body:"برای خرید، محصول را انتخاب کرده و اطلاعات سفارش را ثبت کنید. پرداخت آنلاین پس از اتصال درگاه معتبر فعال می‌شود."}
 ])await db.page.upsert({where:{slug:entry.slug},update:{},create:{...entry,status:"PUBLISHED"}});
 await db.article.upsert({where:{slug:"size-guide"},update:{},create:{slug:"size-guide",title:"راهنمای انتخاب سایز",summary:"نکات اولیه انتخاب سایز پوشاک",body:"سایز مناسب را از جدول اندازه‌گیری همان محصول انتخاب کنید.",status:"PUBLISHED"}});
 console.log("Template-1 demo catalog imported without deleting or replacing existing data.");
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>db.$disconnect());
