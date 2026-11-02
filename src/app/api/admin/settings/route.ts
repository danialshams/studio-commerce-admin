import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireApiAdmin} from "@/lib/security";
import {z} from "zod";
import type {Prisma} from "@prisma/client";
export const runtime="nodejs";
const url=z.union([z.url().startsWith("https://").max(2000),z.literal("")]).nullable().optional();
const schema=z.object({
  siteType:z.enum(["STORE","CORPORATE"]),themeId:z.enum(["design-1","design-2","design-3","custom"]),
  storeName:z.string().trim().min(2).max(120),description:z.string().max(3000),logoUrl:url,
  contactEmail:z.string().max(180).nullable().optional(),contactPhone:z.string().max(30).nullable().optional(),
  address:z.string().max(500).nullable().optional(),instagram:z.string().max(200).nullable().optional(),
  orderNoticeEmail:z.string().max(180).nullable().optional(),seoTitle:z.string().max(120).nullable().optional(),
  seoDescription:z.string().max(500).nullable().optional(),homeSections:z.array(z.object({
    id:z.string().max(64),title:z.string().max(140),description:z.string().max(500),imageUrl:url,
    enabled:z.boolean(),position:z.number().int().min(0).max(200)
  })).max(35).default([])
});
export async function GET(request:NextRequest){
 const a=await requireApiAdmin(request);if("error" in a)return NextResponse.json({error:a.error},{status:a.status});
 const settings=await db.storeSettings.upsert({where:{id:"main"},create:{id:"main"},update:{}});
 return NextResponse.json({settings});
}
export async function PUT(request:NextRequest){
 const a=await requireApiAdmin(request);if("error" in a)return NextResponse.json({error:a.error},{status:a.status});
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(i=>i.message).join("، ")},{status:400});
 const data={...parsed.data,homeSections:parsed.data.homeSections as Prisma.InputJsonValue};
 const settings=await db.storeSettings.upsert({where:{id:"main"},create:{id:"main",...data},update:data});
 await db.auditLog.create({data:{resource:"settings",resourceId:"main",operation:"UPDATE"}});
 return NextResponse.json({settings});
}
