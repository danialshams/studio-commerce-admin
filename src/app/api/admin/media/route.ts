import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireApiAdmin} from "@/lib/security";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const auth=await requireApiAdmin(request);
 if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
 const limit=Math.min(200,Math.max(1,Number(request.nextUrl.searchParams.get("limit"))||100));
 const q=(request.nextUrl.searchParams.get("q")||"").trim().slice(0,100);
 const rows=await db.mediaAsset.findMany({
  where:q?{originalName:{contains:q,mode:"insensitive"}}:undefined,
  select:{id:true,url:true,originalName:true,mimeType:true,size:true,createdAt:true},
  take:limit,orderBy:{createdAt:"desc"}
 });
 return NextResponse.json({items:rows},{headers:{"Cache-Control":"no-store"}});
}
