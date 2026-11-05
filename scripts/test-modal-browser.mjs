// Real Chromium viewport regression. No Playwright dependency or real customer data.
// Requires Chrome/Chromium on the CI runner and NEXT_PUBLIC_STUDIO_DEMO=1.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {existsSync,mkdtempSync,readFileSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";

if(process.env.NEXT_PUBLIC_STUDIO_DEMO!=="1")throw Error("Browser regression is allowed only in isolated demo mode");
const port=39177;
const appURL=`http://localhost:${port}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(check,label,timeout=45000){
 const start=Date.now();
 while(Date.now()-start<timeout){
  try{const result=await check();if(result)return result}catch{}
  await sleep(220);
 }
 throw Error("Timed out waiting for "+label);
}
let server,chrome,client;
const profile=mkdtempSync(join(tmpdir(),"studio-dialog-chrome-"));
let serverLog="";
try{
 server=spawn("npm",["run","dev","--","-p",String(port)],{
  cwd:process.cwd(),env:{...process.env,NEXT_PUBLIC_STUDIO_DEMO:"1"},
  detached:true,stdio:["ignore","pipe","pipe"]});
 for(const stream of [server.stdout,server.stderr]){
  stream.setEncoding("utf8");stream.on("data",x=>serverLog=(serverLog+x).slice(-12000));
 }
 await waitFor(async()=>{
  if(server.exitCode!==null)throw Error("Next dev exited: "+serverLog);
  const res=await fetch(appURL+"/admin/products",{signal:AbortSignal.timeout(6000)});
  return res.status===200;
 },"Next.js demo development server",85000);

 const candidates=[process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/google-chrome-stable",
   "/usr/bin/chromium","/usr/bin/chromium-browser"].filter(Boolean);
 const bin=candidates.find(existsSync);
 if(!bin)throw Error("Chromium/Google Chrome unavailable on runner");
 chrome=spawn(bin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
   "--no-first-run","--no-default-browser-check","--disable-extensions",
   "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
 const debugFile=join(profile,"DevToolsActivePort");
 await waitFor(()=>existsSync(debugFile),"Chromium DevTools port",20000);
 const debugPort=Number(readFileSync(debugFile,"utf8").split("\n")[0]);
 const target=await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:"PUT"}).then(r=>r.json());
 const ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  ws.addEventListener("open",resolve,{once:true});
  ws.addEventListener("error",reject,{once:true});
 });
 const pending=new Map();let id=0;
 ws.addEventListener("message",event=>{
  const msg=JSON.parse(String(event.data));
  if(!msg.id||!pending.has(msg.id))return;
  const p=pending.get(msg.id);pending.delete(msg.id);clearTimeout(p.timer);
  if(msg.error)p.reject(Error(JSON.stringify(msg.error)));
  else p.resolve(msg.result||{});
 });
 client={
  send(method,params={}){
   return new Promise((resolve,reject)=>{
    const k=++id,timer=setTimeout(()=>{pending.delete(k);reject(Error("CDP timeout: "+method))},25000);
    pending.set(k,{resolve,reject,timer});
    ws.send(JSON.stringify({id:k,method,params}));
   });
  },
  close(){ws.close()}
 };
 const send=(method,params)=>client.send(method,params);
 const evalJS=async expression=>{
  const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error("Browser error: "+(r.exceptionDetails.text||JSON.stringify(r.exceptionDetails)));
  return r.result?.value;
 };
 await send("Page.enable");
 await send("Runtime.enable");

 const cases=[
  {w:1440,h:900,name:"desktop"},
  {w:820,h:970,name:"tablet"},
  {w:390,h:844,name:"mobile"},
  {w:360,h:740,name:"small-mobile"}
 ];
 const outputDir=resolve(".artifacts/dialogs");
 mkdirSync(outputDir,{recursive:true});
 const summary=[];
 for(const view of cases){
  await send("Emulation.setDeviceMetricsOverride",{
   width:view.w,height:view.h,deviceScaleFactor:1,mobile:view.w<=600,
   screenWidth:view.w,screenHeight:view.h
  });
  await send("Emulation.setTouchEmulationEnabled",{enabled:view.w<=600,maxTouchPoints:1});
  await send("Page.navigate",{url:appURL+"/admin/products"});
  await waitFor(()=>evalJS('document.querySelector(".page-create")!==null && document.querySelectorAll(".data-table tbody tr").length>0'),view.name+" products UI");
  await evalJS('document.querySelector(".page-create").click();true');
  await waitFor(()=>evalJS('!!document.querySelector(".modal-backdrop .editor-panel")'),view.name+" product editor");
  await sleep(360);
  const layout=await evalJS(`(() => {
   const root=document.querySelector(".modal-backdrop");
   const panel=root?.querySelector(".editor-panel");
   const a=root?.getBoundingClientRect(),b=panel?.getBoundingClientRect();
   return {portal:root?.parentElement===document.body,viewportWidth:innerWidth,
    viewportHeight:innerHeight,root:{x:a?.x,y:a?.y,w:a?.width,h:a?.height},
    panel:{x:b?.x,y:b?.y,w:b?.width,h:b?.height,right:b?.right,bottom:b?.bottom},
    z:getComputedStyle(root).zIndex,
    scrollLocked:getComputedStyle(document.body).overflow==="hidden",
    formVisible:!!panel?.querySelector("form input")};
  })()`);
  assert.ok(layout.portal,view.name+": dialog must portal directly to document.body");
  assert.ok(layout.root.x<=1&&layout.root.y<=1,view.name+": overlay must start at viewport origin");
  assert.ok(Math.abs(layout.root.w-view.w)<4&&Math.abs(layout.root.h-view.h)<4,
    view.name+": backdrop must cover full viewport "+JSON.stringify(layout));
  assert.ok(layout.panel.x>=-2&&layout.panel.y>=-2&&layout.panel.right<=view.w+2&&layout.panel.bottom<=view.h+2,
    view.name+": product drawer must fit screen "+JSON.stringify(layout));
  assert.ok(Math.abs(layout.panel.right-view.w)<4,view.name+": drawer must be anchored to RIGHT edge");
  assert.ok(layout.scrollLocked&&layout.formVisible,view.name+": dialog must lock scroll and show form");
  if(view.w<=600)assert.ok(Math.abs(layout.panel.bottom-view.h)<4,view.name+": mobile sheet must reach bottom");
  if(view.name==="desktop"||view.name==="mobile"){
   const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
   writeFileSync(join(outputDir,view.name+"-product.png"),Buffer.from(shot.data,"base64"));
  }
  await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await waitFor(()=>evalJS('document.querySelector(".modal-backdrop")===null'),view.name+" Escape close");
  await evalJS('document.querySelector(".row-actions .danger-icon").click();true');
  await waitFor(()=>evalJS('!!document.querySelector(".modal-backdrop .confirm-card")'),view.name+" delete confirmation");
  await sleep(280);
  const confirm=await evalJS(`(() => {
   const r=document.querySelector(".modal-backdrop");
   const b=r?.querySelector(".confirm-card").getBoundingClientRect();
   return {parent:r?.parentElement===document.body,midX:(b.left+b.right)/2,midY:(b.top+b.bottom)/2,
    viewportWidth:innerWidth,viewportHeight:innerHeight,right:b.right,left:b.left};
  })()`);
  assert.ok(confirm.parent&&Math.abs(confirm.midX-view.w/2)<5,view.name+": confirm must be horizontally centered");
  assert.ok(Math.abs(confirm.midY-view.h/2)<12,view.name+": confirm must be vertically centered");
  assert.ok(confirm.left>=0&&confirm.right<=view.w,view.name+": confirmation must not clip");
  await evalJS('document.querySelector(".confirm-card button[data-dialog-initial-focus]").click();true');
  await waitFor(()=>evalJS('document.querySelector(".modal-backdrop")===null'),view.name+" close confirm");

  await send("Page.navigate",{url:appURL+"/admin/orders"});
  await waitFor(()=>evalJS('document.querySelectorAll(".data-table tbody tr").length>0 && !!document.querySelector(".row-actions button")'),view.name+" orders list");
  await evalJS('document.querySelector(".row-actions button").click();true');
  await waitFor(()=>evalJS('!!document.querySelector(".order-details")'),view.name+" order details");
  await sleep(350); // allow the entry animation to reach its final viewport position
  const order=await evalJS(`(() => {
   const root=document.querySelector(".modal-backdrop"),panel=root?.querySelector(".editor-panel");
   const r=panel?.getBoundingClientRect();
   return {portal:root?.parentElement===document.body,items:document.querySelectorAll(".order-item-card").length,
    fields:document.querySelectorAll(".order-info-field").length,
    priceRows:document.querySelectorAll(".order-amounts>div").length,
    payments:document.querySelectorAll(".order-payment-card").length,
    hasRawJSON:!!document.querySelector(".order-details pre"),
    hasBuyer:document.querySelector(".order-details")?.textContent.includes("اطلاعات خریدار"),
    panelRight:r?.right,panelBottom:r?.bottom,screenWidth:innerWidth,screenHeight:innerHeight};
  })()`);
  assert.ok(order.portal&&order.items>=2&&order.fields>=6&&order.priceRows===4&&order.payments>=1,
   view.name+": order panel must include buyer, every line item, delivery, payment and totals "+JSON.stringify(order));
  assert.ok(order.hasBuyer&&!order.hasRawJSON,view.name+": use structured, not JSON order information");
  assert.ok(order.panelRight<=view.w+2&&order.panelBottom<=view.h+2,view.name+": order drawer not clipped "+JSON.stringify(order));
  if(view.name==="desktop"||view.name==="mobile"){
   const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
   writeFileSync(join(outputDir,view.name+"-order.png"),Buffer.from(shot.data,"base64"));
  }
  // Edition 02 visual page builder: every homepage section is selectable,
  // responsive and links are chosen by entity, never typed as internal URLs.
  await send("Page.navigate",{url:appURL+"/admin/editorial"});
  await waitFor(()=>evalJS('!!document.querySelector(".ed2-preview-screen") && document.querySelectorAll(".ed2-preview-section").length>=9'),
   view.name+" editorial builder",22000);
  const editor=await evalJS(`(() => {
   const root=document.querySelector(".ed2-admin");
   const preview=document.querySelector(".ed2-preview-column");
   const settings=document.querySelector(".ed2-settings-column");
   return {count:document.querySelectorAll(".ed2-preview-section").length,
    width:document.documentElement.scrollWidth,screen:innerWidth,
    preview:preview.getBoundingClientRect().width,
    settings:settings.getBoundingClientRect().width,
    controls:document.querySelectorAll(".ed2-part-selector button").length,
    sidebar:getComputedStyle(document.querySelector(".ed2-sidebar")).position};
  })()`);
  assert.ok(editor.count>=9&&editor.controls>=9,view.name+": all nine homepage parts must be editable");
  assert.ok(editor.width<=view.w+5,view.name+": visual editor has horizontal overflow "+JSON.stringify(editor));
  assert.ok(editor.preview>220&&editor.settings>260,view.name+": editor preview and inspector are too narrow "+JSON.stringify(editor));
  await evalJS('document.querySelectorAll(".ed2-part-selector button")[1].click();true');
  await waitFor(()=>evalJS('document.querySelector(".ed2-inspector-title h2")?.textContent.includes("کالکشن")'),
    view.name+" category editor");
  await evalJS('document.querySelector(".ed2-part-selector button").click();true');
  await waitFor(()=>evalJS('document.querySelector(".ed2-inspector-title h2")?.textContent.includes("هیرو")'),
    view.name+" hero editor");
  await evalJS('Array.from(document.querySelectorAll(".ed2-target-kinds button")).find(x=>x.textContent==="محصول").click();true');
  await evalJS('document.querySelector(".ed2-target-search input")?.focus();true');
  await waitFor(()=>evalJS('!!document.querySelector(".ed2-target-results")'),view.name+" product destination list");
  await evalJS('document.querySelector(".ed2-target-results button").click();true');
  await waitFor(()=>evalJS('!!document.querySelector(".ed2-selected-target")'),view.name+" selected product destination");
  const resolved=await evalJS('document.querySelector(".ed2-link-preview")?.textContent');
  assert.ok(resolved.includes("/product/"),view.name+": internal link picker did not resolve selected product");
  await evalJS('document.querySelector(".ed2-media-trigger").click();true');
  await waitFor(()=>evalJS('!!document.querySelector(".modal-backdrop .ed2-media-modal")'),view.name+" image chooser");
  const library=await evalJS(`(() => {
   const p=document.querySelector(".ed2-media-modal"),r=p.getBoundingClientRect();
   return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,pictures:p.querySelectorAll(".ed2-media-grid img").length};
  })()`);
  assert.ok(library.pictures>4,view.name+": image library has no selectable editorial photos");
  assert.ok(library.left>=-2&&library.top>=-2&&library.right<=view.w+2&&library.bottom<=view.h+2,
    view.name+": media drawer clips outside screen "+JSON.stringify(library));
  await evalJS('document.querySelector(".ed2-media-grid button").click();true');
  await waitFor(()=>evalJS('document.querySelector(".modal-backdrop .ed2-media-modal")===null'),view.name+" media selected");
  if(view.name==="desktop"||view.name==="mobile"){
   const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
   writeFileSync(join(outputDir,view.name+"-editorial.png"),Buffer.from(shot.data,"base64"));
  }
  await evalJS('Array.from(document.querySelectorAll(".ed2-page-actions button")).find(x=>x.textContent.includes("ذخیره")).click();true');
  await waitFor(()=>evalJS('document.querySelector(".ed2-message.success")?.textContent.includes("پیش‌نویس")'),
    view.name+" save draft");
  await evalJS('Array.from(document.querySelectorAll(".ed2-page-actions button")).find(x=>x.textContent.includes("انتشار")).click();true');
  await waitFor(()=>evalJS('document.querySelector(".ed2-message.success")?.textContent.includes("انتشار")'),
    view.name+" publish draft");
  // Verify the remaining content and commerce routes don't overflow the
  // mobile viewport or require a second navigation shell.
  if(view.name==="desktop"||view.name==="mobile"){
   for(const route of ["/admin","/admin/media","/admin/settings",
    "/admin/articles","/admin/banners","/admin/categories","/admin/coupons",
    "/admin/shipping","/admin/reviews","/admin/customers","/admin/payments"]){
    await send("Page.navigate",{url:appURL+route});
    await waitFor(()=>evalJS('!!document.querySelector("main h1")'),view.name+" route "+route,22000);
    const width=await evalJS(`(() => ({
     page:document.documentElement.scrollWidth,
     viewport:window.innerWidth,
     hasMenu:!!document.querySelector(".ed2-sidebar"),
     content:document.querySelector("main")?.getBoundingClientRect().width
    }))()`);
    assert.ok(width.hasMenu&&width.content>250,view.name+": route missing layout "+route);
    assert.ok(width.page<=view.w+5,
     view.name+": route overflows viewport "+route+" "+JSON.stringify(width));
   }
   await send("Page.navigate",{url:appURL+"/admin/media"});
   await waitFor(()=>evalJS('document.querySelector(".ed2-library-grid")!==null'),view.name+" media library");
   const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
   writeFileSync(join(outputDir,view.name+"-library.png"),Buffer.from(shot.data,"base64"));
  }
  summary.push({view:view.name,modal:"correct",confirm:"centered",order:"complete",editorial:"interactive"});
 }
 console.log("STUDIO_VIEWPORT_MODAL_PASS="+JSON.stringify(summary));
}catch(error){
 console.error("STUDIO_VIEWPORT_MODAL_FAILED",error,serverLog.slice(-2500));
 process.exitCode=1;
}finally{
 client?.close();
 if(chrome&&!chrome.killed)chrome.kill("SIGTERM");
 if(server?.pid){try{process.kill(-server.pid,"SIGTERM")}catch{server.kill("SIGTERM")}}
 try{rmSync(profile,{recursive:true,force:true,maxRetries:6,retryDelay:300})}catch{ /* the CI runner cleans up Chrome profile after the process exits */ }
}
