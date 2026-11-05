"use client";
import {useEffect,useMemo,useState,type ChangeEvent} from "react";
import {Images,Search,UploadCloud,Image as ImageIcon,ExternalLink} from "lucide-react";
import {adminFetch} from "@/lib/demo-api";
import {editionTwoDefaults,type EdCatalog,type EditionTwoConfig} from "@/lib/edition-two";
import {getMediaOptions} from "@/components/EditionTwoControls";
type Item={url:string;source:string};
const empty:EdCatalog={products:[],categories:[],articles:[],pages:[]};
export function EditionTwoMediaPage(){
 const [catalog,setCatalog]=useState<EdCatalog>(empty),[config,setConfig]=useState<EditionTwoConfig>(editionTwoDefaults);
 const [q,setQ]=useState(""),[tab,setTab]=useState("all"),[uploading,setUploading]=useState(false),[notice,setNotice]=useState("");
 const [added,setAdded]=useState<string[]>([]);
 useEffect(()=>{adminFetch("/api/admin/edition-2").then(r=>r.json()).then(d=>{if(d.catalog)setCatalog(d.catalog);
  if(d.draft)setConfig(d.draft)}).catch(()=>setNotice("کتابخانه تصاویر فعلاً در دسترس نیست"))},[]);
 const entries=useMemo(()=>{
  const sources=new Map<string,string>();
  const add=(url:string|undefined,source:string)=>{if(url&&!sources.has(url))sources.set(url,source)};
  config.hero.forEach(x=>{add(x.imageUrl,"home");add(x.mobileImageUrl,"home")});
  config.categories.items.forEach(x=>add(x.imageUrl,"home"));
  [config.campaign,config.story].forEach(x=>{add(x.imageUrl,"home");add(x.secondaryImageUrl,"home")});
  config.chapters.forEach(x=>{add(x.imageUrl,"home");add(x.mobileImageUrl,"home")});
  catalog.products.forEach(x=>add(x.imageUrl,"products"));
  catalog.categories.forEach(x=>add(x.imageUrl,"categories"));
  catalog.articles.forEach(x=>add(x.imageUrl,"articles"));
  added.forEach(x=>add(x,"uploaded"));
  getMediaOptions(catalog).forEach(x=>add(x,"templates"));
  return Array.from(sources,( [url,source]):Item=>({url,source}));
 },[catalog,config,added]);
 const shown=entries.filter(x=>(tab==="all"||tab===x.source)&&x.url.toLowerCase().includes(q.toLowerCase()));
 async function upload(e:ChangeEvent<HTMLInputElement>){
  const file=e.target.files?.[0];e.target.value="";if(!file)return;setUploading(true);setNotice("");
  try{const data=new FormData();data.append("file",file);
   const r=await adminFetch("/api/admin/upload",{method:"POST",body:data});const v=await r.json();
   if(!r.ok)throw Error(v.error||"آپلود ناموفق بود");
   setAdded(items=>[String(v.url),...items]);setNotice("تصویر بارگذاری شد و برای انتخاب در صفحه‌ساز در دسترس است.");
  }catch(e){setNotice(e instanceof Error?e.message:"خطا در آپلود")}
  finally{setUploading(false)}
 }
 return <div className="ed2-library-page"><div className="ed2-page-heading"><div><small>MEDIA LIBRARY / EDITION 02</small>
   <h1>کتابخانه تصاویر</h1><p>تصاویر استفاده‌شده در محصولات، کالکشن‌ها، مقالات و صفحه اصلی.</p></div>
   <label className="ed2-button ed2-button-dark ed2-upload-button">{uploading?"در حال آپلود":"بارگذاری تصویر"} <UploadCloud size={18}/>
    <input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={uploading} onChange={upload}/></label></div>
  {notice&&<div className="ed2-message" role="status">{notice}</div>}
  <div className="ed2-library-tools"><div className="ed2-search-field"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجوی تصاویر..." aria-label="جستجوی تصاویر"/></div>
   <div className="ed2-library-tabs" role="group" aria-label="دسته تصاویر">{[{v:"all",n:"همه"},
    {v:"home",n:"صفحه اصلی"},{v:"products",n:"محصولات"},{v:"categories",n:"کالکشن‌ها"},{v:"articles",n:"مقالات"},{v:"templates",n:"نمونه‌ها"}].map(x=>
     <button key={x.v} type="button" className={tab===x.v?"active":""} onClick={()=>setTab(x.v)}>{x.n}</button>)}</div></div>
  <div className="ed2-library-grid">{shown.map(x=><div key={x.url} className="ed2-library-image">
   <img src={x.url} alt="تصویر کتابخانه" loading="lazy"/><div><small>{x.source}</small>
    <a href={x.url} target="_blank" rel="noreferrer" aria-label="نمایش تصویر در اندازه کامل"><ExternalLink size={16}/></a></div>
   </div>)}</div>
  {!shown.length&&<div className="ed2-empty-library"><Images size={28}/><p>تصویری برای این فیلتر پیدا نشد.</p></div>}
  <p className="ed2-hint">برای تغییر تصویر هر قسمت، از صفحه‌ساز یا ویرایش محصول استفاده کنید. حذف فیزیکی فایل‌ها تا اتصال ذخیره‌سازی امن فعال نیست.</p>
 </div>;
}
