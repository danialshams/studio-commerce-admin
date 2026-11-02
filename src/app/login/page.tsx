"use client";
import {useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft,Eye,EyeOff,LockKeyhole,ShieldCheck,Store} from "lucide-react";
export default function Login(){
 const router=useRouter();const [email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [visible,setVisible]=useState(false),[error,setError]=useState(""),[loading,setLoading]=useState(false);
 async function submit(event:FormEvent){event.preventDefault();setLoading(true);setError("");
  try{const res=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    const data=await res.json();if(!res.ok)throw new Error(data.error||"ورود ناموفق بود");router.replace("/admin");router.refresh();}
  catch(e){setError(e instanceof Error?e.message:"خطایی رخ داد");}finally{setLoading(false);}}
 return <main className="login-screen"><section className="login-panel">
   <div className="login-logo"><span><Store size={24}/></span>استودیو</div>
   <div className="login-art"><span><ShieldCheck size={22}/></span><h1>مدیریت سایت، ساده‌تر از همیشه.</h1><p>تمام آنچه برای اداره فروشگاه یا سایت شرکتی نیاز داری؛ در یک فضای خلوت و یکپارچه.</p></div>
   <div className="login-card"><div className="login-intro"><span className="login-lock"><LockKeyhole size={22}/></span><h2>ورود مدیر سایت</h2><p>برای مدیریت سایت خودت وارد حساب مدیر شو.</p></div>
     <form onSubmit={submit}><label>ایمیل مدیر<input type="email" name="email" autoComplete="username" inputMode="email" dir="ltr" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" required/></label>
      <label>رمز عبور<div className="password-wrapper"><input type={visible?"text":"password"} autoComplete="current-password" dir="ltr" minLength={1} maxLength={256} value={password} onChange={e=>setPassword(e.target.value)} required/>
        <button type="button" className="icon-button password-toggle" aria-label={visible?"پنهان کردن رمز":"نمایش رمز"} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
      {error&&<div className="error-box" role="alert">{error}</div>}
      <button disabled={loading} className="primary-button login-submit" type="submit">{loading?"در حال بررسی...":"ورود به پنل"}<ArrowLeft size={17}/></button>
     </form><p className="login-foot">ورود تنها برای مدیر اصلی سایت فعال است.</p></div>
 </section></main>;
}
