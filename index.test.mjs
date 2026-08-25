import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./index.html", import.meta.url), "utf8");

test("il deep link accetta soltanto product_ID", () => {
  assert.match(source, /\^product_\(\[1-9\]\[0-9\]\*\)\$/);
  assert.match(source, /tgWebAppStartParam/);
  assert.doesNotMatch(source, /searchParams\.get\(["']product["']\)/);
});

test("il prodotto diretto viene caricato prima e senza catalogo", () => {
  const requested = source.indexOf("const requested=requestedProductId()");
  const single = source.indexOf("await openSingleProduct(requested)", requested);
  const catalog = source.indexOf('api("?action=catalog&brand=On&limit=200")', requested);
  assert.ok(requested > 0 && single > requested && catalog > single);
  assert.match(source.slice(single, catalog), /return;/);
});

test("la modalita singola mostra galleria e taglie del solo modello", () => {
  assert.match(source, /product\.imageUrls/);
  assert.match(source, /root\.className="single-product"/);
  assert.match(source, /Доступные размеры только для выбранной модели/);
});
