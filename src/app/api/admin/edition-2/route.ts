import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireApiAdmin} from "@/lib/security";
import {editionTwoDefaults} from "@/lib/edition-two";
import {editionTwoSchema} from "@/lib/edition-two-schema";
import {Prisma} from "@prisma/client";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function access(request:NextRequest){
 const x=await requireApiAdmin(request);
 return "error" in x?NextResponse.json({error:x.error},{status:x.status}):null;
}
export async function GET(req:NextRequest){
 const denied=await access(req);if(denied)return denied;
 const [settings,products,categories,articles,pages]=await Promise.all([
  db.storeSettings.upsert({where:{id:"main"},create:{id:"main"},update:{}}),
  db.product.findMany({where:{status:"ACTIVE"},select:{id:true,name:true,slug:true,coverUrl:true},take:600}),
  db.category.findMany({select:{id:true,name:true,slug:true,imageUrl:true},take:200}),
  db.article.findMany({where:{status:"PUBLISHED"},select:{id:true,title:true,slug:true,coverUrl:true},take:100}),
  db.page.findMany({where:{status:"PUBLISHED"},select:{id:true,title:true,slug:true},take:100})
 ]);
 const published=editionTwoSchema.safeParse(settings.editorialConfig);
 const draft=editionTwoSchema.safeParse(settings.editorialDraft);
 return NextResponse.json({published:published.success?published.data:null,
  draft:draft.success?draft.data:published.success?published.data:editionTwoDefaults,
  hasUnpublishedDraft:draft.success,
  updatedAt:settings.updatedAt,
  catalog:{products:products.map(x=>({id:x.id,name:x.name,slug:x.slug,imageUrl:x.coverUrl||""})),
   categories:categories.map(x=>({id:x.id,name:x.name,slug:x.slug,imageUrl:x.imageUrl||""})),
   articles:articles.map(x=>({id:x.id,name:x.title,slug:x.slug,imageUrl:x.coverUrl||""})),
   pages:[...pages.map(x=>({id:x.id,name:x.title,slug:x.slug})),
    {id:"about",name:"درباره ما",slug:"about"},{id:"contact",name:"تماس با ما",slug:"contact"},
    {id:"privacy",name:"حریم خصوصی",slug:"privacy"},{id:"terms",name:"قوانین و مقررات",slug:"terms"},
    {id:"shipping",name:"ارسال و مرجوعی",slug:"shipping"},{id:"faq",name:"سؤالات متداول",slug:"faq"},
    {id:"blog",name:"ژورنال",slug:"blog"}]}
 },{headers:{"Cache-Control":"no-store"}});
}
export async function PUT(req:NextRequest){
 const denied=await access(req);if(denied)return denied;
 const parsed=editionTwoSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(x=>x.message).join("، ")},{status:400});
 await db.storeSettings.update({where:{id:"main"},data:{editorialDraft:parsed.data as Prisma.InputJsonValue}});
 await db.auditLog.create({data:{resource:"edition2",resourceId:"main",operation:"SAVE_DRAFT"}});
 return NextResponse.json({saved:true},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(req:NextRequest){
 const denied=await access(req);if(denied)return denied;
 const settings=await db.storeSettings.findUnique({where:{id:"main"}});
 const parsed=editionTwoSchema.safeParse(settings?.editorialDraft);
 if(!parsed.success)return NextResponse.json({error:"ابتدا پیش‌نویس معتبر را ذخیره کنید."},{status:400});
 const config=parsed.data;
 const targets=[...config.hero.map(s=>s.target),config.campaign.target,config.story.target,...config.navigation.map(s=>s.target)];
 const [productIds,categoryIds,articleIds,pageIds]=await Promise.all([
  db.product.findMany({where:{status:"ACTIVE"},select:{id:true}}),
  db.category.findMany({select:{id:true,slug:true}}),
  db.article.findMany({where:{status:"PUBLISHED"},select:{id:true}}),
  db.page.findMany({where:{status:"PUBLISHED"},select:{id:true,slug:true}})
 ]);
 const ids={product:new Set(productIds.map(x=>x.id)),category:new Set(categoryIds.flatMap(x=>[x.id,x.slug])),
  article:new Set(articleIds.map(x=>x.id)),page:new Set([...pageIds.flatMap(x=>[x.id,x.slug]),"blog","about","contact","terms","privacy","shipping","faq"])};
 for(const t of targets){
  if(t.kind in ids && !ids[t.kind as keyof typeof ids].has(t.id||""))
   return NextResponse.json({error:"یکی از لینک‌های داخلی به محتوای حذف‌شده یا منتشرنشده اشاره دارد."},{status:400});
 }
 for(const id of config.featured.productIds){
  if(!ids.product.has(id))return NextResponse.json({error:"یکی از محصولات منتخب دیگر فعال نیست."},{status:400});
 }
 for(const x of config.categories.items){
  if(!ids.category.has(x.categoryId))return NextResponse.json({error:"یکی از کالکشن‌ها حذف شده است."},{status:400});
 }
 await db.$transaction(async tx=>{
  await tx.storeSettings.update({where:{id:"main"},data:{
   editorialConfig:config as Prisma.InputJsonValue,editorialDraft:Prisma.DbNull,themeId:"design-2"
  }});
  await tx.auditLog.create({data:{resource:"edition2",resourceId:"main",operation:"PUBLISH"}});
 });
 return NextResponse.json({published:true,updatedAt:new Date().toISOString()},
  {headers:{"Cache-Control":"no-store"}});
}
