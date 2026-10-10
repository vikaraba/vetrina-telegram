import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initial,matches,facets,sortItems,discountPercent,publicationTime,productCount,priceError} from './discovery-core.mjs';
import {createStorefrontClient,normalizeProduct} from './storefront-api.mjs';
import {productTitle,colorLabel,categoryLabel,categoryOf} from './catalog-core.mjs';
const row=(id,extra={})=>({id,brand:'On',name:'Cloud X da donna',model:'Cloud X',category:'shoes',gender:'women',color:'White',sourceId:'on_running_it',imageBucket:'product-images',imagePath:`synthetic/${id}.jpg`,priceCurrency:'RUB',priceAmount:18000,...extra});
test('multiselect is OR within a facet and AND across facets',()=>{
 const until=new Date(Date.now()+3600000).toISOString();
 const products=[row(1,{availableSizes:['37.5']}),row(2,{availableSizes:['38']}),row(3,{gender:'men',availableSizes:['38']}),row(4,{availableSizes:['40']})].map(p=>({...p,availabilityValidUntil:until}));
 const f={...initial(),gender:['women'],brand:['On'],size:['37.5','38']};
 assert.deepEqual(matches(products,f).map(p=>p.id),[1,2]);
 assert.deepEqual(facets(products,f,'','size').map(x=>[x.value,x.count]),[['37.5',1],['38',1],['40',1]]);
 assert.equal(matches(products,{...f,brand:['Louis Vuitton']}).length,0);
});
test('full source size grid is never used as an availability facet',()=>{
  assert.equal(matches([row(1,{sizes:[{value:'38',status:'available'}]})],{...initial(),size:['38']}).length,0);
  assert.equal(matches([row(1,{availableSizes:['38'],availabilityValidUntil:'2000-01-01T00:00:00Z'})],{...initial(),size:['38']}).length,0);
});
test('DTO accepts only explicit customer metadata with a live availability expiry',()=>{
 const now=Date.now(),until=new Date(now+3600000).toISOString(),checked=new Date(now-60000).toISOString();
 const raw=row(1,{publishedAt:checked,availableSizes:['38','38.5'],availabilityCheckedAt:checked,availabilityValidUntil:until,discountVerified:true,previousPriceAmount:30000,previousPriceCurrency:'RUB'});
 assert.equal(normalizeProduct(raw).publishedAt,checked);
 assert.deepEqual(normalizeProduct(raw).availableSizes,['38','38.5']);
 assert.equal(discountPercent(normalizeProduct(raw)),40);
 assert.deepEqual(normalizeProduct({...raw,availabilityCheckedAt:null}).availableSizes,[]);
 assert.deepEqual(normalizeProduct({...raw,availabilityValidUntil:checked}).availableSizes,[]);
 assert.equal(normalizeProduct({...raw,publishedAt:until}).publishedAt,null);
 assert.equal(normalizeProduct({...raw,discountVerified:false}).previousPriceAmount,null);
});
test('Russian aliases, types and colors preserve exact model references',()=>{
 const items=[row(1,{brand:'Louis Vuitton',category:'bags',model:'Neverfull MM',name:'Borsa Neverfull MM',reference:'M46987'}),row(2,{brand:'Van Cleef & Arpels',name:'Anello Perlée',category:'anello'})];
 assert.deepEqual(matches(items,initial(),'лв M46987').map(p=>p.id),[1]);
 assert.deepEqual(matches(items,initial(),'ванклиф кольцо').map(p=>p.id),[2]);
 assert.equal(productTitle(items[0]),'Neverfull MM');
 assert.equal(colorLabel('Frost | Evergreen'),'Морозный / Тёмно-зелёный');
 assert.equal(categoryLabel(categoryOf({category:'платье'})),'Платья');
});
test('source EUR discounts, unknown and on-request prices are not customer sale prices',()=>{
 assert.equal(discountPercent(row(1,{sourceDiscountPercent:50,previousPriceAmount:30000,previousPriceCurrency:'RUB'})),null);
 assert.equal(discountPercent(row(1,{discountVerified:true,previousPriceAmount:30000,previousPriceCurrency:'EUR'})),null);
 assert.equal(discountPercent(row(1,{discountVerified:true,previousPriceAmount:30000,previousPriceCurrency:'RUB'})),40);
 assert.equal(matches([row(1,{priceMode:'on_request',priceAmount:null})],{...initial(),max:'20000'}).length,0);
 assert.ok(priceError({...initial(),min:'200',max:'100'}));
 assert.ok(priceError({...initial(),max:'1e4'}));
});
test('recent posts require actual dates, not importedAt or reference ordering',()=>{
 const now=Date.parse('2026-10-10T18:00:00Z');
 const data=[row(1,{publishedAt:'2026-10-09T18:00:00Z'}),row(2,{importedAt:'2026-10-10T18:00:00Z'}),row(3,{publishedAt:'2026-10-11T18:00:00Z'}),row(4,{publishedAt:'invalid'})];
 assert.deepEqual(matches(data,{...initial(),period:'7'},'','',now).map(p=>p.id),[1]);
 assert.equal(publicationTime(data[1]),null);
});
test('all brands remain reachable; curated is not fake popularity',()=>{
 const data=[row(1),row(2),row(3,{brand:'Messika'}),row(4,{brand:'Cartier'})];
 assert.deepEqual(sortItems(data,'curated').map(p=>p.id),[1,3,4,2]);
 assert.deepEqual(data.map(p=>p.id),[1,2,3,4]);
 assert.equal(facets(data,{...initial(),brand:['Missing']},'','brand').find(v=>v.value==='Missing').count,0);
 assert.equal(productCount(21),'21 товар');assert.equal(productCount(12),'12 товаров');
});
for(const count of [999,1000,1001])test('authenticated list preserves '+count+' unique products without detail fetches',async()=>{
 const data=Array.from({length:count},(_,i)=>row(i+1)),calls=[];
 const client=createStorefrontClient({tg:{initData:'SYNTHETIC_TEST_ONLY'},fetchImpl:async url=>{
  assert.equal(url.searchParams.get('action'),'catalog');const offset=Number(url.searchParams.get('offset'));calls.push(offset);
  return {ok:true,json:async()=>({total:count,items:data.slice(offset,offset+100)})};
 }});
 const list=await client.catalog();assert.equal(list.length,count);assert.equal(new Set(list.map(p=>p.id)).size,count);
 assert.equal(matches(list,initial()).length,count);assert.equal(facets(list,initial(),'','brand')[0].count,count);
 assert.equal(calls.length,Math.ceil(count/100));
});
test('discovery is presentation only: no fixtures, identity persistence or business writes',async()=>{
 const ui=await readFile(new URL('./discovery-ui.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(ui,/fetch\(|localStorage|sessionStorage|initData|catalog[.]json|size-interest|simulated/);
 assert.match(ui,/onProduct\(Number\(b.dataset.product\)\)/);
 assert.match(ui,/clearTimeout\(searchTimer\)/);
 assert.match(ui,/signal:abort.signal/);
 assert.equal(normalizeProduct({id:1,priceEur:99,privateNote:'hidden'}).privateNote,undefined);
});
