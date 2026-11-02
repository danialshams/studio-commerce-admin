"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {Icon} from "@/components/Icon";
import {formatMoney,formatValue} from "@/lib/ui";
type Summary={siteType:"STORE"|"CORPORATE";storeName:string;stats:{label:string;value:number;money?:boolean}[];recent:Record<string,unknown>[];lowStock?:{id:string;name:string;inventory:number}[]};
export function Dashboard(){const [summary,setSummary]=useState<Summary|null>(null),[error,setError]=useState("");
 useEffect(()=>{let alive=true;fetch("/api/admin/summary").then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);if(alive)setSummary(d)}).catch(e=>{if(alive)setError(e.message)});return()=>{alive=false}},[]);
 const isStore=summary?.siteType!=="CORPORATE";
 return <div className="page-anim"><div className="page-heading"><div><span className="section-overline">نمای کلی</span><h1>خوش آمدی <span className="heading-wave">✳</span></h1><p>وضعیت {isStore?"فروشگاه":"سایت"} را در یک نگاه ببین.</p></div><Link className="button btn-outline" href="/admin/settings"><Icon name="settings" size={17}/> تنظیمات سایت</Link></div>
 {error&&<div role="alert" className="error-box">{error}</div>}
 <div className="metric-grid">{summary?.stats.map((metric,i)=><div className="metric-card" key={metric.label}><div className="metric-heading"><span>{metric.label}</span><span className="metric-symbol"><Icon name={["bar-chart-3","shopping-bag","users","package"][i]||"bar-chart-3"} size={18}/></span></div><strong>{metric.money?formatMoney(metric.value):formatValue(metric.value)}</strong><small>{metric.money?"مجموع سفارش‌های پرداخت‌شده":"بروزرسانی از داده‌های سایت"}</small></div>)||[0,1,2,3].map(i=><div className="metric-card metric-skeleton" key={i}><i/><i/><i/></div>)}</div>
 <div className="dashboard-columns"><section className="surface-card"><div className="card-heading"><div><h2>{isStore?"آخرین سفارش‌ها":"آخرین درخواست‌ها"}</h2><p>جدیدترین فعالیت‌های ثبت‌شده</p></div><Link href={isStore?"/admin/orders":"/admin/leads"} className="text-link">مشاهده همه <Icon name="arrow-left" size={16}/></Link></div>
 {summary?.recent?.length?<div className="recent-list">{summary.recent.map(r=><div className="recent-row" key={String(r.id)}><span className="recent-avatar">{String(r.customerName||r.name||"م")[0]}</span><div><strong>{String(r.customerName||r.name||"مشتری")}</strong><small>{r.number?`سفارش #${formatValue(Number(r.number))}`:String(r.subject||"درخواست جدید")}</small></div><span className="recent-price">{r.total!=null?formatMoney(Number(r.total)):String(r.status||"")}</span></div>)}</div>:<div className="empty-state small-empty"><Icon name="inbox" size={30}/><strong>هنوز فعالیتی ثبت نشده است</strong><p>با ثبت اولین داده، اطلاعات اینجا نمایش داده می‌شود.</p></div>}</section>
 <section className="surface-card"><div className="card-heading"><div><h2>{isStore?"موجودی کم":"دسترسی سریع"}</h2><p>{isStore?"محصولاتی که به بررسی نیاز دارند":"مدیریت محتوای سایت"}</p></div></div>
 {isStore&&summary?.lowStock?.length?<div className="lowstock-list">{summary.lowStock.map(p=><Link key={p.id} href="/admin/products" className="lowstock-row"><span><Icon name="alert" size={18}/></span><div><strong>{p.name}</strong><small>{formatValue(p.inventory)} عدد باقی‌مانده</small></div><Icon name="chevron-left" size={16}/></Link>)}</div>:<div className="quick-actions">
 <Link href={isStore?"/admin/products":"/admin/services"} className="quick-action"><span><Icon name={isStore?"package":"briefcase"} size={21}/></span><strong>{isStore?"مدیریت محصولات":"خدمات شرکت"}</strong><Icon name="arrow-left" size={16}/></Link>
 <Link href="/admin/banners" className="quick-action"><span><Icon name="images" size={21}/></span><strong>بنرهای سایت</strong><Icon name="arrow-left" size={16}/></Link>
 <Link href="/admin/pages" className="quick-action"><span><Icon name="file-text" size={21}/></span><strong>ویرایش صفحات</strong><Icon name="arrow-left" size={16}/></Link>
 </div>}</section></div>
 <div className="dashboard-note"><Icon name="check" size={18}/><span>قیمت‌ها و گزارش‌های مالی با واحد ثابت <strong>تومان</strong> محاسبه می‌شوند.</span></div></div>;
}
