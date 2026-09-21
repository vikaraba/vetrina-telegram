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
  const catalog = source.indexOf("await loadCatalog(false)", requested);
  assert.ok(requested > 0 && single > requested && catalog > single);
  assert.match(source.slice(single, catalog), /return;/);
});

test("la modalita singola mostra galleria e taglie del solo modello", () => {
  assert.match(source, /product\.imageUrls/);
  assert.match(source, /root\.className="single-product"/);
  assert.match(source, /Все официальные фотографии выбранной модели/);
  assert.match(source, /Найти другой товар/);
  assert.match(source, /\?action=catalog&limit=100/);
});

test("prezzo cliente fail-closed esclusivamente in rubli", () => {
  assert.match(source, /product\.priceAmount/);
  assert.match(source, /product\.priceCurrency/);
  assert.match(source, /currency!=="RUB"/);
  assert.match(source, /style:"currency",currency:"RUB"/);
  assert.match(source, /Цена уточняется/);
  assert.doesNotMatch(source, /Number\(product\.priceEur\)/);
  assert.doesNotMatch(source, />€ /);
});

test("tutte le taglie importate ON sono selezionabili e avviano una verifica reale", () => {
  assert.match(source, /size\.selectable===true/);
  assert.doesNotMatch(source, /size\.orderable/);
  assert.match(source, /\?action=size-interest/);
  assert.match(source, /\?action=size-status&checkId=/);
  assert.doesNotMatch(source, /\?action=request/);
});

test("il contatto Anastasia viene tracciato prima di aprire buyer_rome", () => {
  const tracked = source.indexOf('interactionName:"contact_anastasia_opened"');
  const opened = source.indexOf("https://t.me/buyer_rome?text=");
  assert.ok(tracked > 0 && opened > tracked);
  assert.match(source, /product\.reference\|\|product\.id/);
  assert.match(source, /Здравствуйте, Анастасия!/);
  assert.match(source, /Размер: /);
  assert.match(source, /Артикул: /);
  assert.match(source, /Написать Анастасии/);
});

test("catalogo multibrand e zoom professionale restano disponibili dal prodotto",()=>{
  assert.doesNotMatch(source,/brand=On/);
  assert.match(source,/activeBrand="Все"/);
  assert.match(source,/Бренд, модель или артикул/);
  assert.match(source,/data-zoom/);
  assert.match(source,/Щипок или двойное касание/);
  assert.match(source,/pointermove/);
  assert.match(source,/explore=1/);
});

test("i messaggi di stato sono professionali e contestuali alla misura", () => {
  assert.match(source, /Проверяем размер \"\+size\+\"/);
  assert.match(source, /Обычно это занимает несколько секунд/);
  assert.match(source, /Запрос сохранён\. Напишите Анастасии/);
  assert.doesNotMatch(source, /ON \"\+reference\+\" · размер/);
});

test("identificativi sessione ed evento hanno fallback UUID v4", () => {
  assert.match(source, /crypto\.getRandomValues/);
  assert.match(source, /bytes\[6\]=\(bytes\[6\]&15\)\|64/);
  assert.match(source, /bytes\[8\]=\(bytes\[8\]&63\)\|128/);
  assert.match(source, /const pageSessionId=randomUuid\(\)/);
  assert.match(source, /const eventId=randomUuid/);
});

test("ogni apertura esporta il contesto WebApp versionato senza storage locale", () => {
  assert.match(source, /telegram-webapp-client-v1/);
  assert.match(source, /x-telegram-client-context/);
  assert.match(source, /page_session_id/);
  assert.match(source, /telegram_web_app/);
  assert.match(source, /viewport_stable_height/);
  assert.match(source, /safe_area_inset/);
  assert.match(source, /client_reported/);
  assert.match(source, /"x-telegram-init-data":tg\?\.initData/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie/);
});
