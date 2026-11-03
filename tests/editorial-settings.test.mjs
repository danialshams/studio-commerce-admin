import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
test("editorial settings expose optional mobile image, secondary photo and layout controls",()=>{
 const ui=load("src/components/SettingsPage.tsx"),route=load("src/app/api/admin/settings/route.ts");
 for(const key of ["mobileImageUrl","secondaryImageUrl","ctaLabel","ctaHref","layout","animation"]){
  assert.ok(ui.includes(key),`editor missing ${key}`);assert.ok(route.includes(key),`validator missing ${key}`);
 }
 assert.match(ui,/adminFetch\("\/api\/admin\/settings"/);
 assert.match(route,/Prisma\.InputJsonValue/);
 assert.match(route,/requireApiAdmin/);
});
