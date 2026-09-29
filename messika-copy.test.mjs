import test from 'node:test';
import assert from 'node:assert/strict';
import {productTitle} from './catalog-core.mjs';

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
