'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
type Contact={id:string;name:string;email?:string;phone?:string;delivery_consent?:boolean};
type Outbox={id:string;channel:'sms'|'email';recipient:string;subject:string;body:string;status:string;created_at:string;last_error?:string};
const statuses:Record<string,string>={draft:'پیش‌نویس',queued:'در صف',processing:'در حال ارسال',sent:'ارسال‌شده',failed:'خطای ارسال',cancelled:'لغوشده'};
async function request(path:string,method='GET',body?:unknown){
 const r=await fetch(path,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const j=await r.json();if(!r.ok)throw new Error(j.error||'درخواست ناموفق بود');return j;
}
export default function CommunicationsPanel({readOnly=false}:{readOnly?:boolean}){
 const [contacts,setContacts]=useState<Contact[]>([]),[messages,setMessages]=useState<Outbox[]>([]);
 const [ready,setReady]=useState({email:false,sms:false}),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[message,setMessage]=useState('');
 const [channel,setChannel]=useState<'sms'|'email'>('sms'),[contactId,setContactId]=useState('');
 const reload=useCallback(async()=>{
  try{const [c,m]=await Promise.all([request('/api/data/contacts'),request('/api/communications')]);
   setContacts(c.items||[]);setMessages(m.items||[]);setReady(m.providers||{email:false,sms:false});
  }catch(e){setError(e instanceof Error?e.message:'دریافت اطلاعات ناموفق بود')}
 },[]);
 useEffect(()=>{void reload()},[reload]);
 const selected=contacts.find(c=>c.id===contactId);
 async function create(e:FormEvent<HTMLFormElement>){
  e.preventDefault();const form=e.currentTarget;
  setBusy(true);setError('');setMessage('');
  try{const data=Object.fromEntries(new FormData(form));
   await request('/api/communications','POST',{contactId,channel,subject:data.subject,body:data.body});
   form.reset();setMessage('پیش‌نویس پیام ذخیره شد. ارسال فقط با انتخاب دکمهٔ ارسال انجام می‌شود.');await reload();
  }catch(e){setError(e instanceof Error?e.message:'ثبت پیش‌نویس ناموفق بود')}finally{setBusy(false)}
 }
 async function action(id:string,type:'queue'|'cancel'){
  setBusy(true);setError('');setMessage('');
  try{const r=await request('/api/communications','PATCH',{id,action:type});
   setMessage(type==='cancel'?'پیام لغو شد.':r.delivery?.sent?'پیام ارسال شد.':'نتیجهٔ ارسال ثبت شد؛ وضعیت را بررسی کنید.');
   await reload();
  }catch(e){setError(e instanceof Error?e.message:'عملیات ناموفق بود')}finally{setBusy(false)}
 }
 return <div className="integration-grid">
  <section className="panel">
   <div className="panel-head"><div><h2>ارتباط با مشتریان</h2><p>ساخت پیش‌نویس ایمیل و پیامک؛ بدون ارسال ناخواسته</p></div></div>
   <div className="provider-status"><span>ایمیل: {ready.email?'آمادهٔ ارسال':'نیازمند تنظیم SMTP'}</span><span>پیامک: {ready.sms?'آمادهٔ ارسال':'نیازمند اتصال درگاه'}</span></div>
   {!readOnly&&<form className="form-stack" onSubmit={create}>
    <label>مخاطب<select value={contactId} onChange={e=>setContactId(e.target.value)} required><option value="">انتخاب مخاطب</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>کانال<select value={channel} onChange={e=>setChannel(e.target.value as 'sms'|'email')}><option value="sms">پیامک</option><option value="email">ایمیل</option></select></label>
    {selected&&<p className="info-note">گیرنده: {channel==='email'?selected.email||'ایمیل ندارد':selected.phone||'شماره ندارد'} · رضایت ارسال: {selected.delivery_consent?'ثبت‌شده':'ثبت نشده'}. رضایت ارسال از صفحهٔ مخاطبان قابل ویرایش است.</p>}
    {channel==='email'&&<label>عنوان ایمیل<input name="subject" maxLength={200} required/></label>}
    <label>متن پیام<textarea name="body" rows={5} maxLength={3000} required/></label>
    <button type="submit" className="primary-btn fit" disabled={busy||!contactId}>ذخیره پیش‌نویس +</button>
   </form>}
   <p className="info-note">{readOnly?'این‌ها نمونهٔ پیش‌نویس‌های پیام هستند؛ نمایش عمومی فقط خواندنی است.':'ارسال مستلزم رضایت مخاطب، اتصال سرویس و تأیید مجزای کاربر است. تا آن زمان هیچ هزینه‌ای ایجاد نمی‌شود.'}</p>
  </section>
  <section className="panel">
   <div className="panel-head"><div><h2>سوابق پیام‌ها</h2><p>وضعیت واقعی پیام‌ها و تلاش‌های ارسال</p></div><button className="secondary-btn fit" onClick={()=>void reload()}>به‌روزرسانی</button></div>
   <div className="integration-list">{messages.length===0?<p className="info-note">هنوز پیامی ثبت نشده است.</p>:messages.map(m=><article key={m.id} className="integration-item">
    <div className="integration-item-head"><strong>{m.channel==='sms'?'پیامک':'ایمیل'} · {m.recipient}</strong><span className="status">{statuses[m.status]||m.status}</span></div>
    {m.subject&&<b>{m.subject}</b>}
    <p>{m.body}</p><small>{new Date(m.created_at).toLocaleString('fa-IR')}</small>
    {m.last_error&&<p className="banner error-banner">{m.last_error}</p>}
    {readOnly?null:m.status==='draft'||m.status==='failed'?<div className="integration-actions"><button disabled={busy||!ready[m.channel]} className="primary-btn fit" onClick={()=>void action(m.id,'queue')}>تأیید و ارسال</button><button disabled={busy} className="secondary-btn fit" onClick={()=>void action(m.id,'cancel')}>لغو</button></div>:m.status==='queued'?<button disabled={busy} className="secondary-btn fit" onClick={()=>void action(m.id,'cancel')}>لغو ارسال</button>:null}
   </article>)}</div>
  </section>
  {(error||message)&&<p className={'banner '+(error?'error-banner':'success-banner')} role="status">{error||message}</p>}
 </div>;
}
