export type Field={key:string;label:string;type?:"text"|"number"|"textarea"|"select"|"checkbox"|"image"|"date";options?:{value:string;label:string}[];required?:boolean;min?:number;help?:string};
export type ModuleDefinition={title:string;description:string;icon:string;plural:string;fields:Field[];columns:string[];readonly?:boolean;storeOnly?:boolean;corporateOnly?:boolean};
const option=(pairs:[string,string][])=>pairs.map(([value,label])=>({value,label}));
export const modules:Record<string,ModuleDefinition>={
  products:{title:"محصولات",description:"افزودن، نمایش، ویرایش و آرشیو محصولات و موجودی",icon:"package",plural:"محصول",storeOnly:true,
    columns:["name","price","inventory","status"],fields:[
      {key:"name",label:"نام محصول",required:true},{key:"slug",label:"آدرس محصول (انگلیسی)",required:true},
      {key:"sku",label:"کد محصول (SKU)"},{key:"categoryId",label:"شناسه دسته‌بندی"},
      {key:"description",label:"توضیحات کامل",type:"textarea"},
      {key:"price",label:"قیمت (تومان)",type:"number",required:true,min:0},
      {key:"comparePrice",label:"قیمت قبل از تخفیف (تومان)",type:"number",min:0},
      {key:"inventory",label:"موجودی",type:"number",min:0},{key:"lowStockAt",label:"آستانه هشدار موجودی",type:"number",min:0},
      {key:"coverUrl",label:"تصویر شاخص",type:"image"},{key:"gallery",label:"گالری تصاویر (هر خط یک آدرس)",type:"textarea"},
      {key:"status",label:"وضعیت محصول",type:"select",options:option([["DRAFT","پیش‌نویس"],["ACTIVE","منتشرشده"],["ARCHIVED","آرشیوشده"]])},
      {key:"featured",label:"نمایش در محصولات ویژه",type:"checkbox"},
      {key:"variants",label:"تنوع‌ها (رنگ، سایز، مدل)",type:"textarea",help:"برای هر رنگ یا سایز، قیمت و موجودی مستقل تعیین کن"}
    ]},
  categories:{title:"دسته‌بندی‌ها",description:"گروه‌بندی محصولات برای جست‌وجو و نمایش",icon:"folders",plural:"دسته‌بندی",storeOnly:true,columns:["name","slug"],fields:[
    {key:"name",label:"عنوان",required:true},{key:"slug",label:"نامک انگلیسی",required:true},
    {key:"description",label:"توضیح",type:"textarea"},{key:"imageUrl",label:"تصویر دسته‌بندی",type:"image"}]},
  orders:{title:"سفارش‌ها",description:"پیگیری، بسته‌بندی، ارسال و وضعیت سفارش‌ها",icon:"shopping-bag",plural:"سفارش",storeOnly:true,readonly:true,columns:["number","customerName","total","status","createdAt"],fields:[
    {key:"status",label:"وضعیت سفارش",type:"select",options:option([["PENDING","در انتظار"],["CONFIRMED","تأییدشده"],["PACKING","آماده‌سازی"],["SHIPPED","ارسال‌شده"],["DELIVERED","تحویل‌شده"],["CANCELLED","لغوشده"],["RETURNED","مرجوعی"]])},
    {key:"trackingCode",label:"کد رهگیری"},{key:"note",label:"یادداشت",type:"textarea"}]},
  customers:{title:"مشتریان",description:"اطلاعات خریداران و تاریخچه خرید",icon:"users",plural:"مشتری",storeOnly:true,columns:["fullName","phone","email"],fields:[
    {key:"fullName",label:"نام و نام خانوادگی",required:true},{key:"phone",label:"شماره موبایل"},
    {key:"email",label:"ایمیل"},{key:"notes",label:"یادداشت",type:"textarea"}]},
  coupons:{title:"تخفیف‌ها",description:"کدهای تخفیف و کمپین‌های فروش",icon:"badge-percent",plural:"کد تخفیف",storeOnly:true,columns:["code","type","amount","enabled"],fields:[
    {key:"code",label:"کد",required:true},{key:"type",label:"نوع",type:"select",options:option([["PERCENT","درصدی"],["FIXED","مبلغ ثابت"]])},
    {key:"amount",label:"درصد یا مبلغ (تومان)",type:"number",required:true,min:0},{key:"minSubtotal",label:"حداقل خرید (تومان)",type:"number",min:0},
    {key:"usageLimit",label:"سقف دفعات استفاده",type:"number",min:1},{key:"expiresAt",label:"تاریخ انقضا",type:"date"},
    {key:"enabled",label:"فعال باشد",type:"checkbox"}]},
  shipping:{title:"حمل‌ونقل",description:"تعریف روش‌های ارسال و هزینه‌ها",icon:"truck",plural:"روش ارسال",storeOnly:true,columns:["title","cost","freeAbove","enabled"],fields:[
    {key:"title",label:"عنوان روش",required:true},{key:"cost",label:"هزینه ارسال (تومان)",type:"number",required:true,min:0},
    {key:"freeAbove",label:"ارسال رایگان از مبلغ (تومان)",type:"number",min:0},{key:"estimatedDays",label:"زمان تقریبی ارسال"},
    {key:"enabled",label:"فعال باشد",type:"checkbox"}]},
  payments:{title:"تراکنش‌ها",description:"گزارش پرداخت‌ها؛ وضعیت پول فقط توسط درگاه معتبر تعیین می‌شود",icon:"credit-card",plural:"تراکنش",storeOnly:true,readonly:true,columns:["orderId","provider","reference","amount","status","createdAt"],fields:[]},
  reviews:{title:"دیدگاه‌ها",description:"تأیید یا رد نظرهای ثبت‌شده برای محصولات",icon:"message-square",plural:"نظر",storeOnly:true,readonly:true,columns:["author","rating","body","status"],fields:[
    {key:"status",label:"وضعیت نظر",type:"select",options:option([["PENDING","در انتظار"],["APPROVED","تأیید"],["REJECTED","رد"]])}]},
  pages:{title:"صفحات",description:"محتوای صفحات ثابت، قوانین و درباره ما",icon:"file-text",plural:"صفحه",columns:["title","slug","status"],fields:[
    {key:"title",label:"عنوان",required:true},{key:"slug",label:"نامک انگلیسی",required:true},
    {key:"body",label:"متن صفحه",type:"textarea"},{key:"status",label:"انتشار",type:"select",options:option([["DRAFT","پیش‌نویس"],["PUBLISHED","منتشرشده"]])},
    {key:"seoTitle",label:"عنوان سئو"},{key:"seoDescription",label:"توضیحات سئو",type:"textarea"}]},
  articles:{title:"مقالات",description:"محتوای وبلاگ و اخبار",icon:"notebook-pen",plural:"مقاله",columns:["title","slug","status","updatedAt"],fields:[
    {key:"title",label:"عنوان",required:true},{key:"slug",label:"نامک انگلیسی",required:true},
    {key:"summary",label:"خلاصه",type:"textarea"},{key:"body",label:"متن مقاله",type:"textarea"},
    {key:"coverUrl",label:"تصویر شاخص",type:"image"},{key:"status",label:"وضعیت",type:"select",options:option([["DRAFT","پیش‌نویس"],["PUBLISHED","منتشرشده"]])},
    {key:"seoTitle",label:"عنوان سئو"},{key:"seoDescription",label:"توضیحات سئو",type:"textarea"}]},
  banners:{title:"بنرها و اسلایدر",description:"تصاویر و دکمه‌های تبلیغاتی صفحه اصلی",icon:"images",plural:"بنر",columns:["title","position","active"],fields:[
    {key:"title",label:"عنوان بنر",required:true},{key:"subtitle",label:"زیرعنوان"},{key:"imageUrl",label:"تصویر",type:"image"},
    {key:"linkUrl",label:"لینک دکمه"},{key:"position",label:"ترتیب نمایش",type:"number",min:0},
    {key:"active",label:"فعال باشد",type:"checkbox"}]},
  services:{title:"خدمات",description:"معرفی خدمات سایت شرکتی",icon:"briefcase",plural:"خدمت",corporateOnly:true,columns:["title","slug","active"],fields:[
    {key:"title",label:"عنوان خدمت",required:true},{key:"slug",label:"نامک انگلیسی",required:true},
    {key:"description",label:"شرح خدمات",type:"textarea"},{key:"imageUrl",label:"تصویر",type:"image"},
    {key:"active",label:"منتشر باشد",type:"checkbox"}]},
  projects:{title:"نمونه‌کارها",description:"پروژه‌ها و رزومه کسب‌وکار",icon:"panels-top-left",plural:"پروژه",corporateOnly:true,columns:["title","active"],fields:[
    {key:"title",label:"نام پروژه",required:true},{key:"description",label:"توضیحات",type:"textarea"},
    {key:"imageUrl",label:"تصویر",type:"image"},{key:"linkUrl",label:"آدرس پروژه"},{key:"active",label:"منتشر باشد",type:"checkbox"}]},
  leads:{title:"درخواست‌ها",description:"پیام‌ها و فرم‌های مشاوره ثبت‌شده",icon:"inbox",plural:"درخواست",corporateOnly:true,readonly:true,columns:["name","phone","subject","status","createdAt"],fields:[
    {key:"status",label:"پیگیری",type:"select",options:option([["NEW","جدید"],["CONTACTED","تماس گرفته شد"],["CLOSED","بسته شد"]])}]}
};
export const commonNavigation=["pages","articles","banners"];
export const storeNavigation=["products","categories","orders","customers","payments","coupons","shipping","reviews"];
export const corporateNavigation=["services","projects","leads"];
export const MONEY_FIELDS=new Set(["price","comparePrice","total","subtotal","amount","cost","freeAbove","minSubtotal"]);
export const LABELS:Record<string,string>={name:"نام",slug:"نامک",sku:"کد محصول",price:"قیمت",inventory:"موجودی",status:"وضعیت",title:"عنوان",total:"مبلغ",amount:"مبلغ",fullName:"نام مشتری",phone:"شماره تماس",customerName:"خریدار",email:"ایمیل",code:"کد",type:"نوع",enabled:"فعال",active:"فعال",number:"شماره سفارش",orderId:"شماره سفارش",provider:"درگاه",reference:"شناسه تراکنش",rating:"امتیاز",body:"متن",author:"نویسنده",createdAt:"تاریخ",updatedAt:"آخرین ویرایش",freeAbove:"ارسال رایگان از",cost:"هزینه",position:"ترتیب",subject:"موضوع"};
