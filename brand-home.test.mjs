import test from 'node:test';
import assert from 'node:assert/strict';
import {brandCollections,blankFilters,filterProducts} from './catalog-core.mjs';

test('home groups only returned catalog products, with counts matching brand navigation',()=>{
  const products=[
    {id:1,brand:'On',category:'shoes'},
    {id:2,brand:'Louis Vuitton',category:'Louis Vuitton'},
    {id:3,brand:'On',category:'shoes'},
    {id:4,brand:'New brand',category:'jewelry'},
    {id:5,brand:'New brand',category:'watches'},
  ];
  const groups=brandCollections(products);
  assert.deepEqual(groups.map(g=>g.brand),['Louis Vuitton','New brand','On']);
  for(const group of groups){
    assert.equal(group.count,filterProducts(products,{...blankFilters(),brand:group.brand}).length);
    assert.deepEqual(group.products,products.filter(p=>p.brand===group.brand));
  }
  assert.deepEqual(groups[0].categories,['Сумки и аксессуары']);
  assert.deepEqual(groups[1].categories,['Украшения','Часы']);
  assert.deepEqual(groups[2].categories,['Обувь']);
  assert.equal(products[0].id,1);
});

test('empty or unnamed catalog entries never invent brand collections',()=>{
  assert.deepEqual(brandCollections([]),[]);
  assert.deepEqual(brandCollections([{id:1},{id:2,brand:'  '}]),[]);
  assert.deepEqual(brandCollections([{id:3,brand:'Only brand'}]).map(g=>[g.brand,g.count]),[['Only brand',1]]);
});
