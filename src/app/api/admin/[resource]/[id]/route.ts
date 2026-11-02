import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireApiAdmin} from "@/lib/security";
import {cleanProductData,clientError,delegate,validateData,validateOrderChange,validateSpecialChange,validResource} from "@/lib/resources";
import {modules} from "@/lib/config";
export const runtime="nodejs";
type Context={params:Promise<{resource:string;id:string}>};
async function allowed(request:NextRequest,resource:string){
  const auth=await requireApiAdmin(request);
  if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  if(!validResource(resource))return NextResponse.json({error:"بخش وجود ندارد"},{status:404});
  const settings=await db.storeSettings.findUnique({where:{id:"main"}});
  if(modules[resource].storeOnly && settings?.siteType==="CORPORATE" ||
     modules[resource].corporateOnly && settings?.siteType!=="CORPORATE")return NextResponse.json({error:"دسترسی غیرفعال"},{status:403});
  return null;
}
export async function GET(request:NextRequest,{params}:Context){
  const {resource,id}=await params;const error=await allowed(request,resource);if(error)return error;
  try{
    const item=await delegate(resource).findUnique({where:{id},...(resource==="products"?{include:{variants:true,category:true}}:{}),
      ...(resource==="orders"?{include:{items:true,payments:true}}:{})});
    if(!item)return NextResponse.json({error:"مورد پیدا نشد"},{status:404});
    return NextResponse.json({item});
  }catch(e){return NextResponse.json({error:clientError(e)},{status:400});}
}
export async function PATCH(request:NextRequest,{params}:Context){
  const {resource,id}=await params;const error=await allowed(request,resource);if(error)return error;
  if(resource==="payments")return NextResponse.json({error:"وضعیت تراکنش فقط توسط درگاه معتبر قابل تغییر است"},{status:405});
  try{
    const body=await request.json();
    const item=await db.$transaction(async tx=>{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const delegate=(tx as any)[resource==="shipping"?"shippingMethod":resource==="projects"?"portfolioProject":resource==="categories"?"category":resource.slice(0,-1)];
      const existing=await delegate.findUnique({where:{id}});
      if(!existing)throw new Error("رکورد وجود ندارد");
      let data:Record<string,unknown>;
      if(resource==="orders")data=validateOrderChange(existing.status,body);
      else if(resource==="reviews"||resource==="leads")data=validateSpecialChange(resource,body);
      else data=validateData(resource,body,true);
      let updated;
      if(resource==="products"){
        const {normalized,variants}=cleanProductData(data);
        updated=await tx.product.update({where:{id},data:{...normalized,...(variants?{variants:{deleteMany:{},create:variants}}:{})} as never});
        if(updated.inventory!==existing.inventory)
          await tx.inventoryMovement.create({data:{productId:id,delta:updated.inventory-existing.inventory,reason:"اصلاح توسط مدیر"}});
      }else updated=await delegate.update({where:{id},data});
      await tx.auditLog.create({data:{resource,resourceId:id,operation:"UPDATE"}});
      return updated;
    });
    return NextResponse.json({item});
  }catch(e){return NextResponse.json({error:clientError(e)},{status:400});}
}
export async function DELETE(request:NextRequest,{params}:Context){
  const {resource,id}=await params;const error=await allowed(request,resource);if(error)return error;
  if(modules[resource].readonly || resource==="payments")return NextResponse.json({error:"حذف این رکورد مجاز نیست"},{status:405});
  try{
    await db.$transaction(async tx=>{
      // Products are archived, not physically destroyed, to retain order history.
      if(resource==="products")await tx.product.update({where:{id},data:{status:"ARCHIVED"}});
      else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const delegate=(tx as any)[resource==="shipping"?"shippingMethod":resource==="projects"?"portfolioProject":resource==="categories"?"category":resource.slice(0,-1)];
        await delegate.delete({where:{id}});
      }
      await tx.auditLog.create({data:{resource,resourceId:id,operation:"DELETE"}});
    });
    return NextResponse.json({ok:true});
  }catch(e){return NextResponse.json({error:clientError(e)},{status:400});}
}
