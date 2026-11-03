import {NextRequest,NextResponse} from "next/server";
import {createHash,timingSafeEqual} from "node:crypto";
import {z} from "zod";
import {db} from "@/lib/db";

export const runtime="nodejs";
const buyer=z.object({name:z.string().trim().min(2).max(150),phone:z.string().regex(/^09\d{9}$/),
 email:z.union([z.email(),z.literal("")]).optional(),province:z.string().trim().max(100).default(""),
 city:z.string().trim().max(100).default(""),address:z.string().trim().max(1000).default(""),
 postal:z.string().trim().max(20).default(""),note:z.string().trim().max(1200).default("")});
const schema=z.object({buyer,items:z.array(z.object({productId:z.string().min(1).max(150),variantId:z.string().max(150).optional(),quantity:z.number().int().min(1).max(30)})).min(1).max(40),
 shippingId:z.string().min(1).max(150),coupon:z.string().trim().max(48).optional()}).strict();
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{"Cache-Control":"no-store"}});
const equal=(a:string,b:string)=>{const x=createHash("sha256").update(a).digest(),y=createHash("sha256").update(b).digest();return timingSafeEqual(x,y)};

/** Server-to-server only. The shared secret must never reach browser JavaScript. */
export async function POST(req:NextRequest){
 const secret=process.env.STORE_API_SECRET;
 if(!secret || secret.length<32)return fail("Order service is not configured",503);
 if(!equal(req.headers.get("x-storefront-key")||"",secret))return fail("Unauthorized",401);
 if(Number(req.headers.get("content-length")||0)>30000)return fail("Request too large",413);
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return fail("اطلاعات سفارش معتبر نیست.",400);
 const input=parsed.data;

 try{
  const result=await db.$transaction(async tx=>{
   const settings=await tx.storeSettings.findUnique({where:{id:"main"}});
   if(settings?.siteType==="CORPORATE")throw Error("فروشگاه فعال نیست.");
   // Prevent accidental duplicate submissions without turning pending orders into payments.
   const recent=await tx.order.findFirst({where:{customerPhone:input.buyer.phone,status:"PENDING",createdAt:{gte:new Date(Date.now()-90000)}},orderBy:{createdAt:"desc"}});
   if(recent)throw Error("سفارش قبلی هنوز در حال بررسی است. کمی بعد دوباره اقدام کنید.");
   const ids=[...new Set(input.items.map(x=>x.productId))];
   const products=await tx.product.findMany({where:{id:{in:ids},status:"ACTIVE"},include:{variants:true}});
   if(products.length!==ids.length)throw Error("یک یا چند کالا دیگر قابل سفارش نیست.");
   const purchase=input.items.map(line=>{
    const product=products.find(p=>p.id===line.productId)!;
    const variant=line.variantId?product.variants.find(v=>v.id===line.variantId):undefined;
    if(line.variantId && !variant)throw Error("تنوع انتخابی معتبر نیست.");
    if(product.variants.length && !variant)throw Error("رنگ یا سایز محصول را انتخاب کنید.");
    if(line.quantity>(variant?.inventory??product.inventory))throw Error(`موجودی ${product.name} کافی نیست.`);
    const unitPrice=variant?.price??product.price;
    return {productId:product.id,title:product.name+(variant?` – ${variant.label}`:""),sku:variant?.sku??product.sku,quantity:line.quantity,unitPrice,total:unitPrice*line.quantity};
   });
   const subtotal=purchase.reduce((sum,item)=>sum+item.total,0);
   const coupon=input.coupon?await tx.coupon.findUnique({where:{code:input.coupon.toUpperCase()}}):null;
   let discount=0;
   if(input.coupon){
    if(!coupon||!coupon.enabled||(coupon.expiresAt&&coupon.expiresAt.getTime()<Date.now())||
      (coupon.usageLimit!==null&&coupon.usedCount>=coupon.usageLimit)||subtotal<coupon.minSubtotal)
      throw Error("کد تخفیف معتبر یا قابل استفاده نیست.");
    discount=coupon.type==="PERCENT"?Math.floor(subtotal*Math.min(100,coupon.amount)/100):Math.min(subtotal,coupon.amount);
   }
   const shipping=await tx.shippingMethod.findUnique({where:{id:input.shippingId}});
   if(!shipping||!shipping.enabled)throw Error("روش ارسال انتخاب‌شده معتبر نیست.");
   const pickup=shipping.id==="demo-pickup"||shipping.title.includes("حضوری");
   if(!pickup&&(!input.buyer.province||!input.buyer.city||!input.buyer.address))throw Error("نشانی ارسال کامل نیست.");
   const shippingCost=shipping.freeAbove!==null&&subtotal-discount>=shipping.freeAbove?0:shipping.cost;
   const total=Math.max(0,subtotal-discount+shippingCost);
   // Upsert by phone, avoiding overwrite of previously saved user contact data.
   const customer=await tx.customer.upsert({where:{phone:input.buyer.phone},
    create:{fullName:input.buyer.name,phone:input.buyer.phone,email:input.buyer.email||null},
    update:{fullName:input.buyer.name}});
   const order=await tx.order.create({data:{customerId:customer.id,customerName:input.buyer.name,customerPhone:input.buyer.phone,
     shippingAddress:{recipientName:input.buyer.name,recipientPhone:input.buyer.phone,province:input.buyer.province,
     city:input.buyer.city,street:input.buyer.address,postalCode:input.buyer.postal,email:input.buyer.email||""},
     shippingMethod:shipping.title,shippingCost,
     subtotal,discountTotal:discount,total,status:"PENDING",note:input.buyer.note,items:{create:purchase}}});
   // Coupon redemption and inventory reservation occur only after verified payment.
   await tx.auditLog.create({data:{resource:"orders",resourceId:order.id,operation:"CREATE_FROM_STOREFRONT"}});
   return {id:order.id,number:order.number,subtotal,discount,shipping:shippingCost,total,status:"PENDING"};
  });
  return NextResponse.json({order:result,paymentEnabled:false},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error("Public storefront order rejected",error instanceof Error?error.message:"unknown");
  return fail(error instanceof Error && !/Prisma|P20\d\d|Foreign key|Database/i.test(error.message)?error.message:"امکان ثبت سفارش وجود ندارد.",409);
 }
}
