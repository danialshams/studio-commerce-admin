"use client";
import {useEffect,useState,type FormEvent} from "react";
import {Icon} from "@/components/Icon";
type Section={id:string;title:string;description:string;imageUrl?:string|null;enabled:boolean;position:number};
type Settings={siteType:"STORE"|"CORPORATE";themeId:"design-1"|"design-2"|"design-3"|"custom";storeName:string;description:string;logoUrl?:string|null;contactEmail?:string|null;contactPhone?:string|null;address?:string|null;instagram?:string|null;orderNoticeEmail?:string|null;seoTitle?:string|null;seoDescription?:string|null;homeSections:Section[]};
export function SettingsPage(){
 const [data,setData]=useState<Settings|null>(null),[saving,setSaving]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState(false);
 useEffect(()=>{fetch("/api/admin/settings").then(r=>r.json()).then(r=>setData(r.settings||null)).catch(()=>setError("تنظیمات بارگذاری نشد"))},[]);
 function set<K extends keyof Settings>(key:K,value:Settings[K]){setData(d=>d?({...d,[key]:value}):d);setSuccess(false)}
 async function save(e:FormEvent){e.preventDefault();if(!data)return;setSaving(true);setError("");setSuccess(false);
  try{const resp=await fetch("/api/admin/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    const result=await resp.json();if(!resp.ok)throw Error(result.error||"ذخیره ناموفق بود");setData(result.settings);setSuccess(true);window.dispatchEvent(new Event("studio-settings-changed"));}
  catch(e){setError(e instanceof Error?e.message:"خطا");}finally{setSaving(false)} }
 function editSection(index:number,field:keyof Section,value:unknown){if(!data)return;const arr=[...data.homeSections];arr[index]={...arr[index],[field]:value};set("homeSections",arr)}
 function removeSection(i:number){if(data)set("homeSections",data.homeSections.filter((_,j)=>j!==i))}
 if(!data)return <div className="page-anim"><div className="page-heading"><h1>تنظیمات سایت</h1></div>{error?<div className="error-box">{error}</div>:<div className="table-loading">در حال دریافت تنظیمات...</div>}</div>;
 return <div className="page-anim"><div className="page-heading"><div><span className="section-overline">پیکربندی سایت</span><h1>تنظیمات سایت</h1><p>اطلاعات کسب‌وکار، قالب انتخابی و بخش‌های صفحه اصلی</p></div></div>
 <form onSubmit={save} className="settings-layout">
  <section className="surface-card settings-card"><div className="card-heading"><div><h2>مشخصات وب‌سایت</h2><p>تنظیمات اصلی و اطلاعات تماس</p></div><Icon name="settings" size={22}/></div>
  <div className="settings-grid"><label>نوع سایت<select value={data.siteType} onChange={e=>set("siteType",e.target.value as Settings["siteType"])}><option value="STORE">فروشگاه اینترنتی</option><option value="CORPORATE">شرکتی و خدماتی</option></select></label>
   <label>قالب وب‌سایت<select value={data.themeId} onChange={e=>set("themeId",e.target.value as Settings["themeId"])}><option value="design-1">طراحی ۱ — ساده</option><option value="design-2">طراحی ۲ — حرفه‌ای</option><option value="design-3">طراحی ۳ — ویژه</option><option value="custom">طراحی اختصاصی</option></select></label>
   <label>نام سایت<input required minLength={2} maxLength={120} value={data.storeName} onChange={e=>set("storeName",e.target.value)}/></label>
   <label>شماره تماس<input inputMode="tel" dir="ltr" value={data.contactPhone||""} onChange={e=>set("contactPhone",e.target.value)}/></label>
   <label>ایمیل ارتباطی<input type="email" dir="ltr" value={data.contactEmail||""} onChange={e=>set("contactEmail",e.target.value)}/></label>
   <label>اینستاگرام<input dir="ltr" value={data.instagram||""} onChange={e=>set("instagram",e.target.value)}/></label>
   <label className="wide">توضیحات کسب‌وکار<textarea rows={3} value={data.description||""} onChange={e=>set("description",e.target.value)}/></label>
   <label className="wide">آدرس<input value={data.address||""} onChange={e=>set("address",e.target.value)}/></label>
   <label className="wide">آدرس لوگو<input dir="ltr" type="url" placeholder="https://..." value={data.logoUrl||""} onChange={e=>set("logoUrl",e.target.value)}/></label>
  </div></section>
  <section className="surface-card settings-card"><div className="card-heading"><div><h2>سئو و نمایش در نتایج</h2><p>عنوان و توضیح اصلی سایت در موتورهای جست‌وجو</p></div><Icon name="search" size={22}/></div>
   <div className="settings-grid"><label className="wide">عنوان سئو<input maxLength={120} value={data.seoTitle||""} onChange={e=>set("seoTitle",e.target.value)}/></label>
   <label className="wide">توضیحات سئو<textarea maxLength={500} rows={3} value={data.seoDescription||""} onChange={e=>set("seoDescription",e.target.value)}/></label></div>
  </section>
  <section className="surface-card settings-card"><div className="card-heading"><div><h2>سکشن‌های صفحه اصلی</h2><p>محتوای هر سکشن و ترتیب نمایش برای قالب انتخاب‌شده</p></div><Icon name="images" size={22}/></div>
   <div className="section-list">{data.homeSections.map((x,i)=><div className="settings-section" key={x.id}><div className="section-toolbar"><strong>سکشن {i+1}</strong><button className="icon-button danger-icon" type="button" onClick={()=>removeSection(i)} aria-label="حذف سکشن"><Icon name="trash-2" size={18}/></button></div>
    <div className="settings-grid"><label>عنوان<input value={x.title} onChange={e=>editSection(i,"title",e.target.value)}/></label><label>ترتیب<input type="number" min={0} max={200} value={x.position} onChange={e=>editSection(i,"position",Number(e.target.value))}/></label>
      <label className="wide">توضیحات<textarea rows={2} value={x.description} onChange={e=>editSection(i,"description",e.target.value)}/></label>
      <label className="wide">آدرس تصویر<input dir="ltr" value={x.imageUrl||""} onChange={e=>editSection(i,"imageUrl",e.target.value)}/></label>
      <label className="checkbox-label wide"><input type="checkbox" checked={x.enabled} onChange={e=>editSection(i,"enabled",e.target.checked)}/> نمایش در سایت</label></div></div>)}</div>
    <button className="button btn-outline" type="button" disabled={data.homeSections.length>=35} onClick={()=>set("homeSections",[...data.homeSections,{id:crypto.randomUUID(),title:"سکشن جدید",description:"",imageUrl:"",enabled:true,position:data.homeSections.length}])}>افزودن سکشن <Icon name="plus" size={17}/></button>
    <p className="field-help">قالب‌های ۱، ۲ و ۳ می‌توانند از همین داده‌ها استفاده کنند؛ شکل نمایش هرکدام در فرانت‌اند خود قالب تعیین می‌شود.</p>
  </section>
  <section className="surface-card settings-card"><div className="card-heading"><div><h2>اطلاعات سفارش</h2><p>اعلان سفارش‌های جدید، ویژه فروشگاه</p></div><Icon name="shopping-bag" size={22}/></div><div className="settings-grid"><label className="wide">ایمیل دریافت اعلان سفارش<input dir="ltr" type="email" value={data.orderNoticeEmail||""} onChange={e=>set("orderNoticeEmail",e.target.value)}/></label></div>
   <p className="note-box">ارسال خودکار ایمیل پس از اتصال سرویس ارسال ایمیل فعال می‌شود.</p>
  </section>
  <div className="settings-save">{error&&<div className="error-box" role="alert">{error}</div>}{success&&<div className="success-box" role="status"><Icon name="check" size={16}/> تغییرات ذخیره شدند.</div>}
   <button type="submit" className="button btn-primary" disabled={saving}>{saving?"در حال ذخیره...":"ذخیره تمام تنظیمات"}<Icon name="check" size={18}/></button></div>
 </form></div>;
}
