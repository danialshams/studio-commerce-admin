"use client";
import {adminFetch} from "@/lib/demo-api";
import {useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft,Eye,EyeOff,LockKeyhole,ShieldCheck,Store} from "lucide-react";
export default function Login(){
 const router=useRouter();const [email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [visible,setVisible]=useState(false),[error,setError]=useState(""),[loading,setLoading]=useState(false);
 async function submit(event:FormEvent){event.preventDefault();setLoading(true);setError("");
  try{const res=await adminFetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    const data=await res.json();if(!res.ok)throw new Error(data.error||"ورود ناموفق بود");router.replace("/admin");router.refresh();}
  catch(e){setError(e instanceof Error?e.message:"خطایی رخ داد");}finally{setLoading(false);}}
 return <main className="login-screen"><section className="login-panel">
   <div className="login-logo"><span>E<span className="ed2-brand-dot">.</span>02</span><div>ESSENTIAL <small>STUDIO</small></div></div>
   <div className="login-art"><span>EDITION / 02</span><h1>فروشگاهتان را با همان ظرافتی مدیریت کنید که طراحی شده است.</h1><p>از انتخاب تصاویر و مدیریت کالکشن‌ها تا سفارش‌ها و محصولات؛ همه‌چیز در یک فضای منظم.</p></div>
   <div className="login-card"><div className="login-intro"><span className="login-lock"><LockKeyhole size={22}/></span><h2>ورود به مدیریت</h2><p>برای مدیریت فروشگاه وارد حساب مدیر شوید.</p></div>
     <form onSubmit={submit}><label>ایمیل مدیر<input type="email" name="email" autoComplete="username" inputMode="email" dir="ltr" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" required/></label>
      <label>رمز عبور<div className="password-wrapper"><input type={visible?"text":"password"} autoComplete="current-password" dir="ltr" minLength={1} maxLength={256} value={password} onChange={e=>setPassword(e.target.value)} required/>
        <button type="button" className="icon-button password-toggle" aria-label={visible?"پنهان کردن رمز":"نمایش رمز"} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
      {error&&<div className="error-box" role="alert">{error}</div>}
      <button disabled={loading} className="primary-button login-submit" type="submit">{loading?"در حال بررسی...":"ورود به پنل"}<ArrowLeft size={17}/></button>
     </form><p className="login-foot">این بخش مخصوص مدیریت فروشگاه Edition 02 است.</p></div>
 </section></main>;
}
