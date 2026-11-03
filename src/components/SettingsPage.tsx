"use client";
import {adminFetch} from "@/lib/demo-api";
import {useEffect,useState,type FormEvent} from "react";
import {Icon} from "@/components/Icon";
type FlagScene={title:string;description:string;imageUrl?:string|null;tag?:string};type FlagHotspot={x:number;y:number;productId:string;label?:string};
type Section={id:string;title:string;description:string;imageUrl?:string|null;mobileImageUrl?:string|null;secondaryImageUrl?:string|null;ctaLabel?:string;ctaHref?:string;layout?:"split"|"overlap"|"full";animation?:"mask"|"fade"|"slide";role?:"hero"|"story"|"scene"|"campaign"|"standard";theme?:"dark"|"light";scenes?:FlagScene[];hotspots?:FlagHotspot[];enabled:boolean;position:number};
type Settings={siteType:"STORE"|"CORPORATE";themeId:"design-1"|"design-2"|"design-3"|"custom";storeName:string;description:string;logoUrl?:string|null;contactEmail?:string|null;contactPhone?:string|null;address?:string|null;instagram?:string|null;orderNoticeEmail?:string|null;seoTitle?:string|null;seoDescription?:string|null;homeSections:Section[]};
export function SettingsPage(){
 const [data,setData]=useState<Settings|null>(null),[saving,setSaving]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState(false);
 const [catalog,setCatalog]=useState<Array<{id:string;name:string}>>([]);
 useEffect(()=>{fetch("/api/store/bootstrap").then(r=>r.ok?r.json():null).then(d=>{if(d?.products)setCatalog(d.products.map((p:{id:string;name:string})=>({id:p.id,name:p.name}))) }).catch(()=>{})},[]);
 useEffect(()=>{adminFetch("/api/admin/settings").then(r=>r.json()).then(r=>setData(r.settings||null)).catch(()=>setError("تنظیمات بارگذاری نشد"))},[]);
 function set<K extends keyof Settings>(key:K,value:Settings[K]){setData(d=>d?({...d,[key]:value}):d);setSuccess(false)}
 async function save(e:FormEvent){e.preventDefault();if(!data)return;setSaving(true);setError("");setSuccess(false);
  try{const resp=await adminFetch("/api/admin/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
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
      <label className="wide">آدرس تصویر اصلی<input dir="ltr" value={x.imageUrl||""} onChange={e=>editSection(i,"imageUrl",e.target.value)} placeholder="https://..."/></label>
      <div className="wide" style={{padding:"12px 14px",background:"var(--surface-muted,#f6f4f0)",borderRadius:10,margin:"8px 0 3px"}}><strong style={{fontSize:12}}>جزئیات ادیتوریال — ویژه طراحی ۲</strong><p style={{fontSize:11,margin:"5px 0 0",opacity:.75}}>تصویر دوم، تصویر موبایل، چیدمان و حرکت اختیاری هستند. خالی‌بودن آن‌ها اطلاعات دمو را حفظ می‌کند.</p></div>
      <label>تصویر ویژه موبایل<input dir="ltr" type="url" value={x.mobileImageUrl||""} onChange={e=>editSection(i,"mobileImageUrl",e.target.value)} placeholder="https://..."/></label>
      <label>تصویر لایه دوم<input dir="ltr" type="url" value={x.secondaryImageUrl||""} onChange={e=>editSection(i,"secondaryImageUrl",e.target.value)} placeholder="https://..."/></label>
      <label>عنوان دکمه<input maxLength={60} value={x.ctaLabel||""} onChange={e=>editSection(i,"ctaLabel",e.target.value)} placeholder="کشف کالکشن"/></label>
      <label>لینک دکمه<input dir="ltr" maxLength={240} value={x.ctaHref||""} onChange={e=>editSection(i,"ctaHref",e.target.value)} placeholder="/products"/></label>
      <label>چیدمان تصویر و متن<select value={x.layout||"split"} onChange={e=>editSection(i,"layout",e.target.value as Section["layout"])}><option value="split">دو ستون مجله‌ای</option><option value="overlap">تصاویر لایه‌ای</option><option value="full">تصویر تمام‌عرض</option></select></label>
      <label>نوع انیمیشن<select value={x.animation||"mask"} onChange={e=>editSection(i,"animation",e.target.value as Section["animation"])}><option value="mask">آشکارشدن ماسکی</option><option value="fade">فید ملایم</option><option value="slide">ورود از کنار</option></select></label>
      <details className="wide" style={{padding:"14px 0",borderTop:"1px solid #e6e0d7",marginTop:12}}>
        <summary style={{cursor:"pointer",fontSize:13,fontWeight:700}}>تنظیمات تجربه فلگشیپ — ویژه طراحی ۳</summary>
        <p className="field-help">اختیاری؛ در قالب‌های ۱ و ۲ نادیده گرفته می‌شود. تصاویر و متن‌های دمو بدون تغییر باقی می‌مانند.</p>
        <div className="settings-grid">
         <label>نقش سکشن
          <select value={x.role||"standard"} onChange={e=>editSection(i,"role",e.target.value)}>
           <option value="standard">محتوای معمولی</option><option value="hero">هیروی اصلی</option>
           <option value="story">روایت اسکرول‌محور</option><option value="scene">تصویر با نقاط خرید</option>
           <option value="campaign">کمپین پایانی</option>
          </select>
         </label>
         <label>پس‌زمینه سکشن
          <select value={x.theme||"dark"} onChange={e=>editSection(i,"theme",e.target.value)}>
           <option value="dark">تیره</option><option value="light">روشن</option>
          </select>
         </label>
         {x.role==="story"&&<div className="wide" style={{display:"grid",gap:13}}>
           <strong>صحنه‌های داستان (۲ تا ۵ صحنه)</strong>
           {(x.scenes||[]).map((scene,j)=><div key={j} className="settings-section" style={{padding:15}}>
             <div className="section-toolbar"><strong>صحنه {j+1}</strong><button type="button" className="icon-button danger-icon" aria-label="حذف صحنه" onClick={()=>editSection(i,"scenes",(x.scenes||[]).filter((_,k)=>k!==j))}><Icon name="trash-2" size={16}/></button></div>
             <div className="settings-grid">
              <label>عنوان<input maxLength={140} value={scene.title} onChange={e=>editSection(i,"scenes",(x.scenes||[]).map((v,k)=>k===j?{...v,title:e.target.value}:v))}/></label>
              <label>کد فصل<input maxLength={70} value={scene.tag||""} onChange={e=>editSection(i,"scenes",(x.scenes||[]).map((v,k)=>k===j?{...v,tag:e.target.value}:v))}/></label>
              <label className="wide">توضیحات<textarea maxLength={500} rows={2} value={scene.description} onChange={e=>editSection(i,"scenes",(x.scenes||[]).map((v,k)=>k===j?{...v,description:e.target.value}:v))}/></label>
              <label className="wide">لینک تصویر HTTPS<input type="url" dir="ltr" value={scene.imageUrl||""} onChange={e=>editSection(i,"scenes",(x.scenes||[]).map((v,k)=>k===j?{...v,imageUrl:e.target.value}:v))} placeholder="https://..."/></label>
             </div>
           </div>)}
           <button type="button" className="button btn-outline" disabled={(x.scenes||[]).length>=5} onClick={()=>editSection(i,"scenes",[...(x.scenes||[]),{title:"فصل جدید",description:"",imageUrl:"",tag:"THE STORY"}])}>افزودن صحنه <Icon name="plus" size={16}/></button>
         </div>}
         {x.role==="scene"&&<div className="wide" style={{display:"grid",gap:13}}>
           <strong>محصولات قابل خرید روی تصویر</strong>
           <p className="field-help">مکان هر نقطه به درصد از عرض (X) و ارتفاع (Y) تصویر تعیین می‌شود. محصول حتماً باید در کاتالوگ فعال باشد.</p>
           {(x.hotspots||[]).map((h,j)=><div key={j} className="settings-section" style={{padding:15}}>
             <div className="section-toolbar"><strong>نقطه {j+1}</strong><button className="icon-button danger-icon" type="button" aria-label="حذف نقطه" onClick={()=>editSection(i,"hotspots",(x.hotspots||[]).filter((_,k)=>k!==j))}><Icon name="trash-2" size={16}/></button></div>
             <div className="settings-grid">
              <label className="wide">محصول
               {catalog.length?<select value={h.productId} onChange={e=>editSection(i,"hotspots",(x.hotspots||[]).map((v,k)=>k===j?{...v,productId:e.target.value}:v))}><option value="">انتخاب محصول</option>{catalog.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>:<input value={h.productId} onChange={e=>editSection(i,"hotspots",(x.hotspots||[]).map((v,k)=>k===j?{...v,productId:e.target.value}:v))} placeholder="شناسه محصول"/>}
              </label>
              <label>موقعیت افقی X (%)<input type="number" min="0" max="100" value={h.x} onChange={e=>editSection(i,"hotspots",(x.hotspots||[]).map((v,k)=>k===j?{...v,x:Number(e.target.value)}:v))}/></label>
              <label>موقعیت عمودی Y (%)<input type="number" min="0" max="100" value={h.y} onChange={e=>editSection(i,"hotspots",(x.hotspots||[]).map((v,k)=>k===j?{...v,y:Number(e.target.value)}:v))}/></label>
             </div>
           </div>)}
           <button className="button btn-outline" type="button" disabled={(x.hotspots||[]).length>=8 || !catalog.length} onClick={()=>editSection(i,"hotspots",[...(x.hotspots||[]),{x:50,y:50,productId:catalog[0]?.id||""}])}>افزودن نقطه خرید <Icon name="plus" size={16}/></button>
         </div>}
        </div>
       </details>
      <label className="checkbox-label wide"><input type="checkbox" checked={x.enabled} onChange={e=>editSection(i,"enabled",e.target.checked)}/> نمایش در سایت</label></div></div>)}</div>
    <button className="button btn-outline" type="button" disabled={data.homeSections.length>=35} onClick={()=>set("homeSections",[...data.homeSections,{id:crypto.randomUUID(),title:"سکشن جدید",description:"",imageUrl:"",enabled:true,position:data.homeSections.length}])}>افزودن سکشن <Icon name="plus" size={17}/></button>
    <button className="button btn-outline" type="button" disabled={data.homeSections.length>31} onClick={()=>set("homeSections",[...data.homeSections,...([
       {role:"hero",title:"فراتر از\\nیک انتخاب.",description:"کمپین منتخب برند",position:0},
       {role:"story",title:"داستان کالکشن",description:"روایت برند",position:1},
       {role:"scene",title:"خرید از تصویر",description:"نقاط قابل خرید",position:2},
       {role:"campaign",title:"کمپین پایانی",description:"روایت پایانی",position:3}
      ] as const).map((item,i)=>({id:crypto.randomUUID(),title:item.title,description:item.description,imageUrl:"",enabled:true,position:data.homeSections.length+i,role:item.role}))])}>افزودن چهار سکشن آماده طراحی ۳ <Icon name="plus" size={17}/></button>
    <p className="field-help">قالب‌های ۱، ۲ و ۳ می‌توانند از همین داده‌ها استفاده کنند؛ شکل نمایش هرکدام در فرانت‌اند خود قالب تعیین می‌شود.</p>
  </section>
  <section className="surface-card settings-card"><div className="card-heading"><div><h2>اطلاعات سفارش</h2><p>اعلان سفارش‌های جدید، ویژه فروشگاه</p></div><Icon name="shopping-bag" size={22}/></div><div className="settings-grid"><label className="wide">ایمیل دریافت اعلان سفارش<input dir="ltr" type="email" value={data.orderNoticeEmail||""} onChange={e=>set("orderNoticeEmail",e.target.value)}/></label></div>
   <p className="note-box">ارسال خودکار ایمیل پس از اتصال سرویس ارسال ایمیل فعال می‌شود.</p>
  </section>
  <div className="settings-save">{error&&<div className="error-box" role="alert">{error}</div>}{success&&<div className="success-box" role="status"><Icon name="check" size={16}/> تغییرات ذخیره شدند.</div>}
   <button type="submit" className="button btn-primary" disabled={saving}>{saving?"در حال ذخیره...":"ذخیره تمام تنظیمات"}<Icon name="check" size={18}/></button></div>
 </form></div>;
}
