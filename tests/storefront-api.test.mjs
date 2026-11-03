import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("public catalog excludes private customer and coupon records",()=>{
 const code=src("../src/app/api/store/bootstrap/route.ts");
 assert.match(code,/db\.product\.findMany/);
 assert.match(code,/db\.banner\.findMany/);
 assert.doesNotMatch(code,/db\.customer\.findMany/);
 assert.doesNotMatch(code,/db\.coupon\.findMany/);
});
test("server order authenticates request and recalculates prices",()=>{
 const code=src("../src/app/api/store/order/route.ts");
 assert.match(code,/timingSafeEqual/);
 assert.match(code,/STOR[E]_API_SECRET/);
 assert.match(code,/unitPrice=variant\?\.price\?\?product.price/);
 assert.match(code,/status:"PENDING"/);
 assert.doesNotMatch(code,/status:"PAID"/);
});
