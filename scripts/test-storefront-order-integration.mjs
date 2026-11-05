import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {PrismaClient} from "@prisma/client";
import {createHash} from "node:crypto";

const secret="ci-only-ephemeral-order-key-not-for-production-2026";
const origin="http://127.0.0.1:3349";
const db=new PrismaClient();
let server;
let output="";

async function post(body,key=secret){
  const response=await fetch(origin+"/api/store/order",{
    method:"POST",
    headers:{"Content-Type":"application/json","x-storefront-key":key},
    body:JSON.stringify(body)
  });
  return {status:response.status,data:await response.json()};
}
async function ready(){
  for(let attempt=0;attempt<90;attempt++){
    if(server.exitCode!==null)throw Error("Next.js exited: "+output.slice(-1400));
    try{const response=await fetch(origin+"/api/store/bootstrap");if(response.ok)return;}catch{}
    await delay(350);
  }
  throw Error("Next.js test server was not ready: "+output.slice(-1400));
}

try{
  await db.storeSettings.upsert({where:{id:"main"},create:{id:"main",siteType:"STORE",storeName:"Test"},update:{siteType:"STORE"}});
  const category=await db.category.create({data:{name:"CI Collection",slug:"ci-collection"}});
  const p=await db.product.create({data:{
    name:"Checkout integration fixture",slug:"ci-checkout-fixture",status:"ACTIVE",
    price:200000,inventory:6,categoryId:category.id,
    variants:{create:[{label:"size M",inventory:3,price:180000,sku:"CI-M"}]}
  },include:{variants:true}});
  const variant=p.variants[0];
  await db.shippingMethod.create({data:{id:"ci-shipping",title:"Post",cost:40000,freeAbove:300000,enabled:true}});
  await db.coupon.create({data:{code:"CITEST10",type:"PERCENT",amount:10,minSubtotal:0,enabled:true}});
  server=spawn(process.execPath,["./node_modules/next/dist/bin/next","start","-p","3349"],{
    env:{...process.env,STORE_API_SECRET:secret,PORT:"3349",HOSTNAME:"127.0.0.1"},
    stdio:["ignore","pipe","pipe"]
  });
  server.stdout.on("data",chunk=>{output+=chunk.toString();});
  server.stderr.on("data",chunk=>{output+=chunk.toString();});
  await ready();
  const sample=phone=>({
    buyer:{name:"Test Buyer",phone,province:"Tehran",city:"Tehran",address:"Sample address"},
    items:[{productId:p.id,variantId:variant.id,quantity:1}],
    shippingId:"ci-shipping",coupon:"CITEST10"
  });

  const unauthorized=await post(sample("09120000000"),"");
  assert.equal(unauthorized.status,401,"invalid server key must be rejected");

  const invalid=sample("09120000001");
  invalid.items[0].productId="not-an-existing-product";
  const rejected=await post(invalid);
  assert.equal(rejected.status,409,"invalid catalog product must be rejected");
  assert.equal(await db.order.count(),0,"invalid request must not persist an order");

  const accepted=await post(sample("09120000000"));
  assert.equal(accepted.status,201,JSON.stringify(accepted.data));
  assert.equal(accepted.data.paymentEnabled,false);
  assert.equal(accepted.data.order.subtotal,180000);
  assert.equal(accepted.data.order.discount,18000);
  assert.equal(accepted.data.order.shipping,40000);
  assert.equal(accepted.data.order.total,202000);
  const order=await db.order.findUnique({
    where:{id:accepted.data.order.id},
    include:{items:true,customer:true,payments:true}
  });
  assert.ok(order);
  assert.equal(order.status,"PENDING");
  assert.equal(order.customer?.phone,"09120000000");
  assert.equal(order.items.length,1);
  assert.equal(order.items[0].unitPrice,180000);
  assert.equal(order.items[0].quantity,1);
  assert.equal(order.total,202000);
  assert.equal(order.payments.length,0);
  const existing=await db.productVariant.findUnique({where:{id:variant.id}});
  assert.equal(existing?.inventory,3,"unpaid order must not decrement inventory");

  const duplicate=await post(sample("09120000000"));
  assert.equal(duplicate.status,409,"double submission must be rejected");
  assert.equal(await db.order.count(),1);

  // This suite also exercises Edition 02 content persistence against real
  // Next.js routes and PostgreSQL. The published page must never leak drafts.
  const adminToken="ci-editor-ephemeral-session-2026";
  const administrator=await db.admin.create({
   data:{email:"ci-edition-two@example.test",passwordHash:"test-only-no-password-login"}
  });
  await db.session.create({data:{
   adminId:administrator.id,tokenHash:createHash("sha256").update(adminToken).digest("hex"),
   expiresAt:new Date(Date.now()+3600000)
  }});
  const editorHeaders={"Content-Type":"application/json",origin,
   cookie:"studio_admin_session="+adminToken};
  const cmsRequest=async(method,body,path="/api/admin/edition-2",headers=editorHeaders)=>{
   const response=await fetch(origin+path,{method,headers,
    body:body===undefined?undefined:JSON.stringify(body)});
   return {status:response.status,body:await response.json()};
  };
  const blocked=await cmsRequest("GET",undefined,"/api/admin/edition-2",{});
  assert.equal(blocked.status,401,"untrusted users must not read editorial drafts");

  const current=await cmsRequest("GET");
  assert.equal(current.status,200,JSON.stringify(current.body));
  assert.equal(current.body.draft.version,2);
  assert.ok(current.body.catalog.categories.find(x=>x.id===category.id));
  assert.ok(current.body.catalog.products.find(x=>x.id===p.id));
  const editing=structuredClone(current.body.draft);
  editing.hero[0].title="CI Published Hero Headline";
  editing.featured.productIds=[p.id];
  editing.categories.items=[{categoryId:category.id,imageUrl:""}];
  editing.footerColumns[0].links[0].label="CI Dynamic Footer Link";
  editing.footerColumns[0].links[0].target={kind:"product",id:p.id};

  const prePublish=await fetch(origin+"/api/store/bootstrap").then(x=>x.json());
  assert.equal(prePublish.settings?.editorialConfig??null,null,
   "public storefront must not expose a draft before publication");
  const drafted=await cmsRequest("PUT",editing);
  assert.equal(drafted.status,200,JSON.stringify(drafted.body));
  const privateState=await cmsRequest("GET");
  assert.equal(privateState.body.draft.hero[0].title,editing.hero[0].title);
  assert.equal(privateState.body.hasUnpublishedDraft,true);
  const stillPublic=await fetch(origin+"/api/store/bootstrap").then(x=>x.json());
  assert.equal(stillPublic.settings?.editorialConfig??null,null,
   "unpublished edits must stay private");
  const published=await cmsRequest("POST");
  assert.equal(published.status,200,JSON.stringify(published.body));
  const publicAfter=await fetch(origin+"/api/store/bootstrap").then(x=>x.json());
  assert.equal(publicAfter.settings.editorialConfig.hero[0].title,editing.hero[0].title);
  assert.equal(publicAfter.settings.editorialConfig.footerColumns[0].links[0].label,
   "CI Dynamic Footer Link");
  assert.equal(publicAfter.settings.editorialDraft,undefined,
   "public bootstrap must never expose editorial drafts");
  assert.equal((await cmsRequest("GET")).body.hasUnpublishedDraft,false);

  // A product deleted or unpublished after a CTA was selected must block
  // publication rather than produce a broken shop link.
  const bad=structuredClone(editing);
  bad.hero[0].target={kind:"product",id:"missing-product"};
  assert.equal((await cmsRequest("PUT",bad)).status,200);
  const rejectedPublish=await cmsRequest("POST");
  assert.equal(rejectedPublish.status,400,JSON.stringify(rejectedPublish.body));
  const safePublic=await fetch(origin+"/api/store/bootstrap").then(x=>x.json());
  assert.equal(safePublic.settings.editorialConfig.hero[0].title,editing.hero[0].title);
  assert.equal(safePublic.settings.editorialConfig.hero[0].target.kind,"products");
  console.log("PASS: Edition 02 content draft remains private, publishes atomically, resolves stable IDs, rejects broken destinations");
  console.log("PASS: valid checkout persists customer, order, item and verified amounts in isolated PostgreSQL");
  console.log("PASS: payment remains unverified, inventory unchanged, duplicate/invalid/unauthorized requests rejected");
}catch(error){
  console.error(error);
  console.error("Next.js server tail:",output.slice(-1700));
  process.exitCode=1;
}finally{
  if(server && server.exitCode===null)server.kill("SIGTERM");
  server?.stdout?.destroy();
  server?.stderr?.destroy();
  await db.$disconnect();
  await delay(150);
  process.exit(process.exitCode??0);
}
