import test from 'node:test';
import assert from 'node:assert/strict';
import {contactUrl,normalizeProduct,openContact,createStorefrontClient,telegramPostUrl,catalogProductUrl,requestedPublicationId} from './storefront-api.mjs';

const original='https://t.me/c/3920029691/8354/9600';
const product={id:343,brand:'On',name:'THE ROGER',category:'shoes',reference:'TEST-343',color:'White',telegramPostUrl:original};
const text=p=>new URL(contactUrl(p,'42')).searchParams.get('text');

test('order draft includes original CRM post exactly once and preserves model, size and recipient',()=>{
  const url=new URL(contactUrl(normalizeProduct(product),'42'));
  assert.equal(url.pathname,'/buyer_rome');
  assert.match(url.searchParams.get('text'),/TEST-343/);
  assert.match(url.searchParams.get('text'),/Размер EU 42/);
  assert.ok(url.searchParams.get('text').includes('Публикация в каталоге:\n'+original));
  assert.equal(url.searchParams.get('text').split(original).length,2);
  assert.ok(url.searchParams.get('text').endsWith('Карточка товара:\nhttps://t.me/aerofeevaBot/katalog?startapp=product_343'));
});
test('supports public and private channel/topic message permalinks',()=>{
  for(const url of [original,'https://t.me/c/1565886316/77','https://t.me/lykboutique/77','https://t.me/buyer_rome_catalog/8354/9600'])assert.equal(telegramPostUrl(url),url);
});
test('missing post links the exact Mini App card, never an unrelated source URL',()=>{
  const p={...product,telegramPostUrl:undefined,sourceUrl:'https://www.on.com/source',external_url:original};
  assert.equal(text(p),'Анастасия, здравствуйте!\n\nМеня интересует On THE ROGER (артикул TEST-343), цвет White.\nРазмер EU 42.\n\nПодскажите, пожалуйста, актуальное наличие, итоговую стоимость и условия доставки. Спасибо!\n\nКарточка товара:\nhttps://t.me/aerofeevaBot/katalog?startapp=product_343');
  assert.equal(normalizeProduct(p).telegramPostUrl,null);
  assert.doesNotMatch(text(p),/on\.com\/source/);
});
test('card link is built only from a valid product identity and preserves size',()=>{
  assert.equal(catalogProductUrl(343),'https://t.me/aerofeevaBot/katalog?startapp=product_343');
  for(const id of [0,-1,1.5,Number.MAX_SAFE_INTEGER+1,'343',null])assert.equal(catalogProductUrl(id),null);
  const missing=text({...product,id:null,telegramPostUrl:null});
  assert.match(missing,/Размер EU 42/);
  assert.doesNotMatch(missing,/Карточка товара|Публикация в каталоге/);
});
test('rejects untrusted URLs, invitations, malformed message IDs and injected lines',()=>{
  for(const value of [null,{},44,'http://t.me/lykboutique/1','https://t.me.evil.example/lykboutique/1','https://t.me@evil.example/lykboutique/1','https://evil.example/1','javascript:alert(1)','https://t.me/+invite','https://t.me/lykboutique','https://t.me/lykboutique/0','https://t.me/lykboutique/-1','https://t.me/lykboutique/1?text=evil','https://t.me/c/1/2/3/4',original+'\n',original+'#evil']){
    assert.equal(telegramPostUrl(value),null);
    assert.doesNotMatch(text({...product,telegramPostUrl:value}),/Публикация в каталоге/);
    assert.match(text({...product,telegramPostUrl:value}),/Карточка товара:/);
  }
});
test('opening another product never carries the previous product publication',async()=>{
  const client=createStorefrontClient({tg:{initData:'synthetic'},fetchImpl:async url=>({ok:true,json:async()=>Number(url.searchParams.get('id'))===343?product:{...product,id:374,telegramPostUrl:null}})});
  assert.ok(text(await client.product(343)).includes(original));
  assert.ok(!text(await client.product(374)).includes(original));
  assert.ok(text(await client.product(374)).includes('startapp=product_374'));
});
test('order opens synchronously with link even while analytics is unavailable',()=>{
  let opened;openContact({track:()=>new Promise(()=>{})},{openTelegramLink:url=>{opened=url;}},product,'42');
  assert.ok(new URL(opened).searchParams.get('text').includes(original));
});
test('customer DTO still excludes source URLs, prices and arbitrary private publication payload',()=>{
  const p=normalizeProduct({...product,sourceUrl:'https://supplier.example/private',priceEur:80,channel_payload:{secret:'private'}});
  assert.equal(p.telegramPostUrl,original);
  for(const key of ['sourceUrl','priceEur','channel_payload'])assert.ok(!(key in p));
});
test('signed publication launch requests exact clicked post, including second post',async()=>{
  assert.equal(requestedPublicationId({initDataUnsafe:{start_param:'publication_1718'}},'?tgWebAppStartParam=publication_112'),1718);
  for(const invalid of ['publication_0','publication_1x','publication_9007199254740993','product_112'])
    assert.equal(requestedPublicationId(null,'?tgWebAppStartParam='+invalid),null);
  const second='https://t.me/c/3920029691/8354/10841';
  const calls=[];
  const client=createStorefrontClient({tg:{initData:'signed'},fetchImpl:async url=>{
    calls.push(url);
    return {ok:true,json:async()=>({...product,telegramPostUrl:second,telegramPublicationId:1718})};
  }});
  const selected=await client.productByPublication(1718);
  assert.equal(calls[0].searchParams.get('publication_id'),'1718');
  assert.equal(calls[0].searchParams.get('id'),null);
  assert.equal(selected.telegramPublicationId,1718);
  assert.ok(text(selected).includes(second));
  assert.ok(!text(selected).includes(original));
});
test('ambiguous product-only and no-post records fall back to exact card without supplier cost',()=>{
  for(const raw of [{...product,telegramPostUrl:null},{...product,telegramPostUrl:null,priceEur:80,sourceUrl:'https://supplier.example/private'}]){
    const draft=text(normalizeProduct(raw));
    assert.match(draft,/Карточка товара:\nhttps:\/\/t\.me\/aerofeevaBot\/katalog\?startapp=product_343/);
    assert.doesNotMatch(draft,/Публикация в каталоге|supplier\.example|80/);
  }
});
