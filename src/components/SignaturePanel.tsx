'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
type Contract={id:string;title:string;number:string;status:string};
type Signature={id:string;contract_title:string;signer_name:string;signer_email:string;status:string;signing_url?:string;created_at:string};
const states:Record<string,string>={draft:'پیش‌نویس',pending:'در انتظار امضا',signed:'تأییدشده',declined:'ردشده',expired:'منقضی‌شده',cancelled:'لغوشده'};
async function api(url:string,method='GET',body?:unknown){
 const r=await fetch(url,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const data=await r.json();if(!r.ok)throw new Error(data.error||'درخواست ناموفق بود');return data;
}
export default function SignaturePanel(){
 const [contracts,setContracts]=useState<Contract[]>([]),[requests,setRequests]=useState<Signature[]>([]);
 const [configured,setConfigured]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[message,setMessage]=useState('');
 const reload=useCallback(async()=>{
  try{const [c,s]=await Promise.all([api('/api/data/contracts'),api('/api/signatures')]);
    setContracts(c.items||[]);setRequests(s.items||[]);setConfigured(Boolean(s.providerConfigured));
  }catch(e){setError(e instanceof Error?e.message:'دریافت اطلاعات ناموفق بود')}
 },[]);
 useEffect(()=>{void reload()},[reload]);
 async function create(e:FormEvent<HTMLFormElement>){
  e.preventDefault();const form=e.currentTarget;
  const fields=Object.fromEntries(new FormData(form));setBusy(true);setError('');setMessage('');
  try{await api('/api/signatures','POST',fields);form.reset();setMessage('درخواست امضا به‌صورت پیش‌نویس ایجاد شد.');await reload()}
  catch(e){setError(e instanceof Error?e.message:'ایجاد درخواست ناموفق بود')}finally{setBusy(false)}
 }
 async function action(id:string,type:'send'|'cancel'){
  setBusy(true);setError('');setMessage('');
  try{await api('/api/signatures','PATCH',{id,action:type});
   setMessage(type==='send'?'درخواست امضا برای ارائه‌دهنده ارسال شد. وضعیت نهایی فقط با وب‌هوک معتبر ثبت می‌شود.':'درخواست لغو شد.');
   await reload();
  }catch(e){setError(e instanceof Error?e.message:'عملیات ناموفق بود')}finally{setBusy(false)}
 }
 return <div className="integration-grid">
 <section className="panel"><div className="panel-head"><div><h2>امضای دیجیتال قرارداد</h2><p>آماده‌سازی درخواست برای اتصال به سرویس امضای معتبر</p></div></div>
 <p className="info-note">وضعیت اتصال: {configured?'سرویس آماده است.':'هنوز سرویسی خریداری یا متصل نشده است.'} ثبت پیش‌نویس رایگان است؛ امضای رسمی فقط از طریق ارائه‌دهندهٔ معتبر انجام می‌شود.</p>
 <form className="form-stack" onSubmit={create}>
  <label>قرارداد<select name="contractId" required defaultValue=""><option value="">انتخاب قرارداد</option>{contracts.filter(c=>!['signed','cancelled','completed'].includes(c.status)).map(c=><option key={c.id} value={c.id}>{c.number} · {c.title}</option>)}</select></label>
  <label>نام امضاکننده<input name="signerName" maxLength={160} required/></label>
  <label>ایمیل امضاکننده<input type="email" name="signerEmail" dir="ltr" maxLength={255} required/></label>
  <button className="primary-btn fit" disabled={busy}>ایجاد درخواست امضا +</button>
 </form></section>
 <section className="panel"><div className="panel-head"><div><h2>درخواست‌های امضا</h2><p>تاریخچه و وضعیت قراردادها</p></div><button className="secondary-btn fit" onClick={()=>void reload()}>به‌روزرسانی</button></div>
 <div className="integration-list">{requests.length===0?<p className="info-note">هنوز درخواستی ثبت نشده است.</p>:requests.map(r=><article key={r.id} className="integration-item">
  <div className="integration-item-head"><strong>{r.contract_title}</strong><span className="status">{states[r.status]||r.status}</span></div>
  <p>{r.signer_name} · {r.signer_email}</p><small>{new Date(r.created_at).toLocaleString('fa-IR')}</small>
  {r.status==='draft'&&<div className="integration-actions"><button className="primary-btn fit" disabled={!configured||busy} onClick={()=>void action(r.id,'send')}>ارسال برای امضا</button><button className="secondary-btn fit" disabled={busy} onClick={()=>void action(r.id,'cancel')}>لغو</button></div>}
  {r.status==='pending'&&r.signing_url&&<a href={r.signing_url} target="_blank" rel="noopener noreferrer" className="secondary-btn fit">مشاهده لینک امضا</a>}
 </article>)}</div>
 </section>
 {(error||message)&&<p role="status" className={'banner '+(error?'error-banner':'success-banner')}>{error||message}</p>}
 </div>;
}
