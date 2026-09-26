import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL(p,import.meta.url),'utf8');
const [app,html,css,api]=await Promise.all(['app.js','index.html','style.css','storefront-api.mjs'].map(read));
test('production entrypoint uses relative assets and Telegram SDK, no prototype transport',()=>{
  assert.match(html,/src="https:\/\/telegram.org\/js\/telegram-web-app.js"/);
  assert.match(html,/src="\.\/app.js/);assert.match(html,/href="\.\/style.css/);
  assert.doesNotMatch(html+app,/data.json|demo-result|Настройки демо|Прототип|simulated|scenario|prototype_/);
});
test('RUB only, non-positive or absent price remains unconfirmed',()=>{assert.match(app,/p.priceCurrency==='RUB'/);assert.match(app,/Цена уточняется/);assert.doesNotMatch(app,/priceEur/);});
test('release entry and order module share a cache version, preview remains isolated',async()=>{
  const version=html.match(/src="\.\/app\.js\?v=([a-zA-Z0-9-]+)"/)[1];
  assert.ok(app.includes("from './storefront-api.mjs?v="+version+"'"));
  assert.ok(app.includes("from './catalog-core.mjs?v="+version+"'"));
  assert.ok(html.includes('href="./style.css?v='+version+'"'));
  const preview=await read('scripts/preview.mjs');
  assert.ok(preview.includes("await import('/vetrina-telegram/app.js?v="+version+"')"));
  assert.ok(preview.includes('src="./app.js?v='+version+'"'));
});
test('top navigation, minimal copy, proportional product grid and roller stay intact',()=>{
  assert.match(app,/<nav class="detail-nav"/);assert.equal((app.match(/id="explore"/g)||[]).length,1);
  assert.match(app,/Вернуться в каталог/);assert.match(app,/Посмотреть другие модели/);
  assert.match(css,/\.detail-nav\{position:sticky;top:0/);
  assert.match(css,/\.product-grid\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(css,/\.card-image\{[^}]*100svh/);
  assert.match(html,/id="size-wheel"[^>]+role="listbox"/);assert.match(css,/scroll-snap-type:y mandatory/);
  assert.doesNotMatch(app+html,/Для вас, под заказ|Наличие и итоговую стоимость подтверждает Анастасия перед покупкой|Ваш персональный каталог|ПЕРСОНАЛЬНЫЙ ШОПИНГ/);
});
test('safe-area, dark palette, reduced motion and readable input rules',()=>{assert.match(css,/safe-area-inset-bottom/);assert.match(css,/min-height:44px/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/font-size:16px/);assert.match(app,/themeChanged/);});
test('identity never persisted by application; client context remains untrusted metadata',()=>{assert.doesNotMatch(app+api,/localStorage|sessionStorage|document.cookie/);assert.match(api,/client_reported/);assert.match(api,/x-telegram-init-data/);assert.match(api,/page_session_id/);});
test('gallery never truncates; back and browser history keep catalog context',()=>{assert.doesNotMatch(app,/images[^\n]*slice\(0/);assert.match(app,/restore:true/);assert.match(app,/popstate/);assert.match(app,/navigation!==state.navigation/);assert.match(app,/BackButton/);});
test('size check uses real service; future non-ON sizes remain manual, never fake available',()=>{assert.match(app,/sourceId==='on_running_it'\?client.checkSize/);assert.doesNotMatch(app,/setTimeout\(resolve,850\)/);assert.match(app,/Promise.resolve\('unknown'\)/);});
test('catalog fetch does not auto-open product details or fabricate all-size facets',()=>{assert.doesNotMatch(app,/select\('size','Размер'/);assert.match(app,/p=await client.product\(id\)/);assert.match(app,/state.products=products/);});
