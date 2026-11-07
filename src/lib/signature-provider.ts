type SignatureEnvelope={
 id:string; signerName:string; signerEmail:string;contractNumber:string;contractTitle:string;
 amount:string;terms:string;
};
export function signingConfigured(){
 return Boolean(process.env.SIGN_PROVIDER_URL&&process.env.SIGN_PROVIDER_API_KEY
  &&process.env.SIGN_WEBHOOK_SECRET&&process.env.SIGN_CALLBACK_URL);
}
export async function submitSignatureRequest(request:SignatureEnvelope){
 if(!signingConfigured())throw new Error('signature provider not configured');
 const url=new URL(process.env.SIGN_PROVIDER_URL!);
 const callback=new URL(process.env.SIGN_CALLBACK_URL!);
 if(url.protocol!=='https:'||callback.protocol!=='https:')throw new Error('Signature API and webhook must use HTTPS');
 const res=await fetch(url,{method:'POST',headers:{
  Authorization:'Bearer '+process.env.SIGN_PROVIDER_API_KEY!,
  'Content-Type':'application/json','Idempotency-Key':request.id
 },body:JSON.stringify({
  requestId:request.id,signer:{name:request.signerName,email:request.signerEmail},
  contract:{number:request.contractNumber,title:request.contractTitle,amount:request.amount,terms:request.terms},
  callbackUrl:callback.href
 }),signal:AbortSignal.timeout(15000),cache:'no-store'});
 if(!res.ok)throw new Error('Signature provider rejected request: HTTP '+res.status);
 const body=await res.json().catch(()=>null) as {providerRequestId?:unknown;signingUrl?:unknown}|null;
 if(typeof body?.providerRequestId!=='string'||!body.providerRequestId||body.providerRequestId.length>200
 ||typeof body?.signingUrl!=='string'||body.signingUrl.length>2048)throw new Error('Invalid signing provider response');
 const signingUrl=new URL(body.signingUrl);
 if(signingUrl.protocol!=='https:')throw new Error('Signing URL must use HTTPS');
 return {providerRequestId:body.providerRequestId,signingUrl:signingUrl.href};
}
