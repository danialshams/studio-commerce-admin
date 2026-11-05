/* Edition 02 has its own content model. Design 01 remains untouched. */
export type Destination={kind:"none"|"home"|"products"|"product"|"category"|"page"|"article"|"external";id?:string;url?:string};
export type EdSlide={id:string;title:string;description:string;eyebrow:string;imageUrl:string;mobileImageUrl:string;ctaLabel:string;target:Destination;enabled:boolean};
export type EdImageText={title:string;description:string;imageUrl:string;mobileImageUrl?:string;secondaryImageUrl?:string;ctaLabel:string;target:Destination};
export type EditionTwoConfig={
 version:2;announcement:string;hero:EdSlide[];
 categories:{title:string;items:Array<{categoryId:string;imageUrl?:string}>};
 featured:{title:string;description:string;productIds:string[]};
 campaign:EdImageText;story:EdImageText;
 chapters:Array<{id:string;title:string;description:string;imageUrl:string;mobileImageUrl?:string}>;
 journal:{title:string;articleIds:string[]};
 benefits:Array<{id:string;title:string;description:string;icon:"truck"|"package"|"headphones"|"shield"}>;
 footer:{eyebrow:string;title:string;bottomNote:string};
 footerColumns:Array<{id:string;title:string;links:Array<{id:string;label:string;target:Destination}>}>;
 navigation:Array<{id:string;label:string;target:Destination}>;
};
const origin="https://essential-store-design-2.vercel.app/images/editorial/";
const photo=(file:string)=>origin+file;
const products:Destination={kind:"products"};
const category:Destination={kind:"category",id:"bags"};
export const editionTwoDefaults:EditionTwoConfig={
 version:2,announcement:"انتخاب‌های ماندگار برای سلیقه‌های متفاوت",
 hero:[
  {id:"hero-1",title:"زیبایی در سادگی\nاتفاق می‌افتد.",description:"انتخاب‌هایی برای کسانی که زیبایی را در جزئیات پیدا می‌کنند.",eyebrow:"کالکشن منتخب فصل",imageUrl:photo("chapter-detail.webp"),mobileImageUrl:photo("chapter-detail.webp"),ctaLabel:"کشف کالکشن",target:products,enabled:true},
  {id:"hero-2",title:"فرم‌های ساده.\nاثر ماندگار.",description:"آرامش در فرم و کیفیت در انتخاب.",eyebrow:"روایت دوم / فرم و سبک",imageUrl:photo("story-detail.webp"),mobileImageUrl:photo("story-detail.webp"),ctaLabel:"کشف داستان",target:{kind:"page",id:"about"},enabled:true},
  {id:"hero-3",title:"زیبایی در\nجزئیات است.",description:"انتخاب‌هایی که در هر فصل همراهتان می‌مانند.",eyebrow:"روایت سوم / هنر جزئیات",imageUrl:photo("campaign.webp"),mobileImageUrl:photo("chapter-detail.webp"),ctaLabel:"دیدن کالکشن",target:category,enabled:true}
 ],
 categories:{title:"کالکشن را کشف کنید",items:[{categoryId:"clothing",imageUrl:photo("category-clothing.webp")},{categoryId:"bags",imageUrl:photo("category-bags.webp")},{categoryId:"shoes",imageUrl:photo("category-shoes.webp")},{categoryId:"accessories",imageUrl:photo("category-accessories.webp")}]},
 featured:{title:"منتخب این فصل",description:"قطعاتی برای امروز؛ انتخاب‌هایی برای سال‌های بعد.",productIds:[]},
 campaign:{title:"جزئیاتی که\nتفاوت می‌سازند.",description:"طراحی‌هایی که هر روز همراهتان می‌مانند.",imageUrl:photo("campaign.webp"),ctaLabel:"دیدن کالکشن",target:category},
 story:{title:"کمتر انتخاب کن.\nبهتر انتخاب کن.",description:"استایل یعنی ترکیب سادگی و شخصیت.",imageUrl:photo("story-portrait.webp"),secondaryImageUrl:photo("story-detail.webp"),ctaLabel:"داستان این نگاه",target:{kind:"page",id:"about"}},
 chapters:[
  {id:"chapter-form",title:"هر انتخاب، یک روایت.",description:"زیبایی واقعی از جزئیات با دقت ساخته می‌شود.",imageUrl:photo("chapter-form.webp")},
  {id:"chapter-details",title:"کیفیتی که می‌ماند.",description:"طرح‌های ماندگار در هر فصل.",imageUrl:photo("chapter-detail.webp")}
 ],
 journal:{title:"از نگاه ژورنال",articleIds:[]},
 benefits:[
  {id:"shipping",title:"روش‌های ارسال متنوع",description:"انتخاب روش ارسال هنگام ثبت سفارش",icon:"truck"},
  {id:"products",title:"جزئیات شفاف محصولات",description:"قیمت و موجودی متصل به پنل",icon:"package"},
  {id:"support",title:"پشتیبانی و همراهی",description:"اطلاعات تماس از پنل مدیریت",icon:"headphones"}
 ],
 footer:{eyebrow:"THE WAY WE SEE STYLE",title:"سلیقه، در انتخاب‌های کوچک معنا پیدا می‌کند.",bottomNote:"ساخته‌شده با توجه به جزئیات"},
 footerColumns:[
  {id:"guide",title:"راهنمای خرید",links:[
   {id:"all-products",label:"همه محصولات",target:{kind:"products"}},
   {id:"shopping-cart",label:"سبد خرید",target:{kind:"page",id:"cart"}},
   {id:"my-account",label:"حساب من",target:{kind:"page",id:"account"}},
   {id:"delivery",label:"ارسال و مرجوعی",target:{kind:"page",id:"shipping"}},
   {id:"questions",label:"سؤالات متداول",target:{kind:"page",id:"faq"}}
  ]},
  {id:"brand",title:"درباره فروشگاه",links:[
   {id:"brand-story",label:"داستان ما",target:{kind:"page",id:"about"}},
   {id:"brand-blog",label:"ژورنال",target:{kind:"page",id:"blog"}},
   {id:"brand-contact",label:"ارتباط با ما",target:{kind:"page",id:"contact"}},
   {id:"brand-privacy",label:"حریم خصوصی",target:{kind:"page",id:"privacy"}},
   {id:"brand-terms",label:"قوانین و مقررات",target:{kind:"page",id:"terms"}}
  ]}
 ],
 navigation:[
  {id:"nav-home",label:"خانه",target:{kind:"home"}},
  {id:"nav-shop",label:"فروشگاه",target:products},
  {id:"nav-journal",label:"ژورنال",target:{kind:"page",id:"blog"}}
 ]
};
export type EdEntity={id:string;name:string;slug:string;imageUrl?:string;status?:string};
export type EdCatalog={products:EdEntity[];categories:EdEntity[];articles:EdEntity[];pages:EdEntity[]};
export function resolveTarget(target:Destination,catalog:EdCatalog):string{
 switch(target.kind){
  case "home":return "/";
  case "products":return "/products";
  case "category":{const v=catalog.categories.find(x=>x.id===target.id||x.slug===target.id);return v?"/category/"+encodeURIComponent(v.slug):"/products";}
  case "product":{const v=catalog.products.find(x=>x.id===target.id);return v?"/product/"+encodeURIComponent(v.slug):"/products";}
  case "article":{const v=catalog.articles.find(x=>x.id===target.id);return v?"/blog/"+encodeURIComponent(v.slug):"/blog";}
  case "page":{if(target.id==="blog")return "/blog";if(target.id==="cart")return "/cart";if(target.id==="account")return "/account";const v=catalog.pages.find(x=>x.id===target.id||x.slug===target.id);return v?"/info/"+encodeURIComponent(v.slug):"/info/about";}
  case "external":return target.url?.startsWith("https://")?target.url:"#";
  default:return "#";
 }
}
export function editionTwoTitleFor(kind:string){return ({hero:"هیرو",categories:"کالکشن‌ها",featured:"منتخب فصل",campaign:"کمپین تصویری",story:"داستان برند",chapters:"فصل‌های تصویری",journal:"ژورنال",benefits:"مزایای فروشگاه",footer:"فوتر و هدر"} as Record<string,string>)[kind]||kind;}
