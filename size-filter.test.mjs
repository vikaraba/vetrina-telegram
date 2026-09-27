import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSize,selectedSizes,knownOrderableSizes,sizeFacets} from './size-filter.mjs';
import {blankFilters,filterProducts,setFilter,activeCount} from './catalog-core.mjs';
const observedAt=new Date().toISOString();
const product=(id,gender,sizes)=>({id,brand:'On',sourceId:'on_running_it',category:'shoes',model:'TEST '+id,name:'TEST '+id,gender,color:'White',priceAmount:15000,priceCurrency:'RUB',sizeAvailability:sizes.map(([value,status])=>({value,status,observedAt}))});
const products=[product(1,'women',[['38','available'],['38.5','sold_out'],['50','unknown']]),product(2,'women',[['38.5','available'],['38','sold_out']]),product(3,'men',[['41','available']]),{...product(4,'women',[['38','available']]),brand:'Cartier',sourceId:'cartier'}];
const filters=values=>({...blankFilters(),brand:'On',selectedSizes:values});
test('decimal comma normalizes without rounding absent shoe sizes',()=>{assert.equal(normalizeSize('38,5'),'38.5');assert.equal(normalizeSize('37,7'),'37.7');assert.deepEqual(selectedSizes(filters(['38,5','38.5','38'])),['38','38.5']);assert.equal(filterProducts(products,filters(['37,7'])).length,0);});
test('38 uses positive observations, not selectable or sold out sizes',()=>{assert.deepEqual(filterProducts(products,filters(['38'])).map(p=>p.id),[1]);});
test('multiple sizes are OR without duplicate models',()=>assert.deepEqual(filterProducts(products,filters(['38','38.5'])).map(p=>p.id),[1,2]));
test('sizes combine with gender/model/price and exclude jewelry',()=>{assert.equal(filterProducts(products,{...filters(['38']),gender:'men'}).length,0);assert.equal(filterProducts(products,{...filters(['38']),maxPrice:'14999'}).length,0);assert.equal(filterProducts(products,{...filters(['38']),model:'absent'}).length,0);});
test('unknown, stale, future and undated states are never positive availability',()=>{
 for(const status of ['sold_out','unknown','pending',undefined])assert.deepEqual(knownOrderableSizes({sourceId:'on_running_it',sizeAvailability:[{value:'38',status,observedAt}]}),[]);
 for(const date of [undefined,new Date(Date.now()-7*3600000).toISOString(),new Date(Date.now()+3600000).toISOString()])assert.deepEqual(knownOrderableSizes({sourceId:'on_running_it',sizeAvailability:[{value:'38',status:'available',observedAt:date}]}),[]);
});
test('counts use unique models and include zero options',()=>{const options=sizeFacets(products);assert.equal(options.find(x=>x.value==='38').count,1);assert.equal(options.find(x=>x.value==='50').count,0);});
test('brand change clears ON size selection and count treats it as one facet',()=>{assert.deepEqual(setFilter(filters(['38','38.5']),'brand','Louis Vuitton').selectedSizes,[]);assert.equal(activeCount(filters([])),1);assert.equal(activeCount(filters(['38','38.5'])),2);});
