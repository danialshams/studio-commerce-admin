import { NextRequest,NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime="nodejs";
// Public read-only API for the three independent Next.js storefront themes.
// Checkout, inventory reservation and payment verification are intentionally
// NOT exposed as a dummy endpoint; a provider-specific integration is required.
export async function GET(request:NextRequest){
  const limit=Math.min(24,Math.max(1,Number(request.nextUrl.searchParams.get("limit"))||12));
  const settings=await db.storeSettings.findUnique({where:{id:"main"}});
  if(settings?.siteType!=="STORE")return NextResponse.json({products:[]});
  const products=await db.product.findMany({where:{status:"ACTIVE"},take:limit,orderBy:{createdAt:"desc"},
    select:{id:true,name:true,slug:true,price:true,comparePrice:true,coverUrl:true,inventory:true,featured:true,category:{select:{name:true,slug:true}},variants:{select:{id:true,label:true,price:true,inventory:true}}}});
  return NextResponse.json({products},{headers:{"Cache-Control":"public, s-maxage=30, stale-while-revalidate=60"}});
}
