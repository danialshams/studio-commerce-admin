import {readFileSync,existsSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('all commerce models exist and prices are fixed integer tomans',()=>{
 const s=read('prisma/schema.prisma');for(const entity of ['Product','ProductVariant','InventoryMovement','Category','Customer','Order','OrderItem','Payment','Coupon','ShippingMethod','Page','Article','Banner','Review','Service','PortfolioProject','Lead','Admin','Session']) assert.match(s,new RegExp('model '+entity+' \\{'));
 assert.match(s,/price Int/);assert.match(s,/total Int/);assert.doesNotMatch(s,/currency\s+String/);
});
test('product lifecycle, stock journal, and owner auth are backed by route handlers',()=>{
 const post=read('src/app/api/admin/[resource]/route.ts');const patch=read('src/app/api/admin/[resource]/[id]/route.ts');
 for(const token of ['inventoryMovement','product.create','auditLog'])assert.ok(post.includes(token));
 for(const token of ['inventoryMovement','product.update','ARCHIVED','validateOrderChange','resource==="payments"'])assert.ok(patch.includes(token));
 assert.match(read('src/lib/security.ts'),/httpOnly:true/);assert.match(read('src/lib/security.ts'),/sameSite:"strict"/);
});
test('mobile/tablet breakpoints and large touch controls',()=>{
 const css=read('src/app/globals.css');for(const s of ['max-width:1100px','max-width:840px','max-width:600px','mobile-bottom-nav','modal-backdrop','min-height:44px'])assert.ok(css.includes(s));
});
test('no dangerous project secrets and no open self-registration',()=>{
 for(const p of ['.env.example','src/app/api/auth/login/route.ts','src/lib/security.ts']){
  const t=read(p);assert.doesNotMatch(t,/sk_live_|-----BEGIN PRIVATE KEY-----/);
 }
 assert.ok(!existsSync(new URL('../src/app/api/auth/register',import.meta.url)));
});
test('management sections have actual models and management forms',()=>{
 const schema=read('src/lib/config.ts');for(const name of ['products','orders','customers','categories','coupons','shipping','payments','reviews','pages','articles','banners','services','projects','leads'])assert.match(schema,new RegExp(name+':\\{'));
 const form=read('src/components/ModuleManager.tsx');for(const name of ['افزودن','DELETE','PATCH','POST','gallery','variants','uploadImage','categoryId'])assert.ok(form.includes(name));
});
