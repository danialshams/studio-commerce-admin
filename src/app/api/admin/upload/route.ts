import {NextRequest,NextResponse} from "next/server";
import {PutObjectCommand,S3Client} from "@aws-sdk/client-s3";
import {randomUUID} from "node:crypto";
import {requireApiAdmin} from "@/lib/security";
export const runtime="nodejs";
const LIMIT=5*1024*1024;
function detect(bytes:Uint8Array){
  if(bytes.length>3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return {ext:"jpg",type:"image/jpeg"};
  if(bytes.length>8&&bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47)return {ext:"png",type:"image/png"};
  if(bytes.length>12&&new TextDecoder().decode(bytes.slice(0,4))==="RIFF"&&new TextDecoder().decode(bytes.slice(8,12))==="WEBP")return {ext:"webp",type:"image/webp"};
  return null;
}
export async function POST(req:NextRequest){
  const auth=await requireApiAdmin(req);if("error" in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  if(!process.env.S3_ENDPOINT||!process.env.S3_BUCKET||!process.env.S3_ACCESS_KEY_ID||!process.env.S3_SECRET_ACCESS_KEY||!process.env.S3_PUBLIC_URL)
    return NextResponse.json({error:"برای آپلود تصویر، فضای ذخیره‌سازی S3 را در سرور تنظیم کنید"},{status:503});
  const reported=Number(req.headers.get("content-length")||"0");
  if(reported>LIMIT+8192)return NextResponse.json({error:"حجم فایل بیش از حد مجاز است"},{status:413});
  const form=await req.formData().catch(()=>null),file=form?.get("file");
  if(!(file instanceof File)||file.size<100||file.size>LIMIT)
    return NextResponse.json({error:"تصویر باید کمتر از ۵ مگابایت باشد"},{status:400});
  const bytes=new Uint8Array(await file.arrayBuffer());const format=detect(bytes);
  if(!format)return NextResponse.json({error:"فقط JPG، PNG یا WebP مجاز است"},{status:400});
  const s3=new S3Client({region:process.env.S3_REGION||"auto",endpoint:process.env.S3_ENDPOINT,forcePathStyle:true,
    credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}});
  const key="media/"+new Date().toISOString().slice(0,7)+"/"+randomUUID()+"."+format.ext;
  try{
    await s3.send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,Body:bytes,ContentType:format.type,CacheControl:"public,max-age=31536000,immutable"}));
    return NextResponse.json({url:process.env.S3_PUBLIC_URL.replace(/\/$/,"")+"/"+key});
  }catch{
    return NextResponse.json({error:"آپلود انجام نشد؛ اتصال فضای ذخیره‌سازی را بررسی کنید"},{status:502});
  }
}
