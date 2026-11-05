"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {PanelsTopLeft,Package,ShoppingBag,Users,ArrowLeft,ArrowUpLeft,AlertTriangle,NotebookPen,Images} from "lucide-react";
import {adminFetch} from "@/lib/demo-api";
import {formatMoney,formatValue} from "@/lib/ui";
type Summary={storeName:string;stats:Array<{label:string;value:number;money?:boolean}>;recent:Array<{id:string;number?:number;customerName?:string;total?:number;status?:string}>;lowStock:Array<{id:string;name:string;inventory:number}>};
const img="https://essential-store-design-2.vercel.app/images/editorial/story-portrait.webp";
export function EditionTwoDashboard(){
 const [summary,setSummary]=useState<Summary|null>(null),[error,setError]=useState("");
 useEffect(()=>{adminFetch("/api/admin/summary").then(r=>r.json()).then(d=>{
  if(d.error)throw Error(d.error);setSummary(d)}).catch(e=>setError(e.message))},[]);
 return <div className="ed2-dashboard">
  <div className="ed2-page-heading"><div><small>STORE OVERVIEW / EDITION 02</small><h1>نمای کلی فروشگاه</h1>
   <p>وضعیت فروشگاه و دسترسی سریع به بخش‌های مهم.</p></div><Link href="/admin/editorial" className="ed2-button ed2-button-dark">مدیریت صفحه اصلی <PanelsTopLeft size={17}/></Link></div>
  {error&&<div className="ed2-error" role="alert">{error}</div>}
  <div className="ed2-metrics">{(summary?.stats||[{label:"فروش این ماه",value:0},{label:"سفارش‌های در جریان",value:0},{label:"مشتریان",value:0},{label:"محصولات",value:0}]).map((x,i)=>
   <div className="ed2-metric" key={i}><small>{x.label}</small><strong>{x.money?formatMoney(x.value):formatValue(x.value)}</strong>
    <span>{[<ShoppingBag key={1}/>,<Package key={2}/>,<Users key={3}/>,<Package key={4}/>][i]}</span></div>)}</div>
  <div className="ed2-dashboard-main"><Link href="/admin/editorial" className="ed2-dashboard-editorial"><img src={img} alt="پیش‌نمایش بخش داستان برند"/>
   <div><small>YOUR STORE / EDITION 02</small><h2>ظاهر فروشگاه را همان‌طور که دیده می‌شود مدیریت کنید.</h2>
    <span>ویرایش صفحه اصلی <ArrowUpLeft size={19}/></span></div></Link>
   <div className="ed2-dashboard-shortcuts"><h2>دسترسی سریع</h2>
    {[{href:"/admin/products",label:"افزودن محصول",icon:Package},{href:"/admin/orders",label:"پیگیری سفارش‌ها",icon:ShoppingBag},
      {href:"/admin/articles",label:"نوشتن مقاله",icon:NotebookPen},{href:"/admin/banners",label:"مدیریت کمپین‌ها",icon:Images}].map(x=>
      <Link key={x.href} href={x.href}><x.icon size={19}/><span>{x.label}</span><ArrowLeft size={17}/></Link>)}</div>
  </div>
  <div className="ed2-dashboard-lists"><section className="ed2-surface"><header><h2>آخرین سفارش‌ها</h2><Link href="/admin/orders">مشاهده همه <ArrowLeft size={15}/></Link></header>
   {(summary?.recent||[]).length?summary!.recent.map(x=><div key={x.id} className="ed2-dash-row">
    <span>{x.customerName||"مشتری"} <small>#{x.number||"—"}</small></span>
    <strong>{formatMoney(x.total||0)}</strong></div>):<p className="ed2-empty-small">سفارشی ثبت نشده است.</p>}</section>
   <section className="ed2-surface"><header><h2>نیازمند بررسی موجودی</h2><Link href="/admin/products">محصولات <ArrowLeft size={15}/></Link></header>
   {(summary?.lowStock||[]).length?summary!.lowStock.map(x=><div className="ed2-dash-row" key={x.id}><span>{x.name}</span>
    <span className="ed2-stock-low"><AlertTriangle size={14}/> {formatValue(x.inventory)} عدد</span></div>):<p className="ed2-empty-small">موجودی بحرانی ثبت نشده است.</p>}</section></div>
 </div>;
}
