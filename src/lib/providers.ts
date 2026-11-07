import nodemailer from 'nodemailer';

type OutboundMessage={id:string;channel:'sms'|'email';recipient:string;subject:string;body:string};
export function deliveryStatus(){
 return {
  email:Boolean(process.env.SMTP_HOST&&process.env.SMTP_FROM&&process.env.SMTP_USER&&process.env.SMTP_PASSWORD),
  sms:Boolean(process.env.SMS_GATEWAY_URL&&process.env.SMS_GATEWAY_API_KEY&&process.env.SMS_SENDER)
 };
}
export async function deliverMessage(item:OutboundMessage):Promise<string>{
 const status=deliveryStatus();
 if(item.channel==='email'){
  if(!status.email)throw new Error('email provider is not configured');
  const port=Number(process.env.SMTP_PORT||465);
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('SMTP_PORT invalid');
  const transporter=nodemailer.createTransport({
   host:process.env.SMTP_HOST,port,secure:port===465,requireTLS:true,
   auth:{user:process.env.SMTP_USER!,pass:process.env.SMTP_PASSWORD!},
   connectionTimeout:12000,greetingTimeout:12000,socketTimeout:12000
  });
  const info=await transporter.sendMail({
   from:process.env.SMTP_FROM!,to:item.recipient,subject:item.subject||'پیام از مجموعه',
   text:item.body,headers:{'X-Daira-Message-ID':item.id}
  });
  return String(info.messageId||item.id).slice(0,200);
 }
 if(item.channel==='sms'){
  if(!status.sms)throw new Error('SMS provider is not configured');
  const url=new URL(process.env.SMS_GATEWAY_URL!);
  if(url.protocol!=='https:')throw new Error('SMS gateway must use HTTPS');
  const res=await fetch(url,{method:'POST',headers:{
   'Content-Type':'application/json','Authorization':'Bearer '+process.env.SMS_GATEWAY_API_KEY!,
   'Idempotency-Key':item.id
  },body:JSON.stringify({to:item.recipient,from:process.env.SMS_SENDER,body:item.body,requestId:item.id}),
   cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!res.ok)throw new Error('SMS provider returned HTTP '+res.status);
  const json=await res.json().catch(()=>null) as {id?:unknown;messageId?:unknown}|null;
  return String(json?.messageId||json?.id||item.id).slice(0,200);
 }
 throw new Error('Unsupported channel');
}
