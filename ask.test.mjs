import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("customer contact page keeps the short link public and validates its identity", async () => {
  const page = await readFile(new URL("./ask.html", import.meta.url), "utf8");
  assert.match(page, /Узнать цену · Каталог Анастасии/);
  assert.match(page, /\^\\d\{5,20\}\$/);
  assert.match(page, /\^\[1-9\]\\d\{0,15\}\$/);
  assert.match(page, /\^\[a-f0-9\]\{32\}\$/);
  assert.match(page, /telegram-product-contact/);
  assert.match(page, /publication/);
  assert.match(page, /if \(exact\) target\.searchParams\.set\("publication", publication\)/);
  assert.doesNotMatch(page, /SUPABASE_SECRET_KEY|service_role/);
  const build = await readFile(new URL("./scripts/build.mjs", import.meta.url), "utf8");
  assert.match(build, /'ask\.html'/);
});
