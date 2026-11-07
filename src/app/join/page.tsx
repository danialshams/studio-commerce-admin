'use client';
import {useState,type FormEvent} from 'react';
import {useSearchParams} from 'next/navigation';
import {Suspense} from 'react';
function JoinForm(){
 const params=useSearchParams();const token=params.get('token')||'';
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');
 const data=Object.fromEntries(new FormData(e.currentTarget));try{const response=await fetch('/api/auth/accept-invite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,token})});const json=await response.json();if(!response.ok)throw new Error(json.error||'ثبت‌نام ناموفق بود');window.location.assign('/dashboard')}catch(e){setError(e instanceof Error?e.message:'خطا')}finally{setBusy(false)}}
 return <main className="join-page" dir="rtl"><div className="auth-card"><span className="section-overline">DAIRA CRM</span><h1>پیوستن به تیم</h1><p>برای فعال‌سازی دعوت، مشخصات خود را وارد کنید.</p>{token?<form onSubmit={submit} className="form-stack"><label>نام و نام خانوادگی<input name="name" required minLength={2}/></label><label>رمز عبور جدید<input name="password" type="password" required minLength={10} autoComplete="new-password"/></label>{error&&<p className="form-error">{error}</p>}<button className="primary-btn" disabled={busy}>ورود به فضای کاری</button></form>:<p className="form-error">لینک دعوت نامعتبر است.</p>}</div></main>
}
export default function Join(){return <Suspense fallback={<main className="join-page">در حال بارگذاری...</main>}><JoinForm/></Suspense>}
