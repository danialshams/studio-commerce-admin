"use client";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {useEffect,useState,type ReactNode} from "react";
import {LayoutDashboard,PanelsTopLeft,Package,FolderOpen,ShoppingBag,Users,TicketPercent,
 Truck,CreditCard,MessageSquare,NotebookPen,Images,FileText,Settings,LogOut,
 Menu,X,ArrowUpLeft,House,ChevronLeft,Image as ImageIcon} from "lucide-react";
import {adminFetch,DEMO_MODE} from "@/lib/demo-api";
type NavItem={href:string;label:string;icon:typeof House};
const groups:{name:string;items:NavItem[]}[]=[
 {name:"محتوا و ظاهر فروشگاه",items:[
  {href:"/admin/editorial",label:"صفحه اصلی",icon:PanelsTopLeft},
  {href:"/admin/media",label:"کتابخانه تصاویر",icon:ImageIcon},
  {href:"/admin/articles",label:"ژورنال و مقالات",icon:NotebookPen},
  {href:"/admin/banners",label:"بنرها و کمپین‌ها",icon:Images},
  {href:"/admin/pages",label:"صفحات سایت",icon:FileText}]},
 {name:"فروشگاه",items:[
  {href:"/admin/products",label:"محصولات و موجودی",icon:Package},
  {href:"/admin/categories",label:"دسته‌بندی‌ها",icon:FolderOpen},
  {href:"/admin/coupons",label:"کدهای تخفیف",icon:TicketPercent}]},
 {name:"سفارش‌ها و مشتریان",items:[
  {href:"/admin/orders",label:"سفارش‌ها",icon:ShoppingBag},
  {href:"/admin/customers",label:"مشتریان",icon:Users},
  {href:"/admin/shipping",label:"حمل‌ونقل",icon:Truck},
  {href:"/admin/payments",label:"تراکنش‌ها",icon:CreditCard},
  {href:"/admin/reviews",label:"دیدگاه‌ها",icon:MessageSquare}]},
 {name:"فروشگاه من",items:[
  {href:"/admin/settings",label:"تنظیمات و سئو",icon:Settings}]}
];
export function EditionTwoShell({children,email}:{children:ReactNode;email:string}){
 const pathname=usePathname(),router=useRouter();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[storeName,setStoreName]=useState("ESSENTIAL");
 useEffect(()=>{setOpen(false)},[pathname]);
 useEffect(()=>{let alive=true;adminFetch("/api/admin/settings").then(r=>r.json()).then(d=>{
  if(alive&&d.settings?.storeName)setStoreName(d.settings.storeName)}).catch(()=>{});
  return()=>{alive=false};},[pathname]);
 useEffect(()=>{if(!open)return;const old=document.body.style.overflow;document.body.style.overflow="hidden";
  const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};
  document.addEventListener("keydown",key);return()=>{document.body.style.overflow=old;document.removeEventListener("keydown",key)}},[open]);
 async function signOut(){setBusy(true);try{await adminFetch("/api/auth/logout",{method:"POST"});router.replace("/login");router.refresh()}finally{setBusy(false)}}
 const location=groups.flatMap(g=>g.items).find(x=>pathname===x.href)?.label||"داشبورد";
 const sidebar=<>
  <div className="ed2-shell-brand"><Link href="/admin" aria-label="داشبورد طرح دو"><strong>E<span>.</span>02</strong><div><b>ESSENTIAL STUDIO</b><small>مدیریت فروشگاه ادیتوریال</small></div></Link>
    <button type="button" onClick={()=>setOpen(false)} aria-label="بستن منو" className="ed2-shell-close"><X size={19}/></button></div>
  <div className="ed2-current-store"><div className="ed2-store-monogram">{storeName.slice(0,1).toUpperCase()}</div><div><strong>{storeName}</strong><small>طراحی شماره ۲</small></div></div>
  <nav aria-label="منوی مدیریت طرح دو" className="ed2-side-navigation">
   <Link href="/admin" className={"ed2-side-link "+(pathname==="/admin"?"active":"")}><LayoutDashboard size={18}/><span>نمای کلی</span></Link>
   {groups.map(group=><div className="ed2-nav-group" key={group.name}><small>{group.name}</small>
    {group.items.map(item=><Link className={"ed2-side-link "+(pathname===item.href?"active":"")} href={item.href} key={item.href}>
     <item.icon size={18} strokeWidth={1.65}/><span>{item.label}</span></Link>)}</div>)}
  </nav>
  <div className="ed2-sidebar-bottom"><span className="ed2-side-user" title={email}>{email}</span>
   <button type="button" onClick={()=>void signOut()} disabled={busy||DEMO_MODE} aria-label="خروج از حساب" title={DEMO_MODE?"ورود نمایشی": "خروج"}><LogOut size={18}/></button></div>
 </>;
 return <div className="ed2-admin" dir="rtl">
  {open&&<button type="button" className="ed2-mobile-overlay" aria-label="بستن منو" onClick={()=>setOpen(false)}/>}
  <aside className={"ed2-sidebar "+(open?"open":"")}>{sidebar}</aside>
  <div className="ed2-shell-main">
   <header className="ed2-topbar"><div className="ed2-topbar-route">
    <button type="button" className="ed2-mobile-menu" aria-label="باز کردن منو" onClick={()=>setOpen(true)}><Menu size={21}/></button>
    <span className="ed2-breadcrumb">فروشگاه من <ChevronLeft size={13}/></span><strong>{location}</strong></div>
    <div className="ed2-topbar-end"><span className="ed2-topbar-store">{storeName}</span>
     <a href="https://essential-store-design-2.vercel.app" target="_blank" rel="noreferrer" title="مشاهده فروشگاه">مشاهده سایت <ArrowUpLeft size={17}/></a></div>
   </header>
   {DEMO_MODE&&<div className="ed2-demo-strip">پیش‌نمایش آزمایشی پنل — اطلاعات نمونه هستند و فروشگاه واقعی تغییر نمی‌کند.</div>}
   <main id="main-content" className="ed2-main-content">{children}</main>
  </div>
  <nav className="ed2-mobile-bottom" aria-label="ناوبری موبایل">
   {[{href:"/admin",label:"خانه",icon:House},{href:"/admin/editorial",label:"صفحه اصلی",icon:PanelsTopLeft},
     {href:"/admin/products",label:"محصولات",icon:Package},{href:"/admin/orders",label:"سفارش‌ها",icon:ShoppingBag}].map(x=><Link key={x.href} href={x.href} className={pathname===x.href?"active":""}><x.icon size={20}/><span>{x.label}</span></Link>)}
   <button onClick={()=>setOpen(true)} type="button" aria-label="سایر بخش‌ها"><Menu size={20}/><span>بیشتر</span></button>
  </nav>
 </div>;
}
