import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {observedSizes} from './on-availability.mjs';
import {createStorefrontClient} from './storefront-api.mjs';
const now=Date.now(),p={id:1,sizes:[{value:'38'},{value:'38.5'},{value:'39'}]};
test('grid distinguishes fresh available, sold out, unknown and stale',()=>{
 const rows=[{value:'38',status:'available',observedAt:new Date(now).toISOString()},{value:'38.5',status:'sold_out',observedAt:new Date(now).toISOString()}];
 assert.deepEqual(observedSizes(p,rows,now).map(r=>r.status),['available','sold_out','unknown']);
 assert.ok(observedSizes(p,rows,now+7*3600000).every(r=>r.status==='unknown'));
 assert.ok(observedSizes(p).every(r=>r.status==='unknown'));
});
test('availability and restock use verified header-only session and exact product/size',async()=>{
 const calls=[],tg={initData:'TEST_NOT_A_SIGNATURE'};
 const c=createStorefrontClient({tg,fetchImpl:async(u,o)=>{calls.push([u,o]);return {ok:true,json:async()=>({sizes:[],subscriptions:[]})};}});
 c.explore();await c.availability(1);await c.restock(1,'38.5','subscribe');await c.restock(1,'38.5','cancel');
 assert.equal(calls[0][0].searchParams.get('action'),'on-availability');assert.equal(calls[0][0].searchParams.get('id'),'1');
 for(const [u,o] of calls){assert.equal(o.headers['x-telegram-init-data'],tg.initData);assert.equal(u.searchParams.get('explore'),'1');assert.ok(!u.href.includes(tg.initData));}
 assert.deepEqual(JSON.parse(calls[1][1].body),{productId:1,size:'38.5',action:'subscribe'});
});
test('two ON actions preserve approved placement; real selection rechecks size',()=>{
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8'),css=readFileSync(new URL('./style.css',import.meta.url),'utf8');
 assert.match(app,/const label=isOnSizeProduct\(state.product\)\?'Заказать'/);assert.match(app,/insertAdjacentElement\('afterend',\$\('#size-open'\)\)/);
 assert.match(css,/\.on-two-actions #size-open\{justify-content:center;text-align:center/);assert.match(css,/\.on-size-order-dock\{[^}]*position:fixed/);
 assert.match(app,/select\(product,row\)[\s\S]*?void checkSize\(\)/);assert.doesNotMatch(app,/__LOCAL_ON_PROTOTYPE__|previewBrand|Прототип/);
});
