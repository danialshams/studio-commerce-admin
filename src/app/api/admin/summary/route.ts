import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireApiAdmin} from "@/lib/security";
export const runtime="nodejs";
export async function GET(request:NextRequest){
  const a=await requireApiAdmin(request);if("error" in a)return NextResponse.json({error:a.error},{status:a.status});
  const settings=await db.storeSettings.upsert({where:{id:"main"},create:{id:"main"},update:{}});
  if(settings.siteType==="CORPORATE"){
    const [leads,services,projects,pages,recent]=await Promise.all([
      db.lead.count(),db.service.count(),db.portfolioProject.count(),db.page.count(),
      db.lead.findMany({take:5,orderBy:{createdAt:"desc"}})]);
    return NextResponse.json({siteType:settings.siteType,storeName:settings.storeName,
      stats:[{label:"درخواست‌های دریافتی",value:leads},{label:"خدمات",value:services},
        {label:"نمونه‌کارها",value:projects},{label:"صفحات",value:pages}],recent});
  }
  const today=new Date();today.setHours(0,0,0,0);
  const month=new Date(today.getFullYear(),today.getMonth(),1);
  const [total,open,customers,active,lowStock,monthSales,recent]=await Promise.all([
    db.order.count(),db.order.count({where:{status:{in:["PENDING","CONFIRMED","PACKING"]}}}),
    db.customer.count(),db.product.count({where:{status:"ACTIVE"}}),
    db.product.findMany({where:{status:"ACTIVE",inventory:{lte:5}},select:{id:true,name:true,inventory:true},take:8,orderBy:{inventory:"asc"}}),
    db.order.aggregate({where:{createdAt:{gte:month},payments:{some:{status:"PAID"}}},_sum:{total:true}}),
    db.order.findMany({take:6,orderBy:{createdAt:"desc"},select:{id:true,number:true,customerName:true,total:true,status:true,createdAt:true}})
  ]);
  return NextResponse.json({siteType:settings.siteType,storeName:settings.storeName,
    stats:[{label:"فروش پرداخت‌شده این ماه",value:monthSales._sum.total||0,money:true},
      {label:"سفارش‌های در جریان",value:open},{label:"مشتریان",value:customers},
      {label:"محصولات منتشرشده",value:active}],total,lowStock,recent});
}
