import test from 'node:test';
import assert from 'node:assert/strict';
import {productTitle,modelName,filterProducts,blankFilters,facets} from './catalog-core.mjs';

const messika=name=>productTitle({brand:'Messika',category:'jewelry',name});
test('Messika customer titles translate generic types without changing collection names',()=>{
  for(const [source,expected] of [
    ['Bracciale rigido Move Uno, modello piccolo','Жёсткий браслет Move Uno, малая модель'],
    ['Anello rivière My Twin','Кольцо-дорожка My Twin'],
    ['Collana choker Move Uno','Колье-чокер Move Uno'],
    ['Collana So Move pavé','Колье So Move с паве'],
    ['Orecchini pendenti Lucky Move con malachite','Серьги-подвески Lucky Move с малахитом'],
    ['Orecchini a cerchio D-Vibes','Серьги-кольца D-Vibes'],
    ['Anello chevalier Move Titanium','Кольцо-печатка Move Titanium'],
    ['Bracciale Move Noa con semi pavé, modello piccolo','Браслет Move Noa с частичным паве, малая модель'],
    ['Move Uno asymmetrical earrings','Асимметричные серьги Move Uno'],
    ['Move Uno pavé stud earrings','Серьги-пусеты Move Uno с паве'],
    ['Move Uno bracelet','Браслет Move Uno'],
    ['Bracciale con cordino Messika Care(s) arancione con pavé','Браслет на шнурке Messika Care(s) оранжевого цвета с паве']
  ])assert.equal(messika(source),expected,source);
});

test('Messika model filter groups official collections instead of Italian product titles',()=>{
  const products=[
    {id:1,brand:'Messika',category:'bracelets',name:'Bracciale con cordino Messika Care(s) giallo'},
    {id:2,brand:'Messika',category:'necklaces',name:'Collana con cordino Messika Care(s) nero con pavé'},
    {id:3,brand:'Messika',category:'rings',name:'Anello Move Uno con semi pavé'},
    {id:4,brand:'Messika',category:'rings',name:'Anello senza collezione verificata'},
  ];
  assert.equal(modelName(products[0]),'Messika Care(s)');
  assert.equal(modelName(products[1]),'Messika Care(s)');
  assert.equal(modelName(products[2]),'Move Uno');
  assert.equal(modelName(products[3]),'');
  assert.deepEqual(facets(products,blankFilters(),'','model').map(({value,count})=>[value,count]),
    [['Messika Care(s)',2],['Move Uno',1]]);
  assert.deepEqual(filterProducts(products,{...blankFilters(),model:'Messika Care(s)'}).map(p=>p.id),[1,2]);
  assert.equal(modelName({brand:'Cartier',name:'Tank Must de Cartier watch'}),'Tank Must de Cartier watch');
});
