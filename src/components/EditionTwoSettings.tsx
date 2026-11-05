"use client";
import {useEffect,useState,type FormEvent} from "react";
import {Save,Check,Store,Search,Phone,ShieldCheck} from "lucide-react";
import {adminFetch,DEMO_MODE} from "@/lib/demo-api";
import {MediaField} from "@/components/EditionTwoControls";
import type {EdCatalog} from "@/lib/edition-two";
type Settings={siteType:"STORE"|"CORPORATE";themeId:string;storeName:string;description:string;
 logoUrl?:string|null;contactEmail?:string|null;contactPhone?:string|null;address?:string|null;
 instagram?:string|null;orderNoticeEmail?:string|null;seoTitle?:string|null;seoDescription?:string|null;
 homeSections:Array<Record<string,unknown>>};
const empty:EdCatalog={products:[],categories:[],articles:[],pages:[]};
function TextInput({label,value,change,large=false}:{label:string;value:string;change:(s:string)=>void;large?:boolean}){
 return <label className="ed2-field"><span className="ed2-field-label">{label}</span>
 {large?<textarea rows={3} value={value} onChange={e=>change(e.target.value)}/>:
 <input value={value} onChange={e=>change(e.target.value)}/>}</label>;
}
export function EditionTwoSettings(){
 const [state,setState]=useState<Settings|null>(null),[catalog,setCatalog]=useState<EdCatalog>(empty);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 useEffect(()=>{
  let active=true;
  Promise.all([adminFetch("/api/admin/settings").then(r=>r.json()),
   adminFetch("/api/admin/edition-2").then(r=>r.ok?r.json():null).catch(()=>null)])
   .then(([s,c])=>{if(!active)return;setState(s.settings||null);setCatalog(c?.catalog||empty)})
   .catch(e=>setError(e.message)).finally(()=>setLoading(false));
  return()=>{active=false};
 },[]);
 function update(key:keyof Settings,value:string){setState(old=>old?{...old,[key]:value}:old);setSuccess("")}
 async function save(event:FormEvent){
  event.preventDefault();if(!state||saving)return;
  setSaving(true);setError("");setSuccess("");
  try{
   const body={...state,themeId:"design-2",siteType:"STORE",homeSections:state.homeSections||[]};
   const resp=await adminFetch("/api/admin/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const data=await resp.json();if(!resp.ok)throw Error(data.error||"ذخیره ناموفق بود");
   setState(data.settings);setSuccess(DEMO_MODE?"تغییرات در نسخه آزمایشی ذخیره شد.":"تنظیمات فروشگاه ذخیره شد.");
   window.dispatchEvent(new Event("studio-settings-changed"));
  }catch(e){setError(e instanceof Error?e.message:"خطا در ذخیره")}
  finally{setSaving(false)}
 }
 if(loading)return <div className="ed2-editor-loading">در حال بارگذاری تنظیمات...</div>;
 if(!state)return <p className="ed2-error">{error||"اطلاعات دریافت نشد"}</p>;
 return <div className="ed2-settings-page"><div className="ed2-page-heading"><div><small>STORE SETTINGS / EDITION 02</small><h1>تنظیمات فروشگاه</h1>
  <p>اطلاعات برند، تماس و نمایش در گوگل؛ بدون تنظیمات فنی غیرضروری.</p></div></div>
  <form className="ed2-setting-form" onSubmit={save}>
   <div className="ed2-surface ed2-setting-group"><header><Store size={19}/><div><h2>هویت فروشگاه</h2><small>نام، لوگو و معرفی کوتاه</small></div></header>
    <MediaField label="لوگوی فروشگاه" value={state.logoUrl||""} onChange={x=>update("logoUrl",x)} catalog={catalog}/>
    <TextInput label="نام فروشگاه" value={state.storeName} change={x=>update("storeName",x)}/>
    <TextInput label="توضیح کوتاه فروشگاه" value={state.description} change={x=>update("description",x)} large/>
   </div>
   <div className="ed2-surface ed2-setting-group"><header><Phone size={19}/><div><h2>اطلاعات تماس</h2><small>نمایش در فوتر و صفحه ارتباط با ما</small></div></header>
    <TextInput label="شماره تماس" value={state.contactPhone||""} change={x=>update("contactPhone",x)}/>
    <TextInput label="ایمیل" value={state.contactEmail||""} change={x=>update("contactEmail",x)}/>
    <TextInput label="آدرس فروشگاه" value={state.address||""} change={x=>update("address",x)} large/>
    <TextInput label="آیدی یا لینک اینستاگرام" value={state.instagram||""} change={x=>update("instagram",x)}/>
    <TextInput label="ایمیل اطلاع‌رسانی سفارش‌ها" value={state.orderNoticeEmail||""} change={x=>update("orderNoticeEmail",x)}/>
   </div>
   <div className="ed2-surface ed2-setting-group"><header><Search size={19}/><div><h2>نمایش در گوگل (سئو)</h2><small>عنوان و توضیح پیش‌فرض صفحات فروشگاه</small></div></header>
    <TextInput label="عنوان سایت در جستجو" value={state.seoTitle||""} change={x=>update("seoTitle",x)}/>
    <TextInput label="توضیحات سایت در جستجو" value={state.seoDescription||""} change={x=>update("seoDescription",x)} large/>
    <p className="ed2-hint">عنوان و توضیح هر محصول و مقاله در صفحه مدیریت همان مورد ثبت می‌شود.</p>
   </div>
   {error&&<p className="ed2-message error" role="alert">{error}</p>}
   {success&&<p className="ed2-message success" role="status">{success}</p>}
   <button type="submit" className="ed2-button ed2-button-dark ed2-save-settings" disabled={saving}>{saving?"در حال ذخیره":"ذخیره تنظیمات"} <Save size={18}/></button>
  </form>
 </div>;
}
