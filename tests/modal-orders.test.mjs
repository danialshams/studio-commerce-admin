import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(path,"utf8");

test("editor and delete confirmation are portaled above transformed page container",()=>{
 const component=read("src/components/ModuleManager.tsx");
 const layer=read("src/components/ModalPortal.tsx");
 const css=read("src/app/globals.css");
 assert.match(component,/import \{ModalPortal\}/);
 assert.equal((component.match(/<ModalPortal\b/g)||[]).length,2);
 assert.equal((component.match(/<\/ModalPortal>/g)||[]).length,2);
 assert.match(component,/variant="drawer"/);
 assert.match(component,/variant="confirm"/);
 assert.doesNotMatch(component,/<div className="modal-backdrop" onMouseDown/);
 assert.match(layer,/createPortal\(/);
 assert.match(layer,/,document\.body\)/);
 assert.match(layer,/document\.body\.style\.overflow="hidden"/);
 assert.match(layer,/event\.key==="Escape"/);
 assert.match(layer,/event\.key!=="Tab"/);
 assert.match(layer,/active\?\.focus\(/);
 assert.match(css,/\.modal-backdrop\{[\s\S]*?z-index:2000!important/);
 assert.match(css,/\.modal-backdrop--drawer\{justify-content:flex-start!important/);
 assert.match(css,/\.modal-backdrop--confirm\{justify-content:center!important/);
 assert.match(css,/@media\(max-width:600px\)\{[\s\S]*?\.modal-backdrop \.editor-panel/);
});
test("orders expose customer, purchase-time item snapshots and meaningful detail fields",()=>{
 const component=read("src/components/ModuleManager.tsx");
 const list=read("src/app/api/admin/[resource]/route.ts");
 const detail=read("src/app/api/admin/[resource]/[id]/route.ts");
 const schema=read("prisma/schema.prisma");
 const demo=read("src/lib/demo-api.ts");
 for(const phrase of ["اطلاعات خریدار","محصولات سفارش","تحویل و ارسال","جزئیات پرداخت","مبلغ نهایی سفارش","selectedOptions","variantLabel","customerEmail"])
  assert.ok(component.includes(phrase),"Order details missing: "+phrase);
 assert.match(component,/section==="orders"\)\|\|!fields.length\?"details":"edit"/);
 assert.match(list,/items:\{include:\{product:/);
 assert.match(list,/customer:\{select:/);
 assert.match(detail,/items:\{include:\{product:/);
 assert.match(schema,/customerEmail String\?/);
 assert.match(schema,/variantLabel String\?/);
 assert.match(schema,/selectedOptions Json/);
 assert.match(demo,/shippingAddress:\{recipientName:/);
 assert.match(demo,/selectedOptions:\{سایز:/);
});
