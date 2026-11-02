import { db } from "@/lib/db";
import { z } from "zod";
import { modules } from "@/lib/config";

const text=z.string().trim().max(500);
const longText=z.string().trim().max(50000);
const money=z.coerce.number().int().min(0).max(2_000_000_000);
const units=z.coerce.number().int().min(0).max(1_000_000);
const slug=z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120);
const optionalUrl=z.union([z.url().startsWith("https://").max(2000),z.literal("")]).nullable().optional();
const yes=z.boolean().optional();
const status=z.enum(["DRAFT","ACTIVE","ARCHIVED"]);
const variant=z.object({label:text.min(1),sku:text.nullable().optional(),price:money.nullable().optional(),inventory:units,attributes:z.record(z.string(),z.string()).optional()});
const product=z.object({name:text.min(1),slug,description:longText.default(""),sku:text.nullable().optional(),
  price:money,comparePrice:money.nullable().optional(),inventory:units.default(0),lowStockAt:units.default(5),
  coverUrl:optionalUrl,categoryId:z.string().nullable().optional(),featured:z.boolean().default(false),status:status.default("DRAFT"),
  gallery:z.array(z.url().startsWith("https://").max(2000)).max(15).default([]),
  attributes:z.record(z.string(),z.string()).default({}),variants:z.array(variant).max(80).default([])});
const schemas={
 products:product,
 categories:z.object({name:text.min(1),slug,description:longText.default(""),imageUrl:optionalUrl}),
 customers:z.object({fullName:text.min(1),phone:text.nullable().optional(),email:z.union([z.email(),z.literal("")]).nullable().optional(),notes:longText.default("")}),
 coupons:z.object({code:z.string().trim().min(3).max(48).regex(/^[A-Za-z0-9_-]+$/),type:z.enum(["PERCENT","FIXED"]),amount:money,
   minSubtotal:money.default(0),usageLimit:units.nullable().optional(),enabled:z.boolean().default(true),expiresAt:z.coerce.date().nullable().optional()}),
 shipping:z.object({title:text.min(1),cost:money,freeAbove:money.nullable().optional(),estimatedDays:text.nullable().optional(),enabled:z.boolean().default(true)}),
 pages:z.object({title:text.min(1),slug,body:longText.default(""),seoTitle:text.nullable().optional(),seoDescription:text.nullable().optional(),status:z.enum(["DRAFT","PUBLISHED"]).default("DRAFT")}),
 articles:z.object({title:text.min(1),slug,summary:longText.default(""),body:longText.default(""),coverUrl:optionalUrl,
   seoTitle:text.nullable().optional(),seoDescription:text.nullable().optional(),status:z.enum(["DRAFT","PUBLISHED"]).default("DRAFT")}),
 banners:z.object({title:text.min(1),subtitle:text.default(""),imageUrl:optionalUrl,linkUrl:optionalUrl,position:units.default(0),active:z.boolean().default(true)}),
 services:z.object({title:text.min(1),slug,description:longText.default(""),imageUrl:optionalUrl,active:z.boolean().default(true)}),
 projects:z.object({title:text.min(1),description:longText.default(""),imageUrl:optionalUrl,linkUrl:optionalUrl,active:z.boolean().default(true)})
} as const;
export const delegateNames:Record<string,string>={products:"product",categories:"category",orders:"order",customers:"customer",coupons:"coupon",shipping:"shippingMethod",payments:"payment",reviews:"review",pages:"page",articles:"article",banners:"banner",services:"service",projects:"portfolioProject",leads:"lead"};
export function validResource(resource:string){return !!modules[resource] && !!delegateNames[resource];}
export function validateData(resource:string,body:unknown,partial=false):Record<string,unknown>{
  const schema=schemas[resource as keyof typeof schemas];
  if(!schema)throw new Error("امکان ایجاد این نوع رکورد وجود ندارد");
  const parsed=(partial?schema.partial():schema).safeParse(body);
  if(!parsed.success)throw new Error(parsed.error.issues.map(x=>`${x.path.join(".")}: ${x.message}`).join("، "));
  const data=parsed.data as Record<string,unknown>;
  if(resource==="coupons"&&data.type==="PERCENT"&&typeof data.amount==="number"&&data.amount>100)
    throw new Error("درصد تخفیف باید بین ۰ تا ۱۰۰ باشد");
  if(resource==="products"){
    if("comparePrice" in data && typeof data.comparePrice==="number" && typeof data.price==="number" && data.comparePrice<data.price)
      throw new Error("قیمت قبل از تخفیف باید حداقل برابر قیمت فروش باشد");
    if("variants" in data){
      const v=data.variants as {label:string;sku?:string|null}[];
      if(new Set(v.map(x=>x.sku).filter(Boolean)).size!==v.filter(x=>x.sku).length) throw new Error("SKU تنوع‌ها نباید تکراری باشد");
    }
  }
  return data;
}
// Prisma delegate selection is restricted to the allowlist above. Never pass
// arbitrary client-provided model names into a database operation.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function delegate(resource:string):any{
  if(!validResource(resource))throw new Error("بخش نامعتبر");
  return (db as unknown as Record<string,unknown>)[delegateNames[resource]];
}
export function cleanProductData(payload:Record<string,unknown>){
  const {variants,...rest}=payload;
  const normalized={...rest};
  // Product availability is the sum of variant stocks when variants exist.
  if(Array.isArray(variants) && variants.length)normalized.inventory=variants.reduce((n,v)=>n+Number(v.inventory||0),0);
  if(normalized.sku==="")normalized.sku=null;
  if(normalized.categoryId==="")normalized.categoryId=null;
  if(normalized.coverUrl==="")normalized.coverUrl=null;
  return {normalized,variants:variants as Array<Record<string,unknown>>|undefined};
}
export const transitions:Record<string,readonly string[]>={
  PENDING:["CONFIRMED","CANCELLED"],CONFIRMED:["PACKING","CANCELLED"],
  PACKING:["SHIPPED","CANCELLED"],SHIPPED:["DELIVERED","RETURNED"],
  DELIVERED:["RETURNED"],CANCELLED:[],RETURNED:[]
};
export function validateOrderChange(oldStatus:string,body:unknown){
  const parsed=z.object({status:z.enum(["PENDING","CONFIRMED","PACKING","SHIPPED","DELIVERED","CANCELLED","RETURNED"]).optional(),trackingCode:text.optional(),note:longText.optional()}).strict().parse(body);
  if(parsed.status && parsed.status!==oldStatus && !(transitions[oldStatus]||[]).includes(parsed.status))
    throw new Error("این تغییر وضعیت سفارش مجاز نیست");
  return parsed;
}
export function validateSpecialChange(resource:string,body:unknown){
  if(resource==="reviews") return z.object({status:z.enum(["PENDING","APPROVED","REJECTED"])}).strict().parse(body);
  if(resource==="leads") return z.object({status:z.enum(["NEW","CONTACTED","CLOSED"])}).strict().parse(body);
  throw new Error("ویرایش این بخش مجاز نیست");
}
export function clientError(error:unknown){
  if(error instanceof z.ZodError)return error.issues.map(i=>i.message).join("، ");
  if(error instanceof Error && !/Unique constraint|Foreign key|PrismaClient|Database|P20\d\d/.test(error.message))return error.message;
  return "عملیات انجام نشد؛ داده‌ها یا اتصال پایگاه داده را بررسی کنید";
}
