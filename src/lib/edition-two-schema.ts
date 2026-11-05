import {z} from "zod";
const target=z.object({kind:z.enum(["none","home","products","product","category","page","article","external"]),
 id:z.string().max(150).optional(),url:z.string().max(2000).optional()}).superRefine((value,ctx)=>{
  if(["product","category","page","article"].includes(value.kind)&&!value.id)
   ctx.addIssue({code:"custom",message:"لینک داخلی باید مقصد انتخاب‌شده داشته باشد"});
  if(value.kind==="external"&&(!value.url||!value.url.startsWith("https://")))
   ctx.addIssue({code:"custom",message:"لینک خارجی باید HTTPS معتبر باشد"});
 });
const image=z.string().max(2000).refine(x=>!x||x.startsWith("https://")||x.startsWith("/images/"),"آدرس تصویر باید امن باشد");
const copy=z.object({title:z.string().max(160),description:z.string().max(800),imageUrl:image,
 mobileImageUrl:image.optional(),secondaryImageUrl:image.optional(),ctaLabel:z.string().max(60),target});
export const editionTwoSchema=z.object({
 version:z.literal(2),
 announcement:z.string().max(180),
 hero:z.array(z.object({id:z.string().max(80),title:z.string().max(160),description:z.string().max(800),
  eyebrow:z.string().max(90),imageUrl:image,mobileImageUrl:image,ctaLabel:z.string().max(60),
  target,enabled:z.boolean()})).min(1).max(6),
 categories:z.object({title:z.string().max(100),items:z.array(z.object({categoryId:z.string().max(150),
  imageUrl:image.optional()})).max(8)}),
 featured:z.object({title:z.string().max(100),description:z.string().max(240),
  productIds:z.array(z.string().max(150)).max(12)}),
 campaign:copy,story:copy,
 chapters:z.array(z.object({id:z.string().max(80),title:z.string().max(160),description:z.string().max(800),
  imageUrl:image,mobileImageUrl:image.optional()})).length(2),
 journal:z.object({title:z.string().max(100),articleIds:z.array(z.string().max(150)).max(12)}),
 benefits:z.array(z.object({id:z.string().max(80),title:z.string().max(120),
  description:z.string().max(200),icon:z.enum(["truck","package","headphones","shield"])})).max(6),
 footer:z.object({eyebrow:z.string().max(100),title:z.string().max(200),bottomNote:z.string().max(140)}),
 navigation:z.array(z.object({id:z.string().max(80),label:z.string().max(50),target})).max(12)
}).strict();
