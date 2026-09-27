import test from 'node:test';
import assert from 'node:assert/strict';
import {categoryOf,categoryLabel,productTitle,filterProducts,blankFilters,facets} from './catalog-core.mjs';
import {contactUrl} from './storefront-api.mjs';
const a={id:234,brand:'Cartier',category:'Steel Watches',model:'Tank',name:'Tank Must de Cartier watch',reference:'WSTA0107',priceAmount:417000,priceCurrency:'RUB'};
const b={...a,id:275,reference:'WSTA0136'};
test('watch aliases share the Russian category without inferring from brand or millimetres',()=>{
 for(const category of ['Steel Watches','Watches','watch','Orologi','orologio','jewelry_watches','часы'])assert.equal(categoryLabel(categoryOf({category})),'Часы');
 assert.equal(categoryOf({brand:'Cartier',category:'Ring',name:'Ring 10MM'}),'rings');
 assert.equal(categoryOf({brand:'CHOPARD',category:'gioielli'}),'jewelry');
});
test('watch identity retains full model variant, independent of brand',()=>{
 assert.equal(productTitle(a),'Tank Must de Cartier Часы');
 assert.equal(productTitle({brand:'BVLGARI',category:'orologi',model:'Serpenti',name:'Serpenti Tubogas Orologio'}),'Serpenti Tubogas Часы');
 assert.equal(productTitle({brand:'CHOPARD',category:'watches',model:'Happy Sport',name:'Happy Sport 30 mm automatico'}),'Happy Sport 30 mm automatico');
});
test('exact references distinguish two watches from the same collection',()=>{
 assert.deepEqual(filterProducts([a,b],{...blankFilters(),brand:'Cartier',category:'watches'},'WSTA0136').map(p=>p.id),[275]);
 assert.equal(filterProducts([a,b],blankFilters(),'WSTA013').length,1);
 assert.equal(facets([a,b],blankFilters(),'','category')[0].value,'watches');
});
test('watch order preserves exact reference and never invents shoe size',()=>{
 const url=new URL(contactUrl({...b,name:productTitle(b)},null));
 assert.equal(url.pathname,'/buyer_rome');assert.match(url.searchParams.get('text'),/WSTA0136/);
 assert.doesNotMatch(url.searchParams.get('text'),/WSTA0107|EU|Размер/);
});
