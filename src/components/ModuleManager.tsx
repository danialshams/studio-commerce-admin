"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {Icon} from "@/components/Icon";
import {LABELS,MONEY_FIELDS,modules,type Field} from "@/lib/config";
import {formatDate,formatMoney,formatValue,humanize,slugify,statusLabels} from "@/lib/ui";

type RecordItem=Record<string,unknown>&{id:string};
type ListResponse={items:RecordItem[];total:number;page:number;pages:number;error?:string};
const optionalNumbers=new Set(["comparePrice","usageLimit","freeAbove"]);
function initFields(fields:Field[],item?:RecordItem){const value:Record<string,unknown>={};
 for(const field of fields){const current=item?.[field.key];
   if(field.key==="variants")value.variants=Array.isArray(current)?current.map((v:Record<string,unknown>)=>({label:String(v.label||""),sku:String(v.sku||""),price:v.price==null?"":String(v.price),inventory:String(v.inventory??0)})):[];
   else if(field.key==="gallery")value.gallery=Array.isArray(current)?current.join("\n"):"";
   else if(field.type==="date")value[field.key]=current?String(current).slice(0,10):"";
   else if(field.type==="checkbox")value[field.key]=current??(field.key==="enabled"||field.key==="active");
   else if(field.type==="number")value[field.key]=current??"";
   else value[field.key]=current??(field.options?.[0]?.value??"");
 }return value;
}
function payload(fields:Field[],values:Record<string,unknown>){const result:Record<string,unknown>={};
 for(const field of fields){const v=values[field.key];
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
function OrderDetails({item}:{item:RecordItem}){
 const items=Array.isArray(item.items)?item.items as Record<string,unknown>[]:[];
 const payments=Array.isArray(item.payments)?item.payments as Record<string,unknown>[]:[];
 return <div className="order-details"><h3>اقلام سفارش</h3>
  {items.length?items.map((x,i)=><div className="order-detail-row" key={i}><div><strong>{String(x.title||"محصول")}</strong><small>{Number(x.quantity||0).toLocaleString("fa-IR")} عدد × {formatMoney(Number(x.unitPrice||0))}</small></div><strong>{formatMoney(Number(x.total||0))}</strong></div>):<p className="dim-text">این سفارش اقلام ثبت‌شده ندارد.</p>}
  <div className="order-total"><span>مبلغ نهایی</span><strong>{formatMoney(Number(item.total||0))}</strong></div>
  <h3>پرداخت‌ها</h3>{payments.map((p,i)=><div className="order-detail-row" key={i}><span>{String(p.provider)} — {humanize(p.status)}</span><strong>{formatMoney(Number(p.amount||0))}</strong></div>)}
  <h3>اطلاعات تحویل</h3><pre>{JSON.stringify(item.shippingAddress||{},null,2)}</pre>
 </div>;
}
function Editor({section,item,onClose,onSuccess,categories}:{section:string;item:RecordItem|null;onClose:()=>void;onSuccess:()=>void;categories:RecordItem[]}){
 const mod=modules[section],fields=mod.fields;
 const [values,setValues]=useState<Record<string,unknown>>(()=>initFields(fields,item||undefined));
 const [saving,setSaving]=useState(false),[uploading,setUploading]=useState<string|null>(null),[error,setError]=useState("");
 const [tab,setTab]=useState<"edit"|"details">(fields.length?"edit":"details");
 useEffect(()=>{function key(e:KeyboardEvent){if(e.key==="Escape")onClose();}window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[onClose]);
 async function save(e:FormEvent){e.preventDefault();setSaving(true);setError("");
  try{const body=section==="orders"||section==="reviews"||section==="leads"?payload(fields,values):payload(fields,values);
   const resp=await fetch("/api/admin/"+section+(item?"/"+item.id:""),{method:item?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const data=await resp.json();if(!resp.ok)throw Error(data.error||"ثبت ناموفق بود");onSuccess();}
  catch(e){setError(e instanceof Error?e.message:"خطایی رخ داد");}finally{setSaving(false);}}
 async function uploadImage(file:File,field:string){setUploading(field);setError("");
  try{const form=new FormData();form.append("file",file);const resp=await fetch("/api/admin/upload",{method:"POST",body:form});const result=await resp.json();
   if(!resp.ok)throw Error(result.error||"آپلود ناموفق بود");setValues(v=>({...v,[field]:field==="gallery"?(String(v.gallery||"")+(v.gallery?"\n":"")+result.url):result.url}));}
  catch(e){setError(e instanceof Error?e.message:"خطای آپلود");}finally{setUploading(null)}}
 function change(key:string,val:unknown){setValues(prev=>{const next={...prev,[key]:val};if(key==="name"||key==="title"){const hasSlug=fields.some(x=>x.key==="slug");
    if(hasSlug&&!item&&!prev.slug)next.slug=slugify(String(val));}return next;});}
 const readonly=!fields.length;
 return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="editor-panel" role="dialog" aria-modal="true" aria-labelledby="editor-title">
  <header className="editor-header"><div><span className="section-overline">{mod.title}</span><h2 id="editor-title">{item?`مشاهده و ویرایش ${mod.plural}`:`ایجاد ${mod.plural} جدید`}</h2></div><button className="icon-button" aria-label="بستن" onClick={onClose}><Icon name="x" size={21}/></button></header>
  {item&&(section==="orders"||section==="payments"||section==="reviews")&&<nav className="editor-tabs" aria-label="بخش‌های جزئیات"><button className={tab==="edit"?"active":""} onClick={()=>setTab("edit")}>مدیریت</button><button className={tab==="details"?"active":""} onClick={()=>setTab("details")}>جزئیات</button></nav>}
  {tab==="details"&&item?<div className="editor-body details-body">{section==="orders"&&<OrderDetails item={item}/>}<dl>{Object.entries(item).filter(([k])=>!["shippingAddress"].includes(k)).map(([key,val])=><div key={key}><dt>{LABELS[key]||key}</dt><dd>{Array.isArray(val)?`${val.length} مورد`:typeof val==="object"?JSON.stringify(val):MONEY_FIELDS.has(key)&&typeof val==="number"?formatMoney(val):humanize(val)}</dd></div>)}</dl>{section==="orders"&&<button className="button btn-outline" onClick={()=>window.print()}>چاپ جزئیات سفارش</button>}</div>:readonly?<div className="editor-body"><p className="note-box">این اطلاعات صرفاً جهت مشاهده هستند و از این پنل قابل تغییر نیستند.</p></div>:<form onSubmit={save} className="editor-form"><div className="editor-body"><div className="editor-grid">{fields.map(field=><div className={"field-group "+(["description","body","summary","notes","variants","gallery","seoDescription"].includes(field.key)?"wide":"")} key={field.key}>
     {field.type==="checkbox"?<label className="checkbox-label"><input type="checkbox" checked={Boolean(values[field.key])} onChange={e=>change(field.key,e.target.checked)}/><span>{field.label}</span></label>:<><label htmlFor={"field-"+field.key}>{field.label}{field.required&&<em> *</em>}</label>
      {field.key==="variants"?<VariantEditor value={(values.variants as VariantValue[])||[]} onChange={v=>change("variants",v)}/>
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
 </section></div>;
}
export function ModuleManager({section}:{section:string}){
 const mod=modules[section];
 const [data,setData]=useState<ListResponse|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [search,setSearch]=useState(""),[term,setTerm]=useState(""),[page,setPage]=useState(1),[editing,setEditing]=useState<RecordItem|null|"create">(null);
 const [deleting,setDeleting]=useState<RecordItem|null>(null),[busyDelete,setBusyDelete]=useState(false),[categories,setCategories]=useState<RecordItem[]>([]);
 const load=useCallback(async()=>{setLoading(true);setError("");try{const resp=await fetch(`/api/admin/${section}?page=${page}&limit=15&q=${encodeURIComponent(term)}`);
    const body=await resp.json();if(!resp.ok)throw Error(body.error||"خطای بارگذاری");setData(body);}
    catch(e){setError(e instanceof Error?e.message:"خطا در دریافت اطلاعات");}finally{setLoading(false)}},[section,page,term]);
 useEffect(()=>{void load()},[load]);
 useEffect(()=>{const t=setTimeout(()=>{setPage(1);setTerm(search)},300);return()=>clearTimeout(t)},[search]);
 useEffect(()=>{if(section==="products")fetch("/api/admin/categories?limit=250").then(r=>r.json()).then(d=>setCategories(d.items||[])).catch(()=>{})},[section]);
 useEffect(()=>{if(notice){const t=setTimeout(()=>setNotice(""),4500);return()=>clearTimeout(t)}},[notice]);
 async function remove(){if(!deleting)return;setBusyDelete(true);setError("");try{const res=await fetch(`/api/admin/${section}/${deleting.id}`,{method:"DELETE"});const body=await res.json();if(!res.ok)throw Error(body.error||"حذف ناموفق بود");
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
  {editing&&<Editor key={editing==="create"?"create":editing.id} section={section} item={editing==="create"?null:editing} categories={categories} onClose={()=>setEditing(null)} onSuccess={done}/>}
  {deleting&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setDeleting(null)}}><div role="alertdialog" aria-modal="true" aria-labelledby="delete-title" className="confirm-card"><span className="confirm-icon"><Icon name="alert" size={24}/></span><h2 id="delete-title">{section==="products"?"آرشیو محصول":"حذف این مورد"}</h2><p>{section==="products"?"محصول از فروشگاه پنهان می‌شود، ولی در پنل باقی می‌ماند و سوابق سفارش حفظ می‌شود.":"این عملیات قابل بازگشت نیست. مطمئن هستی؟"}</p><div className="confirm-actions"><button className="button btn-outline" onClick={()=>setDeleting(null)}>انصراف</button><button className="button btn-danger" disabled={busyDelete} onClick={remove}>{busyDelete?"در حال انجام...":section==="products"?"آرشیو محصول":"حذف مورد"}</button></div></div></div>}
 </div>;
}
