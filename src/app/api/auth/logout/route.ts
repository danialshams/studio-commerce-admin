import {NextRequest,NextResponse} from "next/server";
import {clearSession,currentAdmin,sameOrigin} from "@/lib/security";
export const runtime="nodejs";
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return NextResponse.json({error:"مبدا نامعتبر"},{status:403});
  if(await currentAdmin())await clearSession();
  return NextResponse.json({ok:true});
}
