'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {Copy,ShieldCheck,UserPlus,RefreshCw,Trash2} from 'lucide-react';
type Person={id:string;name:string;email:string;role:string;is_active:boolean};
type Invite={id:string;email:string;role:string;expires_at:string};
const roles:[string,string][]=[['admin','مدیر'],['sales','فروش'],['support','پشتیبانی'],['viewer','مشاهده‌گر']];
export default function TeamPanel({role}:{role:string}){
 const [members,setMembers]=useState<Person[]>([]),[invites,setInvites]=useState<Invite[]>([]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[link,setLink]=useState('');
 const reload=useCallback(async()=>{try{const r=await fetch('/api/team',{cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error);setMembers(j.members||[]);setInvites(j.invites||[])}catch(e){setError(e instanceof Error?e.message:'بارگذاری ناموفق بود')}},[]);
 useEffect(()=>{void reload()},[reload]);
 async function update(path:string,method:string,body:unknown){setBusy(true);setError('');setMessage('');try{
  const r=await fetch(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(j.error);
  if(j.inviteUrl){setLink(j.inviteUrl);setMessage('لینک دعوت ساخته شد و تا ۷۲ ساعت اعتبار دارد.')}else setMessage('تغییرات ذخیره شد.');
  await reload();return true;
 }catch(e){setError(e instanceof Error?e.message:'خطا در ذخیره');return false}finally{setBusy(false)}}
 async function invite(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget;
  const fields=Object.fromEntries(new FormData(form));if(await update('/api/team','POST',fields))form.reset();}
 return <div className="teams-layout">{role!=='demo'&&<section className="panel settings-panel"><div className="panel-head"><div><h2>دعوت اعضای تیم</h2><p>یک لینک امن و یک‌بارمصرف برای عضو جدید بسازید.</p></div><UserPlus size={21}/></div>
 <form className="form-stack" onSubmit={invite}><label>ایمیل عضو<input name="email" type="email" dir="ltr" required placeholder="user@example.com"/></label>
 <label>نقش<select name="role" defaultValue="sales">{roles.filter(([id])=>id!=='admin'||role==='owner').map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label>
 <button disabled={busy} className="primary-btn fit">ساخت لینک دعوت +</button></form>
 {link&&<div className="invite-link"><p>لینک را فقط برای شخص موردنظر ارسال کنید:</p><input readOnly dir="ltr" value={link} aria-label="لینک دعوت"/><button className="secondary-btn fit" onClick={async()=>{await navigator.clipboard.writeText(link);setMessage('لینک کپی شد.')}}><Copy size={16}/> کپی لینک</button></div>}
 <p className="info-note">ارسال ایمیل خودکار هنوز فعال نیست؛ لینک دعوت را دستی ارسال کنید. با پذیرش دعوت، عضو به همین مجموعه اضافه می‌شود.</p></section>}
 <section className="panel settings-panel"><div className="panel-head"><div><h2>اعضای مجموعه</h2><p>نقش و وضعیت دسترسی کاربران</p></div><button className="icon-btn" title="به‌روزرسانی" onClick={reload}><RefreshCw size={18}/></button></div>
 <div className="team-list">{members.map(m=><div className="team-row" key={m.id}><div className="team-details"><strong>{m.name}</strong><small dir="ltr">{m.email}</small></div><div className="team-controls">{role==='demo'?<span className="status status-customer">{m.role==='demo'?'بازدیدکننده':roles.find(([id])=>id===m.role)?.[1]||'عضو تیم'}</span>:m.role==='owner'?<span className="status status-customer"><ShieldCheck size={14}/> مالک</span>:<><select aria-label={'نقش '+m.name} value={m.role} disabled={busy||(m.role==='admin'&&role!=='owner')} onChange={e=>void update('/api/team','PATCH',{id:m.id,role:e.target.value})}>{roles.map(([id,label])=><option key={id} value={id} disabled={id==='admin'&&role!=='owner'}>{label}</option>)}</select><button className="secondary-btn" disabled={busy||(m.role==='admin'&&role!=='owner')} onClick={()=>void update('/api/team','PATCH',{id:m.id,is_active:!m.is_active})}>{m.is_active?'غیرفعال‌کردن':'فعال‌کردن'}</button></>}</div></div>)}</div>
 {invites.length>0&&<><h3>دعوت‌های در انتظار</h3><div className="team-list">{invites.map(i=><div className="team-row" key={i.id}><div className="team-details"><strong dir="ltr">{i.email}</strong><small>انقضا: {new Date(i.expires_at).toLocaleDateString('fa-IR')}</small></div><button className="icon-btn" title="لغو دعوت" disabled={busy} onClick={()=>void update('/api/team','DELETE',{id:i.id})}><Trash2 size={17}/></button></div>)}</div></>}</section>
 {(error||message)&&<p className={error?'banner error-banner':'banner success-banner'} role="status">{error||message}</p>}</div>
}
