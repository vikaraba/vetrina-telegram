import test from 'node:test';
import assert from 'node:assert/strict';
import {createStorefrontClient,requestedProductId,normalizeProduct,contactUrl,openContact,randomUuid,clientContext} from './storefront-api.mjs';
import {blankFilters,filterProducts,facets,setFilter,priceError} from './catalog-core.mjs';
import {createLatestCheck,sizeValues,indexAtScroll} from './size-picker.mjs';
const tg={initData:'synthetic-test-signature',initDataUnsafe:{start_param:'product_7'},platform:'test'};
const ok=value=>({ok:true,status:200,json:async()=>value});
const item=id=>({id,brand:id%2?'On':'Louis Vuitton',name:'Model '+id,reference:'TEST-'+id,category:id%2?'shoes':'bags',gender:'women',model:'Model '+id,color:'White',priceAmount:10000+id,priceCurrency:'RUB'});
test('strict deep link accepts signed launch first, not arbitrary product query',()=>{
  assert.equal(requestedProductId(tg,'?tgWebAppStartParam=product_8'),7);
  for(const v of ['product_0','product_-1','product_1abc','product_9007199254740993','other'])assert.equal(requestedProductId(null,'?tgWebAppStartParam='+v),null);
  assert.equal(requestedProductId(null,'?product=9'),null);assert.equal(requestedProductId(null,'?tgWebAppStartParam=product_9'),9);
});
test('all requests require initData; unauthenticated browser never calls backend',async()=>{
  let called=0;const c=createStorefrontClient({fetchImpl:()=>{called++;}});
  await assert.rejects(c.catalog(),e=>e.status===401);assert.equal(called,0);
});
test('header-only identity, session context, no client-supplied user identity',async()=>{
  const c=createStorefrontClient({tg,fetchImpl:async(url,options)=>{
    assert.ok(!url.href.includes(tg.initData));assert.equal(options.headers['x-telegram-init-data'],tg.initData);
    const ctx=JSON.parse(options.headers['x-telegram-client-context']);assert.equal(ctx.trust,'client_reported');assert.ok(ctx.page_session_id);assert.equal(options.cache,'no-store');return ok(item(7));
  }});await c.product(7);
});
test('explicit explore propagates to new product AND size-interest, never bypasses signature',async()=>{
  const calls=[];const c=createStorefrontClient({tg,fetchImpl:async(url,options)=>{calls.push([url,options]);return ok(url.searchParams.get('action')==='product'?item(8):{status:'available',checkId:randomUuid()});}});
  await c.product(7);c.explore();await c.product(8);await c.checkSize(8,'41');
  assert.equal(calls[0][0].searchParams.get('explore'),null);
  for(const[url,options]of calls.slice(1)){assert.equal(url.searchParams.get('explore'),'1');assert.equal(options.headers['x-telegram-init-data'],tg.initData);}
});
test('catalog pagination reaches beyond100 without product detail calls or duplicates',async()=>{
  const data=Array.from({length:234},(_,i)=>item(i+1)),calls=[];
  const c=createStorefrontClient({tg,fetchImpl:async(url)=>{calls.push(url);const offset=Number(url.searchParams.get('offset'));return ok({items:data.slice(offset,offset+100),total:data.length});}});
  const list=await c.catalog();assert.equal(list.length,234);assert.equal(new Set(list.map(p=>p.id)).size,234);
  assert.deepEqual(calls.map(u=>u.searchParams.get('offset')),['0','100','200']);assert.ok(calls.every(u=>u.searchParams.get('action')==='catalog'));
});
test('empty catalog is valid; incomplete or duplicate pagination fails explicitly',async()=>{
  const make=payload=>createStorefrontClient({tg,fetchImpl:async()=>ok(payload)});
  assert.deepEqual(await make({items:[],total:0}).catalog(),[]);
  await assert.rejects(make({items:[],total:1}).catalog());
  await assert.rejects(make({items:[item(1),item(1)],total:2}).catalog());
});
test('API errors are customer Russian, never SQL/backend details',async()=>{
  const c=createStorefrontClient({tg,fetchImpl:async()=>({ok:false,status:500,json:async()=>({error:'secret SQL'})})});
  await assert.rejects(c.product(1),e=>!e.message.includes('SQL')&&e.message.includes('Попробуйте'));
});
test('hung API and body decode have hard deadlines even if transport ignores abort',async()=>{
  for(const fetchImpl of [()=>new Promise(()=>{}),async()=>({ok:true,json:()=>new Promise(()=>{})})]){
    const c=createStorefrontClient({tg,fetchImpl,timeoutMs:10});await assert.rejects(c.product(1));
  }
});
test('size confirms only terminal available; pending exhaustion falls back unknown',async()=>{
  let calls=0;const c=createStorefrontClient({tg,sleep:async()=>{},pollAttempts:2,fetchImpl:async()=>{calls++;return ok({checkId:'a',status:'queued'});}});
  assert.equal(await c.checkSize(7,'41'),'unknown');assert.equal(calls,3);
});
test('size retry after response timeout reuses eventId, preventing duplicate interest',async()=>{
  const ids=[];let first=true;
  const c=createStorefrontClient({tg,fetchImpl:async(url,o)=>{ids.push(JSON.parse(o.body).eventId);if(first){first=false;throw Error('network');}return ok({status:'available'});}});
  await assert.rejects(c.checkSize(7,'41'));assert.equal(await c.checkSize(7,'41'),'available');assert.equal(ids[0],ids[1]);
});
test('pending retry polls known check instead of posting another request',async()=>{
  const calls=[];const c=createStorefrontClient({tg,pollAttempts:0,fetchImpl:async url=>{calls.push(url.searchParams.get('action'));return ok({status:calls.length===1?'queued':'available',checkId:'same'});}});
  assert.equal(await c.checkSize(7,'41'),'unknown');assert.equal(await c.checkSize(7,'41'),'available');assert.deepEqual(calls,['size-interest','size-status']);
});
test('unknown, unavailable, failed remain distinct from success',async()=>{
  for(const[status,expected]of [['unknown','unknown'],['unavailable','unavailable'],['failed','error'],['available','available']]){
    const c=createStorefrontClient({tg,fetchImpl:async()=>ok({status})});assert.equal(await c.checkSize(7,'41'),expected);
  }
});
test('navigation cancels obsolete polling',async()=>{
  let calls=0;const c=createStorefrontClient({tg,fetchImpl:async()=>{calls++;return ok({status:'queued',checkId:'same'});}});
  assert.equal(await c.checkSize(7,'41',{isCurrent:()=>false}),'unknown');assert.equal(calls,1);
});
test('contact opens synchronously, even when analytics never resolves; contains exact model and size',()=>{
  let link=null;openContact({track:()=>new Promise(()=>{})},{openTelegramLink:url=>{link=url;}},item(7),'42');
  const u=new URL(link);assert.equal(u.hostname,'t.me');assert.equal(u.pathname,'/buyer_rome');assert.match(u.searchParams.get('text'),/TEST-7/);assert.match(u.searchParams.get('text'),/EU 42/);assert.doesNotMatch(u.searchParams.get('text'),/доступен/);
  assert.ok(!new URL(contactUrl(item(8),null)).searchParams.get('text').includes('Размер'));
});
test('customer DTO drops source cost and arbitrary private fields',()=>{
  const p=normalizeProduct({...item(1),priceEur:99,secret:'x'});assert.ok(!('priceEur'in p));assert.ok(!('secret'in p));
  assert.equal(normalizeProduct({...item(1),priceAmount:null}).priceAmount,null);
});
test('UUID and client metadata preserve legacy schema',()=>{
  assert.match(randomUuid(),/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const c=clientContext(tg,'test');assert.equal(c.schema_version,'telegram-webapp-client-v1');assert.equal(c.telegram_web_app.platform,'test');assert.ok('safe_area_inset'in c.telegram_web_app);
});
const products=[item(1),item(2),{...item(3),brand:'Messika',category:'jewelry',model:'Move',sizes:[{value:'52'}]}];
test('dynamic brands, models, gender, category, budget, LV aliases and empty state',()=>{
  assert.equal(filterProducts(products).length,3);assert.equal(filterProducts(products,blankFilters(),'лв').length,1);
  assert.equal(filterProducts(products,{...blankFilters(),brand:'Messika',category:'jewelry',model:'Move',gender:'women',minPrice:'10003',maxPrice:'10003'}).length,1);
  assert.equal(facets(products,blankFilters(),'','brand').length,3);assert.equal(filterProducts(products,blankFilters(),'no-match').length,0);
});
test('dependent facets reset, invalid RUB ranges and unsupported currency fail closed',()=>{
  const next=setFilter({...blankFilters(),model:'old',size:'41',color:'old',maxPrice:'100'},'brand','Messika');assert.equal(next.model,'all');assert.equal(next.maxPrice,'100');
  for(const f of [{minPrice:'2',maxPrice:'1'},{minPrice:'-1'},{maxPrice:'1.5'},{maxPrice:'1e5'}])assert.ok(priceError({...blankFilters(),...f}));
  assert.equal(filterProducts([{...item(1),priceCurrency:'EUR'}],{...blankFilters(),minPrice:'1'}).length,0);
});
test('roller uses only source sizes and bounded snap indices',()=>{
  assert.deepEqual(sizeValues({sizes:[{value:'41'},{value:'41'},{value:'42.5'},{value:'XS'}]}),['41','42.5','XS']);
  assert.equal(indexAtScroll(-1,4),0);assert.equal(indexAtScroll(999,4),3);
});
test('stale size response cannot overwrite newer product/size; errors allow retry',async()=>{
  const c=createLatestCheck(),states=[];let resolve;
  const first=c.run({size:'41'},()=>new Promise(r=>{resolve=r;}),x=>states.push(x));
  await c.run({size:'42'},async()=> 'available',x=>states.push(x));resolve('unavailable');
  assert.equal(await first,false);assert.equal(states.at(-1).size,'42');
  await c.run({size:'42'},async()=>{throw Error();},x=>states.push(x));assert.equal(states.at(-1).phase,'error');
});
