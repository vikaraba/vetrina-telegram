import test from 'node:test';
import assert from 'node:assert/strict';
import {categoryOf,categoryLabel,productTitle,jewelryMaterial,blankFilters,filterProducts,facets,modelName,validPrice} from './catalog-core.mjs';
import {contactUrl} from './storefront-api.mjs';
const ring={id:1,brand:'Cartier',name:'1895 wedding band, 2.5 mm width',model:'1895',category:'Wedding band',reference:'TEST-RING',priceAmount:80000,priceCurrency:'RUB',description:'18K yellow gold (750/1000)',sizes:[{value:'52'}]};
const pendant={id:2,brand:'Cartier',name:'Symbol pendant',model:'Symbols',category:'Pendants',reference:'TEST-PENDANT',priceAmount:75000,priceCurrency:'RUB',description:'18K white gold (750/1000)',sizes:[]};
const vca={id:3,brand:'Van Cleef & Arpels',name:'Fede nuziale Toujours, 2,5 mm',model:'Fedi nuziali',category:'Nozze',reference:'TEST-VCA',priceAmount:93000,priceCurrency:'RUB',description:'Fede nuziale Toujours, 2,5 mm, oro rosa.'};
test('all imported Cartier and Van Cleef category aliases have Russian labels',()=>{
  for(const category of ['Wedding band','Bracelet','Steel Watches','Earrings','Pendants','Ring','Necklace','Nozze','Gioielleria','necklaces_and_pendants','bracelets','rings','earrings'])assert.match(categoryLabel(categoryOf({category})),/[А-Яа-я]/);
});
test('jewelry title preserves actual product identity, model remains a filter',()=>{
  assert.equal(productTitle(ring),'1895 Обручальное кольцо, 2.5 мм ширина');
  assert.equal(productTitle(vca),'Обручальное кольцо Toujours, 2,5 мм');
  assert.equal(modelName(ring),'1895');assert.equal(modelName(vca),'Fedi nuziali');
});
test('existing ON and LV titles and category semantics remain unchanged',()=>{
  for(const p of [{brand:'On',model:'Cloud 6 da uomo',category:'shoes'},{brand:'Louis Vuitton',name:'Borsa Neverfull',category:'Louis Vuitton'}])assert.equal(productTitle(p),modelName(p));
  assert.equal(categoryOf({category:'Louis Vuitton'}),'bags-accessories');
});
test('material uses explicit source facts only, never marketing prose or invented purity',()=>{
  assert.equal(jewelryMaterial(ring),'Жёлтое золото');assert.equal(jewelryMaterial(vca),'Розовое золото');
  assert.equal(jewelryMaterial({...ring,description:'A precious symbol of love'}),'Уточним в личном сообщении');
  assert.equal(jewelryMaterial({...ring,brand:'Louis Vuitton'}),null);
});
test('Russian search, exact reference, category, brand and budget filters combine',()=>{
  const products=[ring,pendant,vca];
  assert.equal(filterProducts(products,blankFilters(),'подвеска')[0].id,2);
  assert.deepEqual(filterProducts(products,{...blankFilters(),category:'wedding-rings',brand:'Cartier',maxPrice:'80000'}).map(x=>x.id),[1]);
  assert.equal(filterProducts(products,blankFilters(),'TEST-VCA')[0].id,3);
  assert.equal(facets(products,blankFilters(),'','category').find(x=>x.value==='wedding-rings').count,2);
  assert.equal(filterProducts(products,blankFilters()).length,3);
});
test('jewelry contact keeps reference and ring size without shoe EU notation',()=>{
  const u=new URL(contactUrl({...ring,name:productTitle(ring)},'52'));
  assert.equal(u.pathname,'/buyer_rome');assert.match(u.searchParams.get('text'),/Размер 52/);assert.doesNotMatch(u.searchParams.get('text'),/EU/);
  assert.match(u.searchParams.get('text'),/TEST-RING/);
});
test('Messika uses the same catalog and Russian jewelry rules without invented price or material',()=>{
  const messika={id:4,brand:'Messika',name:'BRACCIALE CON CORDINO MESSIKA CARE(S) GIALLO',model:'Messika CARE(S)',category:'Bracciale',reference:'14659-WG',priceAmount:null,priceCurrency:null,description:'Bracciale con cordino giallo in oro bianco'};
  assert.equal(productTitle(messika),'Браслет на шнурке MESSIKA CARE(S) жёлтый');
  assert.equal(categoryOf(messika),'bracelets');
  assert.equal(jewelryMaterial(messika),'Белое золото');
  assert.equal(validPrice(messika),false);
  assert.equal(filterProducts([ring,vca,messika],{...blankFilters(),brand:'Messika'},'браслет')[0].id,4);
  assert.equal(filterProducts([messika],{...blankFilters(),minPrice:'1'}).length,0);
  assert.equal(facets([ring,vca,messika],blankFilters(),'','brand').find(x=>x.value==='Messika').count,1);
  for(const [category,expected] of [['Collana','necklaces'],['Bracciale','bracelets'],['Fede','wedding-rings'],['Anello','rings'],['Orecchini','earrings']])assert.equal(categoryOf({category}),expected);
  assert.equal(jewelryMaterial({...messika,description:'Move Uno'}),'Уточним в личном сообщении');
  assert.equal(modelName(messika),'Messika CARE(S)');
});
