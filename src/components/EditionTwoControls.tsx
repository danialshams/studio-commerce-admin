"use client";
import {useMemo,useState,type ChangeEvent} from "react";
import {Image as ImageIcon,Images,UploadCloud,Search,ArrowUpLeft,ExternalLink,Check,Link2,X} from "lucide-react";
import {ModalPortal} from "@/components/ModalPortal";
import {adminFetch} from "@/lib/demo-api";
import type {Destination,EdCatalog,EdEntity} from "@/lib/edition-two";
import {resolveTarget} from "@/lib/edition-two";

const kinds=[
 {value:"none",label:"بدون لینک"},{value:"home",label:"صفحه اصلی"},
 {value:"products",label:"همه محصولات"},{value:"category",label:"دسته‌بندی"},
 {value:"product",label:"محصول"},{value:"page",label:"صفحه سایت"},
 {value:"article",label:"مقاله ژورنال"},{value:"external",label:"آدرس خارجی"}
] as const;
function collection(kind:Destination["kind"],catalog:EdCatalog):EdEntity[]{
 if(kind==="product")return catalog.products;
 if(kind==="category")return catalog.categories;
 if(kind==="page")return catalog.pages;
 if(kind==="article")return catalog.articles;
 return [];
}
export function DestinationPicker({label="مقصد دکمه",value,onChange,catalog}:{label?:string;value:Destination;onChange:(v:Destination)=>void;catalog:EdCatalog}){
 const [query,setQuery]=useState("");
 const [opened,setOpened]=useState(false);
 const entities=collection(value.kind,catalog);
 const filtered=entities.filter(item=>(item.name+" "+item.slug).toLocaleLowerCase("fa").includes(query.toLocaleLowerCase("fa"))).slice(0,70);
 const selected=entities.find(item=>item.id===value.id||item.slug===value.id);
 const result=resolveTarget(value,catalog);
 const hasEntity=["category","product","article","page"].includes(value.kind);
 const invalid=value.kind==="external"&&!/^https:\/\/[^\s]+$/i.test(value.url||"");
 return <div className="ed2-field ed2-destination">
  <span className="ed2-field-label">{label}</span>
  <div className="ed2-target-kinds" role="group" aria-label="نوع مقصد">
   {kinds.map(item=><button key={item.value} type="button" className={value.kind===item.value?"selected":""}
    onClick={()=>{const kind=item.value;setQuery("");setOpened(false);onChange(kind==="external"?{kind,url:""}:hasEntity&&kind===value.kind?value:{kind});}}>
    {item.label}</button>)}
  </div>
  {hasEntity&&<div className="ed2-target-search"><div className="ed2-search-field">
   <Search size={17}/><input aria-label="جستجوی مقصد" placeholder="نام محصول یا صفحه را جستجو کنید" value={query}
    onFocus={()=>setOpened(true)} onChange={e=>{setQuery(e.target.value);setOpened(true)}}/>
  </div>
  {selected&&<div className="ed2-selected-target"><Check size={15}/><span>{selected.name}</span>
   <button type="button" onClick={()=>{onChange({kind:value.kind});setOpened(true)}} aria-label="پاک کردن انتخاب"><X size={16}/></button></div>}
  {opened&&<div className="ed2-target-results" role="listbox" aria-label="گزینه‌های مقصد">
   {filtered.length?filtered.map(item=><button key={item.id} role="option" aria-selected={value.id===item.id}
     type="button" onClick={()=>{onChange({kind:value.kind,id:item.id});setQuery("");setOpened(false)}}>
     {item.imageUrl?<img src={item.imageUrl} alt="" loading="lazy"/>:<span className="ed2-target-placeholder"><Link2 size={17}/></span>}
     <span>{item.name}<small>{item.slug}</small></span><ArrowUpLeft size={15}/></button>):<div className="ed2-empty-small">موردی پیدا نشد</div>}
  </div>}</div>}
  {value.kind==="external"&&<div className="ed2-field"><label htmlFor="ed2-external-url">آدرس سایت دیگر (HTTPS)</label>
    <input id="ed2-external-url" dir="ltr" type="url" placeholder="https://example.com" value={value.url||""} onChange={e=>onChange({...value,url:e.target.value})}/>
    {invalid&&<small className="ed2-error">آدرس امن و معتبر وارد کنید</small>}
  </div>}
  {value.kind!=="none"&&<p className="ed2-link-preview"><ExternalLink size={14}/> {selected?.name||(
   value.kind==="products"?"همه محصولات":value.kind==="home"?"صفحه اصلی":value.kind==="external"?"آدرس خارجی":"یک مقصد انتخاب کنید")}
   <span dir="ltr">{result}</span></p>}
 </div>;
}
const editorialPhotos=[
 "chapter-detail.webp","chapter-form.webp","hero-main.webp","hero-mobile.webp",
 "story-portrait.webp","story-detail.webp","campaign.webp",
 "category-clothing.webp","category-bags.webp","category-shoes.webp","category-accessories.webp",
 "journal-style.webp","journal-details.webp"
].map(name=>"https://essential-store-design-2.vercel.app/images/editorial/"+name);
export function getMediaOptions(catalog:EdCatalog,extras:string[]=[]){
 const images=[...editorialPhotos,...extras,...catalog.products.map(x=>x.imageUrl||""),
  ...catalog.categories.map(x=>x.imageUrl||""),...catalog.articles.map(x=>x.imageUrl||"")];
 return Array.from(new Set(images.filter(x=>x&&(/^(https:\/\/|\/images\/)/).test(x))));
}
export function MediaField({label,value,onChange,catalog,extras=[]}:{label:string;value:string;onChange:(value:string)=>void;catalog:EdCatalog;extras?:string[]}){
 const [open,setOpen]=useState(false),[search,setSearch]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const choices=useMemo(()=>getMediaOptions(catalog,[...extras,value]),[catalog,extras,value]);
 const filtered=choices.filter(url=>url.toLowerCase().includes(search.toLowerCase()));
 async function upload(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];event.target.value="";
  if(!file)return;
  setBusy(true);setError("");
  try{
   if(file.size>5*1024*1024)throw new Error("حجم تصویر حداکثر ۵ مگابایت است");
   const form=new FormData();form.append("file",file);
   const response=await adminFetch("/api/admin/upload",{method:"POST",body:form});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"آپلود تصویر ناموفق بود");
   onChange(String(result.url));setOpen(false);
  }catch(e){setError(e instanceof Error?e.message:"خطای آپلود تصویر")}
  finally{setBusy(false)}
 }
 return <div className="ed2-field ed2-media-control"><span className="ed2-field-label">{label}</span>
  <button type="button" className="ed2-media-trigger" onClick={()=>{setSearch("");setError("");setOpen(true)}}>
   {value?<img src={value} alt="تصویر انتخاب‌شده"/>:<span className="ed2-no-image"><ImageIcon size={25}/></span>}
   <span><strong>{value?"تغییر تصویر":"انتخاب تصویر"}</strong><small>از تصاویر موجود انتخاب کنید یا عکس جدید بارگذاری کنید</small></span>
   <Images size={19}/>
  </button>
  {open&&<ModalPortal onClose={()=>setOpen(false)} variant="drawer">
   <section className="ed2-media-modal" role="dialog" aria-modal="true" aria-labelledby="ed2-media-title">
    <div className="ed2-modal-head"><div><span>کتابخانه رسانه</span><h2 id="ed2-media-title">انتخاب تصویر</h2></div>
     <button type="button" className="ed2-icon-button" onClick={()=>setOpen(false)} aria-label="بستن"><X size={19}/></button></div>
    <div className="ed2-media-tools"><div className="ed2-search-field"><Search size={17}/><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجو در تصاویر..." aria-label="جستجوی تصویر"/></div>
     <label className="ed2-button ed2-button-dark ed2-upload-button">{busy?"در حال آپلود":"آپلود تصویر جدید"} <UploadCloud size={17}/><input type="file" hidden disabled={busy} accept="image/jpeg,image/png,image/webp" onChange={upload}/></label>
    </div>
    {error&&<div className="ed2-error" role="alert">{error}</div>}
    <div className="ed2-media-grid">{filtered.map(url=><button key={url} className={url===value?"current":""} type="button"
     onClick={()=>{onChange(url);setOpen(false)}} aria-label="انتخاب تصویر" aria-pressed={url===value}>
     <img src={url} alt="" loading="lazy"/>{url===value&&<span><Check size={18}/></span>}</button>)}</div>
    {!filtered.length&&<div className="ed2-empty-small">تصویری پیدا نشد</div>}
   </section>
  </ModalPortal>}
 </div>;
}
export function EntityChoices({label,items,selected,onChange,max=8}:{label:string;items:EdEntity[];selected:string[];onChange:(items:string[])=>void;max?:number}){
 const [query,setQuery]=useState("");
 const sorted=[...selected.map(id=>items.find(x=>x.id===id)).filter((x):x is EdEntity=>Boolean(x)),...items.filter(x=>!selected.includes(x.id))];
 const visible=sorted.filter(x=>x.name.toLocaleLowerCase("fa").includes(query.trim().toLocaleLowerCase("fa"))).slice(0,80);
 return <div className="ed2-field"><span className="ed2-field-label">{label}<small>{selected.length} از {max} مورد</small></span>
  <div className="ed2-search-field"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو و انتخاب..." aria-label={label}/></div>
  <div className="ed2-entity-list">{visible.map(item=><button key={item.id} type="button" className={selected.includes(item.id)?"selected":""}
   disabled={!selected.includes(item.id)&&selected.length>=max}
   onClick={()=>onChange(selected.includes(item.id)?selected.filter(x=>x!==item.id):[...selected,item.id])}>
   {item.imageUrl?<img src={item.imageUrl} alt="" loading="lazy"/>:<span className="ed2-target-placeholder"><ImageIcon size={16}/></span>}
   <span>{item.name}</span><span className="ed2-entity-check">{selected.includes(item.id)&&<Check size={15}/>}</span></button>)}
  </div>
 </div>;
}
