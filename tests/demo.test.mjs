import {test} from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("public demo is isolated to a compile-time switch and client fixtures",()=>{
 const demo=read("src/lib/demo-api.ts"),layout=read("src/app/admin/layout.tsx");
 assert.match(demo,/NEXT_PUBLIC_STUDIO_DEMO === "1"/);
 assert.match(demo,/return globalThis.fetch\(input,init\)/);
 assert.match(layout,/if\(process\.env\.NEXT_PUBLIC_STUDIO_DEMO === "1"\)/);
 assert.match(demo,/records:/);
 assert.match(demo,/new Response/);
 assert.match(demo,/درگاه آزمایشی/);
 assert.match(demo,/آپلود در دمو غیرفعال/);
 for(const module of ["Dashboard","ModuleManager","SettingsPage","AdminShell"])
  assert.match(read("src/components/"+module+".tsx"),/adminFetch/);
 assert.doesNotMatch(read("src/lib/security.ts"),/DEMO_MODE|STUDIO_DEMO/);
 assert.doesNotMatch(read("src/app/api/admin/summary/route.ts"),/STUDIO_DEMO/);
});
