import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireApiAdmin} from "@/lib/security";
import {cleanProductData,clientError,delegate,validateData,validResource} from "@/lib/resources";
import {modules} from "@/lib/config";
export const runtime="nodejs";
type Context={params:Promise<{resource:string}>};
async function allow(request:NextRequest,resource:string){
  const auth=await requireApiAdmin(request);
  if("error" in auth)return {error:NextResponse.json({error:auth.error},{status:auth.status})};
  if(!validResource(resource))return {error:NextResponse.json({error:"بخش وجود ندارد"},{status:404})};
  const setting=await db.storeSettings.findUnique({where:{id:"main"}});
  if(modules[resource].storeOnly && setting?.siteType==="CORPORATE" ||
     modules[resource].corporateOnly && setting?.siteType!=="CORPORATE")return {error:NextResponse.json({error:"این بخش در نوع سایت فعلی فعال نیست"},{status:403})};
  return {error:null};
}
export async function GET(request:NextRequest,{params}:Context){
  const {resource}=await params;const access=await allow(request,resource);if(access.error)return access.error;
  const query=request.nextUrl.searchParams;
  const page=Math.max(1,Math.min(10000,Number(query.get("page"))||1));
  const take=Math.max(1,Math.min(250,Number(query.get("limit"))||15));
  const search=(query.get("q")||"").trim().slice(0,100);
  const searchKey=resource==="orders"?"customerName":resource==="customers"?"fullName":resource==="coupons"?"code":
    resource==="reviews"?"author":resource==="leads"?"name":resource==="payments"?"provider":
    ["products","categories"].includes(resource)?"name": "title";
  const where=search?{[searchKey]:{contains:search,mode:"insensitive"}}:{};
  const d=delegate(resource);
  const orderBy=resource==="shipping"?{title:"asc"}:resource==="categories"?{name:"asc"}:resource==="coupons"?{createdAt:"desc"}:
    resource==="services"||resource==="projects"?{title:"asc"}:resource==="banners"?{position:"asc"}:{createdAt:"desc"};
  try{
    const [total,items]=await Promise.all([d.count({where}),d.findMany({where,orderBy,skip:(page-1)*take,take,
      ...(resource==="products"?{include:{category:{select:{name:true}},variants:true}}:{}),
      ...(resource==="orders"?{include:{items:true,payments:{select:{id:true,amount:true,status:true,provider:true,reference:true}}}}:{}),
      ...(resource==="customers"?{include:{_count:{select:{orders:true}}}}:{})})]);
    return NextResponse.json({items,total,page,pages:Math.ceil(total/take)});
  }catch(e){return NextResponse.json({error:clientError(e)},{status:500});}
}
export async function POST(request:NextRequest,{params}:Context){
  const {resource}=await params;const access=await allow(request,resource);if(access.error)return access.error;
  if(modules[resource].readonly)return NextResponse.json({error:"ایجاد مستقیم این رکورد مجاز نیست"},{status:405});
  try{
    const body=await request.json();const data=validateData(resource,body);
    const result=await db.$transaction(async tx=>{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d=(tx as any)[resource==="shipping"?"shippingMethod":resource==="projects"?"portfolioProject":resource==="categories"?"category":resource.slice(0,-1)];
      let created;
      if(resource==="products"){
        const {normalized,variants}=cleanProductData(data);
        created=await tx.product.create({data:{...normalized,variants:{create:variants||[]}} as never});
        if(created.inventory>0)await tx.inventoryMovement.create({data:{productId:created.id,delta:created.inventory,reason:"موجودی اولیه"}});
      }else created=await d.create({data});
      await tx.auditLog.create({data:{resource,resourceId:created.id,operation:"CREATE"}});
      return created;
    });
    return NextResponse.json({item:result},{status:201});
  }catch(e){return NextResponse.json({error:clientError(e)},{status:400});}
}
