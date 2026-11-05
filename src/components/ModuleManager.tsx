"use client";
import {adminFetch} from "@/lib/demo-api";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {Icon} from "@/components/Icon";
import {ModalPortal} from "@/components/ModalPortal";
import {DestinationPicker} from "@/components/EditionTwoControls";
import type {Destination,EdCatalog} from "@/lib/edition-two";
import {LABELS,MONEY_FIELDS,modules,type Field} from "@/lib/config";
import {formatDate,formatMoney,formatValue,humanize,slugify,statusLabels} from "@/lib/ui";

type RecordItem=Record<string,unknown>&{id:string};
type ListResponse={items:RecordItem[];total:number;page:number;pages:number;error?:string};
const optionalNumbers=new Set(["comparePrice","usageLimit","freeAbove"]);
function initFields(fields:Field[],item?:RecordItem){const value:Record<string,unknown>={};
 for(const field of fields){const current=item?.[field.key];
   if(field.key==="variants")value.variants=Array.isArray(current)?current.map((v:Record<string,unknown>)=>({label:String(v.label||""),sku:String(v.sku||""),price:v.price==null?"":String(v.price),inventory:String(v.inventory??0)})):[];
   else if(field.key==="gallery")value.gallery=Array.isArray(current)?current.join("\n"):"";
   else if(field.type==="destination")value[field.key]=current&&typeof current==="object"?current:{kind:"none"};
   else if(field.type==="date")value[field.key]=current?String(current).slice(0,10):"";
   else if(field.type==="checkbox")value[field.key]=current??(field.key==="enabled"||field.key==="active");
   else if(field.type==="number")value[field.key]=current??"";
   else value[field.key]=current??(field.options?.[0]?.value??"");
 }return value;
}
function payload(fields:Field[],values:Record<string,unknown>){const result:Record<string,unknown>={};
 for(const field of fields){const v=values[field.key];
  if(field.type==="destination"){result[field.key]=v&&typeof v==="object"?v:{kind:"none"};continue;}
  if(field.key==="gallery"){result.gallery=String(v||"").split("\n").map(x=>x.trim()).filter(Boolean);continue;}
  if(field.key==="variants"){
    result.variants=(Array.isArray(v)?v:[]).map((row:VariantValue)=>({label:row.label.trim(),sku:row.sku.trim()||null,price:row.price===""?null:Number(row.price),inventory:Number(row.inventory||0),attributes:{}}));continue;}
  if(field.type==="checkbox"){result[field.key]=Boolean(v);continue;}
  if(field.type==="number"){result[field.key]=v===""||v==null?(optionalNumbers.has(field.key)?null:0):Number(v);continue;}
  if(field.type==="date"){result[field.key]=v?new Date(String(v)+"T23:59:59").toISOString():null;continue;}
  if(field.key==="categoryId"||field.key==="sku"||field.key==="coverUrl"||field.key==="imageUrl"||field.key==="email"||field.key==="phone")result[field.key]=v?String(v).trim():null;
  else result[field.key]=String(v??"").trim();
 }return result;
}
const negative=new Set(["FAILED","REJECTED","CANCELLED","ARCHIVED"]);
function Status({value}:{value:unknown}){const s=typeof value==="boolean"?(value?"ACTIVE":"INACTIVE"):String(value||"");return <span className={"status-tag "+(negative.has(s)?"status-negative":s==="ACTIVE"||s==="PUBLISHED"||s==="PAID"||s==="APPROVED"||s==="DELIVERED"?"status-positive":"status-neutral")}>{humanize(s)}</span>}
function DataCell({name,value}:{name:string;value:unknown}){
 if(name==="status"||name==="enabled"||name==="active")return <Status value={value}/>;
 if(MONEY_FIELDS.has(name)&&typeof value==="number")return <strong className="num-cell">{formatMoney(value)}</strong>;
 if(name==="createdAt"||name==="updatedAt")return <span className="dim-text">{formatDate(value)}</span>;
 if(name==="number"&&typeof value==="number")return <span className="mono-cell">#{formatValue(value)}</span>;
 if(typeof value==="number")return <span className="num-cell">{formatValue(value)}</span>;
 return <span className="table-truncate" title={String(value??"")}>{humanize(value)}</span>;
}
type VariantValue={label:string;sku:string;price:string;inventory:string};
function VariantEditor({value,onChange}:{value:VariantValue[];onChange:(v:VariantValue[])=>void}){
 function change(i:number,key:keyof VariantValue,text:string){const next=value.map((v,j)=>j===i?{...v,[key]:text}:v);onChange(next)}
 return <div className="variant-editor">{value.map((row,i)=><div className="variant-item" key={i}>
   <div className="variant-index"><strong>تنوع {i+1}</strong><button type="button" aria-label="حذف تنوع" onClick={()=>onChange(value.filter((_,j)=>j!==i))} className="icon-button danger-icon"><Icon name="trash-2" size={17}/></button></div>
   <div className="variant-grid"><label>عنوان (مثل آبی / XL)<input required value={row.label} onChange={e=>change(i,"label",e.target.value)}/></label>
    <label>کد SKU<input dir="ltr" value={row.sku} onChange={e=>change(i,"sku",e.target.value)}/></label>
    <label>قیمت (تومان)<input type="number" min="0" value={row.price} onChange={e=>change(i,"price",e.target.value)}/></label>
    <label>موجودی<input type="number" min="0" value={row.inventory} onChange={e=>change(i,"inventory",e.target.value)}/></label></div>
 </div>)}
 <button className="button btn-outline" type="button" onClick={()=>onChange([...value,{label:"",sku:"",price:"",inventory:"0"}])}>افزودن تنوع <Icon name="plus" size={16}/></button>
 <small className="field-help">اگر محصول رنگ یا سایز متفاوت ندارد، این بخش را خالی بگذار.</small>
 </div>;
}
function record(value:unknown):Record<string,unknown>{
 return value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
}
function filled(value:unknown){return value===null||value===undefined||value===""?"ثبت نشده":String(value)}
function DisplayDetail({label,value,phone=false}:{label:string;value:unknown;phone?:boolean}){
 const present=value!==null&&value!==undefined&&String(value)!=="";
 return <div className="order-info-field"><dt>{label}</dt><dd>{phone&&present?<a dir="ltr" href={`tel:${String(value)}`}>{String(value)}</a>:filled(value)}</dd></div>;
}
const addressLabels:Record<string,string>={
 recipientName:"نام تحویل‌گیرنده",recipientPhone:"شماره تحویل‌گیرنده",
 fullName:"نام تحویل‌گیرنده",phone:"تلفن تحویل",
 province:"استان",state:"استان",city:"شهر",county:"شهرستان",
 street:"خیابان",address:"نشانی",addressLine1:"نشانی",addressLine2:"تکمیل نشانی",
 postalCode:"کد پستی",zip:"کد پستی",zipCode:"کد پستی",building:"ساختمان",
 plaque:"پلاک",unit:"واحد",floor:"طبقه",notes:"توضیحات تحویل"
};
function OrderDetails({item}:{item:RecordItem}){
 const lines=Array.isArray(item.items)?item.items as Record<string,unknown>[]:[];
 const payments=Array.isArray(item.payments)?item.payments as Record<string,unknown>[]:[];
 const customer=record(item.customer),address=record(item.shippingAddress);
 const entries=Object.entries(address).filter(([,v])=>v!==null&&v!==undefined&&String(v).trim()!=="");
 return <div className="order-details" dir="rtl">
  <div className="order-overview">
   <div><span className="section-overline">جزئیات کامل سفارش</span>
    <h3>سفارش #{formatValue(Number(item.number||0))}</h3>
    <p>ثبت در {formatDate(item.createdAt)}</p></div>
   <Status value={item.status}/>
  </div>
  <section className="order-detail-section" aria-labelledby="order-customer-title">
   <h3 id="order-customer-title"><Icon name="users" size={18}/> اطلاعات خریدار</h3>
   <dl className="order-info-grid">
    <DisplayDetail label="نام و نام خانوادگی" value={item.customerName||customer.fullName}/>
    <DisplayDetail label="شماره موبایل" value={item.customerPhone||customer.phone} phone/>
    <DisplayDetail label="ایمیل" value={item.customerEmail||customer.email}/>
    <DisplayDetail label="شناسه مشتری" value={item.customerId||customer.id}/>
   </dl>
  </section>
  <section className="order-detail-section" aria-labelledby="order-items-title">
   <h3 id="order-items-title"><Icon name="package" size={18}/> محصولات سفارش ({formatValue(lines.length)})</h3>
   {lines.length?lines.map((line,index)=>{
    const product=record(line.product),options=record(line.selectedOptions);
    const variant=line.variantLabel||line.variantName;
    const image=line.imageUrl||product.coverUrl;
    return <article className="order-item-card" key={String(line.id||index)}>
     <div className="order-item-top">
      <div className="order-item-image">{image?<img src={String(image)} alt={String(line.title||"تصویر محصول")}/>:<Icon name="package" size={23}/>}</div>
      <div className="order-item-name"><strong>{filled(line.title)}</strong>
       {Boolean(variant)&&<span>مدل / تنوع: {String(variant)}</span>}
       {Boolean(line.sku)&&<span>کد کالا: <b dir="ltr">{String(line.sku)}</b></span>}
       {Boolean(line.productId)&&<span>شناسه محصول: <b dir="ltr">{String(line.productId)}</b></span>}
      </div>
     </div>
     {Object.keys(options).length>0&&<dl className="order-item-options">{Object.entries(options).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{filled(v)}</dd></div>)}</dl>}
     <div className="order-item-prices">
      <span>تعداد: <strong>{formatValue(Number(line.quantity||0))}</strong></span>
      <span>قیمت واحد: <strong>{formatMoney(Number(line.unitPrice||0))}</strong></span>
      <span>جمع: <strong>{formatMoney(Number(line.total||0))}</strong></span>
     </div>
    </article>;
   }):<p className="order-empty-note">هنوز اقلامی برای این سفارش ثبت نشده است.</p>}
  </section>
  <section className="order-detail-section" aria-labelledby="order-address-title">
   <h3 id="order-address-title"><Icon name="truck" size={18}/> تحویل و ارسال</h3>
   <dl className="order-info-grid">
    <DisplayDetail label="روش ارسال" value={item.shippingMethod}/>
    <DisplayDetail label="کد رهگیری" value={item.trackingCode}/>
    {entries.map(([k,v])=><DisplayDetail key={k} label={addressLabels[k]||k} value={typeof v==="object"?JSON.stringify(v):v} phone={k==="recipientPhone"||k==="phone"}/>)}
   </dl>
   {!entries.length&&<p className="order-empty-note">نشانی تحویل برای این سفارش ثبت نشده است.</p>}
  </section>
  <section className="order-detail-section" aria-labelledby="order-payments-title">
   <h3 id="order-payments-title"><Icon name="credit-card" size={18}/> جزئیات پرداخت</h3>
   {payments.length?payments.map((p,index)=><div className="order-payment-card" key={String(p.id||index)}>
    <div><strong>{filled(p.provider)}</strong><Status value={p.status}/></div>
    <div className="order-payment-meta">
     <span>مبلغ: <b>{formatMoney(Number(p.amount||0))}</b></span>
     <span>شماره پیگیری: <b dir="ltr">{filled(p.reference)}</b></span>
     {Boolean(p.createdAt)&&<span>تاریخ: <b>{formatDate(p.createdAt)}</b></span>}
    </div>
   </div>):<p className="order-empty-note">تراکنشی ثبت نشده است.</p>}
   <dl className="order-amounts">
    <div><dt>جمع کالاها</dt><dd>{formatMoney(Number(item.subtotal||0))}</dd></div>
    <div><dt>تخفیف</dt><dd>{formatMoney(Number(item.discountTotal||0))}</dd></div>
    <div><dt>هزینه ارسال</dt><dd>{formatMoney(Number(item.shippingCost||0))}</dd></div>
    <div className="order-grand-total"><dt>مبلغ نهایی سفارش</dt><dd>{formatMoney(Number(item.total||0))}</dd></div>
   </dl>
  </section>
  {Boolean(item.note)&&<section className="order-detail-section"><h3>یادداشت سفارش</h3><p className="order-note">{String(item.note)}</p></section>}
 </div>;
}
function Editor({section,item,onClose,onSuccess,categories,edCatalog}:{section:string;item:RecordItem|null;onClose:()=>void;onSuccess:()=>void;categories:RecordItem[];edCatalog:EdCatalog}){
 const mod=modules[section],fields=mod.fields;
 const [values,setValues]=useState<Record<string,unknown>>(()=>initFields(fields,item||undefined));
 const [saving,setSaving]=useState(false),[uploading,setUploading]=useState<string|null>(null),[error,setError]=useState("");
 const [tab,setTab]=useState<"edit"|"details">((item&&section==="orders")||!fields.length?"details":"edit");
 async function save(e:FormEvent){e.preventDefault();setSaving(true);setError("");
  try{const body=section==="orders"||section==="reviews"||section==="leads"?payload(fields,values):payload(fields,values);
   const resp=await adminFetch("/api/admin/"+section+(item?"/"+item.id:""),{method:item?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const data=await resp.json();if(!resp.ok)throw Error(data.error||"ثبت ناموفق بود");onSuccess();}
  catch(e){setError(e instanceof Error?e.message:"خطایی رخ داد");}finally{setSaving(false);}}
 async function uploadImage(file:File,field:string){setUploading(field);setError("");
  try{const form=new FormData();form.append("file",file);const resp=await adminFetch("/api/admin/upload",{method:"POST",body:form});const result=await resp.json();
   if(!resp.ok)throw Error(result.error||"آپلود ناموفق بود");setValues(v=>({...v,[field]:field==="gallery"?(String(v.gallery||"")+(v.gallery?"\n":"")+result.url):result.url}));}
  catch(e){setError(e instanceof Error?e.message:"خطای آپلود");}finally{setUploading(null)}}
 function change(key:string,val:unknown){setValues(prev=>{const next={...prev,[key]:val};if(key==="name"||key==="title"){const hasSlug=fields.some(x=>x.key==="slug");
    if(hasSlug&&!item&&!prev.slug)next.slug=slugify(String(val));}return next;});}
 const readonly=!fields.length;
 return <ModalPortal onClose={onClose} variant="drawer"><section className="editor-panel" role="dialog" aria-modal="true" aria-labelledby="editor-title">
  <header className="editor-header"><div><span className="section-overline">{mod.title}</span><h2 id="editor-title">{item?`مشاهده و ویرایش ${mod.plural}`:`ایجاد ${mod.plural} جدید`}</h2></div><button className="icon-button" aria-label="بستن" data-dialog-initial-focus onClick={onClose}><Icon name="x" size={21}/></button></header>
  {item&&(section==="orders"||section==="reviews")&&<nav className="editor-tabs" aria-label="بخش‌های جزئیات"><button className={tab==="details"?"active":""} onClick={()=>setTab("details")}>{section==="orders"?"جزئیات سفارش":"جزئیات"}</button><button className={tab==="edit"?"active":""} onClick={()=>setTab("edit")}>{section==="orders"?"مدیریت وضعیت":"مدیریت"}</button></nav>}
  {tab==="details"&&item?<div className="editor-body details-body">{section==="orders"?<OrderDetails item={item}/>:<dl>{Object.entries(item).map(([key,val])=><div key={key}><dt>{LABELS[key]||key}</dt><dd>{Array.isArray(val)?`${val.length} مورد`:typeof val==="object"?JSON.stringify(val):MONEY_FIELDS.has(key)&&typeof val==="number"?formatMoney(val):humanize(val)}</dd></div>)}</dl>}</div>:readonly?<div className="editor-body"><p className="note-box">این اطلاعات صرفاً جهت مشاهده هستند و از این پنل قابل تغییر نیستند.</p></div>:<form onSubmit={save} className="editor-form"><div className="editor-body"><div className="editor-grid">{fields.map(field=><div className={"field-group "+(["description","body","summary","notes","variants","gallery","seoDescription"].includes(field.key)?"wide":"")} key={field.key}>
     {field.type==="checkbox"?<label className="checkbox-label"><input type="checkbox" checked={Boolean(values[field.key])} onChange={e=>change(field.key,e.target.checked)}/><span>{field.label}</span></label>:<><label htmlFor={"field-"+field.key}>{field.label}{field.required&&<em> *</em>}</label>
      {field.key==="variants"?<VariantEditor value={(values.variants as VariantValue[])||[]} onChange={v=>change("variants",v)}/>
      :field.type==="destination"?<DestinationPicker label="مقصد دکمه" value={(values[field.key] as Destination)||{kind:"none"}} onChange={dest=>change(field.key,dest)} catalog={edCatalog}/>
      :field.type==="textarea"?<textarea id={"field-"+field.key} value={String(values[field.key]??"")} rows={field.key==="body"?9:field.key==="description"?5:3} onChange={e=>change(field.key,e.target.value)} placeholder={field.help||""}/>
      :field.key==="categoryId"?<select id={"field-"+field.key} value={String(values[field.key]??"")} onChange={e=>change(field.key,e.target.value)}><option value="">بدون دسته‌بندی</option>{categories.map(c=><option key={c.id} value={c.id}>{String(c.name)}</option>)}</select>
      :field.type==="select"?<select id={"field-"+field.key} value={String(values[field.key] ?? field.options?.[0]?.value ?? "")} onChange={e=>change(field.key,e.target.value)}>{field.options?.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select>
      :<input id={"field-"+field.key} type={field.type==="number"?"number":field.type==="date"?"date":"text"} min={field.min} step={field.type==="number"?1:undefined} required={field.required} dir={field.key==="slug"||field.key==="sku"||field.type==="image"?"ltr":undefined} value={String(values[field.key]??"")} onChange={e=>change(field.key,e.target.value)} placeholder={field.key==="slug"?"example-product":field.type==="image"?"https://...":undefined}/>}
      {field.help&&field.key!=="variants"&&<small className="field-help">{field.help}</small>}
      {field.type==="image"&&<div className="image-field"><label className="upload-button">{uploading===field.key?"در حال آپلود...":"بارگذاری تصویر"}<input type="file" hidden accept="image/png,image/jpeg,image/webp" disabled={Boolean(uploading)} onChange={e=>{const f=e.target.files?.[0];if(f)void uploadImage(f,field.key);e.target.value=""}}/></label>{Boolean(values[field.key])&&<span className="image-url-notice">آدرس تصویر ثبت شده است</span>}</div>}
      {field.key==="gallery"&&<div className="image-field"><label className="upload-button">{uploading==="gallery"?"در حال آپلود...":"افزودن عکس به گالری"}<input type="file" hidden accept="image/png,image/jpeg,image/webp" disabled={Boolean(uploading)} onChange={e=>{const f=e.target.files?.[0];if(f)void uploadImage(f,"gallery");e.target.value=""}}/></label></div>}
      </>}
     </div>)}</div>{error&&<div role="alert" className="error-box">{error}</div>}
     {section==="products"&&<p className="note-box"><Icon name="check" size={16}/> حذف محصول به شکل آرشیو است؛ سوابق سفارش‌ها حفظ می‌شوند.</p>}
  </div><footer className="editor-footer"><button className="button btn-outline" type="button" onClick={onClose}>انصراف</button><button className="button btn-primary" type="submit" disabled={saving||Boolean(uploading)}>{saving?"در حال ذخیره...":item?"ذخیره تغییرات":"ایجاد و ذخیره"}<Icon name="check" size={17}/></button></footer></form>}
 </section></ModalPortal>;
}
export function ModuleManager({section}:{section:string}){
 const mod=modules[section];
 const [data,setData]=useState<ListResponse|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [search,setSearch]=useState(""),[term,setTerm]=useState(""),[page,setPage]=useState(1),[editing,setEditing]=useState<RecordItem|null|"create">(null);
 const [deleting,setDeleting]=useState<RecordItem|null>(null),[busyDelete,setBusyDelete]=useState(false),[categories,setCategories]=useState<RecordItem[]>([]);
 const [edCatalog,setEdCatalog]=useState<EdCatalog>({products:[],categories:[],articles:[],pages:[]});
 const load=useCallback(async()=>{setLoading(true);setError("");try{const resp=await adminFetch(`/api/admin/${section}?page=${page}&limit=15&q=${encodeURIComponent(term)}`);
    const body=await resp.json();if(!resp.ok)throw Error(body.error||"خطای بارگذاری");setData(body);}
    catch(e){setError(e instanceof Error?e.message:"خطا در دریافت اطلاعات");}finally{setLoading(false)}},[section,page,term]);
 useEffect(()=>{void load()},[load]);
 useEffect(()=>{const t=setTimeout(()=>{setPage(1);setTerm(search)},300);return()=>clearTimeout(t)},[search]);
 useEffect(()=>{if(section==="products")adminFetch("/api/admin/categories?limit=250").then(r=>r.json()).then(d=>setCategories(d.items||[])).catch(()=>{})},[section]);
 useEffect(()=>{if(section==="banners")adminFetch("/api/admin/edition-2").then(r=>r.json()).then(d=>setEdCatalog(d.catalog||{products:[],categories:[],articles:[],pages:[]})).catch(()=>{})},[section]);
 useEffect(()=>{if(notice){const t=setTimeout(()=>setNotice(""),4500);return()=>clearTimeout(t)}},[notice]);
 async function remove(){if(!deleting)return;setBusyDelete(true);setError("");try{const res=await adminFetch(`/api/admin/${section}/${deleting.id}`,{method:"DELETE"});const body=await res.json();if(!res.ok)throw Error(body.error||"حذف ناموفق بود");
   setDeleting(null);setNotice(section==="products"?"محصول آرشیو شد":"رکورد حذف شد");void load();}
  catch(e){setError(e instanceof Error?e.message:"خطا");}finally{setBusyDelete(false);}}
 const columns=mod.columns;
 const rows=data?.items||[];
 const canEdit=mod.fields.length>0;
 function done(){setEditing(null);setNotice("اطلاعات با موفقیت ذخیره شد");void load();}
 const pageTitle=mod.title;
 return <div className="page-anim"><div className="page-heading"><div><span className="section-overline">مدیریت سایت</span><h1>{pageTitle}</h1><p>{mod.description}</p></div>
   {!mod.readonly&&<button className="button btn-primary page-create" onClick={()=>setEditing("create")}>افزودن {mod.plural} <Icon name="plus" size={18}/></button>}</div>
  {notice&&<div className="success-box" role="status"><Icon name="check" size={18}/>{notice}</div>}
  {error&&<div className="error-box" role="alert">{error}<button onClick={()=>void load()}>تلاش مجدد</button></div>}
  <section className="surface-card data-panel"><div className="table-toolbar"><div className="search-wrap"><Icon name="search" size={18}/><input aria-label={`جست‌وجو در ${pageTitle}`} placeholder={`جست‌وجو در ${pageTitle}...`} value={search} onChange={e=>setSearch(e.target.value)}/></div>
    <div className="toolbar-count">{data?`${formatValue(data.total)} مورد`:"در حال بارگذاری"}</div>
  </div>
  <div className="table-scroll"><table className="data-table"><thead><tr>{columns.map(c=><th key={c}>{LABELS[c]||c}</th>)}<th className="actions-heading">عملیات</th></tr></thead>
    <tbody>{rows.map(item=><tr key={item.id}>{columns.map((col,i)=><td key={col} data-label={LABELS[col]||col}>{section==="products"&&col==="name"?<div className="product-name-cell"><span className="product-thumb">{item.coverUrl?<img src={String(item.coverUrl)} alt=""/>:<Icon name="package" size={19}/>}</span><strong>{String(item.name)}</strong></div>:<DataCell name={col} value={item[col]}/>}</td>)}
      <td className="row-actions"><button aria-label={`مشاهده ${mod.plural}`} title="مشاهده و ویرایش" onClick={()=>setEditing(item)} className="icon-button" disabled={!canEdit && !mod.readonly}><Icon name={mod.readonly?"eye":"edit"} size={18}/></button>
       {!mod.readonly&&<button aria-label={`حذف ${mod.plural}`} title={section==="products"?"آرشیو محصول":"حذف"} onClick={()=>setDeleting(item)} className="icon-button danger-icon"><Icon name="trash-2" size={18}/></button>}</td>
    </tr>)}</tbody></table></div>
  {loading&&!data&&<div className="table-loading"><Icon name="loader" size={22}/>در حال دریافت اطلاعات...</div>}
  {!loading&&!rows.length&&<div className="empty-state"><span className="empty-icon"><Icon name={mod.icon} size={27}/></span><h3>{term?"نتیجه‌ای پیدا نشد":`هنوز ${mod.plural} ثبت نشده است`}</h3><p>{term?"عبارت دیگری جست‌وجو کن.":"از دکمه افزودن بالا برای ثبت اولین مورد استفاده کن."}</p>{!mod.readonly&&!term&&<button className="button btn-primary" onClick={()=>setEditing("create")}>افزودن {mod.plural}<Icon name="plus" size={17}/></button>}</div>}
  <div className="table-pagination"><button className="button btn-outline small-btn" disabled={page<=1} onClick={()=>setPage(page-1)}>قبلی</button><span>صفحه {formatValue(page)} از {formatValue(Math.max(1,data?.pages||1))}</span><button className="button btn-outline small-btn" disabled={!data||page>=data.pages} onClick={()=>setPage(page+1)}>بعدی</button></div>
  </section>
  {editing&&<Editor key={editing==="create"?"create":editing.id} section={section} item={editing==="create"?null:editing} categories={categories} edCatalog={edCatalog} onClose={()=>setEditing(null)} onSuccess={done}/>}
  {deleting&&<ModalPortal onClose={()=>{if(!busyDelete)setDeleting(null)}} variant="confirm"><div role="alertdialog" aria-modal="true" aria-labelledby="delete-title" className="confirm-card" aria-describedby="delete-description"><span className="confirm-icon"><Icon name="alert" size={24}/></span><h2 id="delete-title">{section==="products"?"آرشیو محصول":"حذف این مورد"}</h2><p id="delete-description">{section==="products"?"محصول از فروشگاه پنهان می‌شود، ولی در پنل باقی می‌ماند و سوابق سفارش حفظ می‌شود.":"این عملیات قابل بازگشت نیست. مطمئن هستی؟"}</p><div className="confirm-actions"><button className="button btn-outline" data-dialog-initial-focus onClick={()=>setDeleting(null)}>انصراف</button><button className="button btn-danger" disabled={busyDelete} onClick={remove}>{busyDelete?"در حال انجام...":section==="products"?"آرشیو محصول":"حذف مورد"}</button></div></div></ModalPortal>}
 </div>;
}
