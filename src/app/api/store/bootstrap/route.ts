import {NextResponse} from "next/server";
import {db} from "@/lib/db";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Public presentation data only. Never expose users, orders or coupon secrets. */
export async function GET(){
 try{
  const [settings,categories,products,banners,pages,articles,shipping,reviews]=await Promise.all([
   db.storeSettings.findUnique({where:{id:"main"}}),
   db.category.findMany({orderBy:{name:"asc"}}),
   db.product.findMany({where:{status:"ACTIVE"},orderBy:{createdAt:"desc"},take:600,include:{category:{select:{name:true,slug:true}},variants:true}}),
   db.banner.findMany({where:{active:true},orderBy:{position:"asc"}}),
   db.page.findMany({where:{status:"PUBLISHED"},select:{id:true,slug:true,title:true,body:true,seoTitle:true,seoDescription:true}}),
   db.article.findMany({where:{status:"PUBLISHED"},orderBy:{createdAt:"desc"},take:100,select:{id:true,slug:true,title:true,summary:true,body:true,coverUrl:true,createdAt:true,seoTitle:true,seoDescription:true}}),
   db.shippingMethod.findMany({where:{enabled:true},orderBy:{title:"asc"}}),
   db.review.findMany({where:{status:"APPROVED"},orderBy:{createdAt:"desc"},take:400,select:{productId:true,author:true,rating:true,body:true,createdAt:true}})
  ]);
  if(settings?.siteType==="CORPORATE")return NextResponse.json({error:"Storefront is not enabled"},{status:404});
  const publicSettings=settings?{
   siteType:settings.siteType,themeId:settings.themeId,storeName:settings.storeName,
   description:settings.description,logoUrl:settings.logoUrl,contactEmail:settings.contactEmail,
   contactPhone:settings.contactPhone,address:settings.address,instagram:settings.instagram,
   seoTitle:settings.seoTitle,seoDescription:settings.seoDescription,homeSections:settings.homeSections,
   editorialConfig:settings.editorialConfig
  }:null;
  return NextResponse.json({mode:"live",settings:publicSettings,categories,products,banners,pages,articles,shipping,reviews},
   {headers:{"Cache-Control":"public, s-maxage=10, stale-while-revalidate=20"}});
 }catch(error){console.error("Public storefront bootstrap failed",error);return NextResponse.json({error:"Catalog temporarily unavailable"},{status:503});}
}
