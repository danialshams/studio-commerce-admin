import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {PrismaClient} from "@prisma/client";

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
  const p=await db.product.create({data:{
    name:"Checkout integration fixture",slug:"ci-checkout-fixture",status:"ACTIVE",
    price:200000,inventory:6,
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
