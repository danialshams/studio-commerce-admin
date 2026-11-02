"use client";
import {adminFetch,DEMO_MODE} from "@/lib/demo-api";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {useEffect,useState,type ReactNode} from "react";
import {Icon} from "@/components/Icon";
import {commonNavigation,corporateNavigation,modules,storeNavigation} from "@/lib/config";
export function AdminShell({children,email}:{children:ReactNode,email:string}){
 const pathname=usePathname(),router=useRouter();
 const [siteType,setSiteType]=useState<"STORE"|"CORPORATE">("STORE");
 const [storeName,setStoreName]=useState("سایت من");
 const [mobileOpen,setMobileOpen]=useState(false),[collapsed,setCollapsed]=useState(false),[logoutBusy,setLogoutBusy]=useState(false);
 useEffect(()=>{adminFetch("/api/admin/settings").then(r=>r.json()).then(d=>{if(d.settings){setSiteType(d.settings.siteType);setStoreName(d.settings.storeName);}}).catch(()=>{});},[pathname]);
 useEffect(()=>{setMobileOpen(false)},[pathname]);
 useEffect(()=>{const refresh=()=>adminFetch("/api/admin/settings").then(r=>r.json()).then(d=>{if(d.settings){setSiteType(d.settings.siteType);setStoreName(d.settings.storeName)}}).catch(()=>{});window.addEventListener("studio-settings-changed",refresh);return()=>window.removeEventListener("studio-settings-changed",refresh)},[]);
 const navigation=siteType==="STORE"?storeNavigation:corporateNavigation;
 const nav=(key:string)=>{const m=modules[key];return <Link key={key} href={"/admin/"+key} title={m.title} aria-current={pathname==="/admin/"+key?"page":undefined} className={"nav-link "+(pathname==="/admin/"+key?"active":"")}>
   <Icon name={m.icon} size={19}/><span>{m.title}</span></Link>};
 async function signOut(){setLogoutBusy(true);try{await adminFetch("/api/auth/logout",{method:"POST"});router.replace("/login");router.refresh();}finally{setLogoutBusy(false)}}
 return <div className={"admin-layout"+(collapsed?" admin-layout--collapsed":"")}>
   {mobileOpen&&<button aria-label="بستن منوی مدیریت" className="drawer-backdrop" onClick={()=>setMobileOpen(false)}/>}
   <aside className={"admin-sidebar "+(mobileOpen?"sidebar-open":"")}>
     <div className="brand-area"><Link href="/admin" className="brand"><span className="brand-logo"><Icon name="store" size={21}/></span><span className="brand-words"><strong>استودیو</strong><small>مدیریت یکپارچه سایت</small></span></Link>
       <button className="icon-button sidebar-close" onClick={()=>setMobileOpen(false)} aria-label="بستن منو"><Icon name="x" size={21}/></button>
     </div>
     <div className="site-identity"><span className="site-identity-dot"/><div><strong title={storeName}>{storeName}</strong><small>{siteType==="STORE"?"فروشگاه اینترنتی":"سایت شرکتی"}</small></div></div>
     <nav className="sidebar-nav" aria-label="منوی مدیریت"><span className="nav-caption">نمای کلی</span><Link href="/admin" aria-current={pathname==="/admin"?"page":undefined} className={"nav-link "+(pathname==="/admin"?"active":"")} title="داشبورد"><Icon name="layout-dashboard" size={19}/><span>داشبورد</span></Link>
       <span className="nav-caption">{siteType==="STORE"?"مدیریت فروشگاه":"مدیریت شرکت"}</span>{navigation.map(nav)}
       <span className="nav-caption">مدیریت محتوا</span>{commonNavigation.map(nav)}
       <span className="nav-caption">حساب و سایت</span>
       <Link href="/admin/settings" className={"nav-link "+(pathname==="/admin/settings"?"active":"")}><Icon name="settings" size={19}/><span>تنظیمات سایت</span></Link>
     </nav>
     <div className="sidebar-footer"><div className="admin-avatar">{email[0]?.toUpperCase()}</div><span className="admin-email" title={email}>{email}</span><button onClick={signOut} disabled={logoutBusy||DEMO_MODE} aria-label="خروج از پنل" title={DEMO_MODE?"نسخه نمایشی":"خروج"} className="icon-button logout-button"><Icon name="log-out" size={19}/></button></div>
   </aside>
   <div className="admin-main">{DEMO_MODE&&<div role="note" style={{background:"#edf5ff",padding:"10px 18px",fontSize:12,color:"#2856a0",textAlign:"center",borderBottom:"1px solid #dbe9ff"}}>نسخه نمایشی — تمام اطلاعات ساختگی‌اند و تغییرات پس از بارگذاری مجدد از بین می‌روند.</div>}<header className="admin-topbar">
     <div className="topbar-right"><button className="icon-button mobile-menu-button" onClick={()=>setMobileOpen(true)} aria-label="بازکردن منو"><Icon name="menu" size={23}/></button>
       <button className="icon-button collapse-button" onClick={()=>setCollapsed(!collapsed)} aria-label="تغییر اندازه منو"><Icon name={collapsed?"expand":"collapse"} size={20}/></button>
       <div className="topbar-location"><span className="crumb-muted">مدیریت</span><Icon name="chevron-left" size={15}/><strong>{pathname==="/admin"?"داشبورد":pathname==="/admin/settings"?"تنظیمات":modules[pathname.split("/").pop()||""]?.title||"بخش"}</strong></div>
     </div><div className="topbar-left"><span className="topbar-date">{new Intl.DateTimeFormat("fa-IR",{dateStyle:"long"}).format(new Date())}</span><span className="header-avatar">{email[0]?.toUpperCase()}</span></div>
   </header><main id="main-content" className="admin-content">{children}</main></div>
   <nav className="mobile-bottom-nav" aria-label="ناوبری سریع موبایل">
     {[{href:"/admin",icon:"layout-dashboard",label:"خانه"},{href:"/admin/products",icon:"package",label:"محصولات"},{href:"/admin/orders",icon:"shopping-bag",label:"سفارش‌ها"},{href:"/admin/pages",icon:"file-text",label:"محتوا"}].filter(x=>siteType==="STORE"||!["/admin/products","/admin/orders"].includes(x.href)).map(x=><Link href={x.href} key={x.href} aria-current={pathname===x.href?"page":undefined}><Icon name={x.icon} size={20}/><span>{x.label}</span></Link>)}
     <button onClick={()=>setMobileOpen(true)} aria-label="سایر بخش‌ها"><Icon name="menu" size={20}/><span>بیشتر</span></button>
   </nav>
 </div>;
}
