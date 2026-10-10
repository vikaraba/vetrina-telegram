import test from 'node:test';
import assert from 'node:assert/strict';
import {previewProduct} from './scripts/preview-publication.mjs';

const products=[{id:343,brand:'On',telegramPublications:[
  {id:1717,url:'https://t.me/c/3920029691/8354/9600'},
  {id:1718,url:'https://t.me/c/3920029691/8354/10841'}
]}];

test('local preview resolves the selected publication, not the first product post',()=>{
  assert.equal(previewProduct(products,{publicationId:'1718'}).telegramPostUrl,'https://t.me/c/3920029691/8354/10841');
  assert.equal(previewProduct(products,{publicationId:'1718'}).telegramPublicationId,1718);
  assert.equal(previewProduct(products,{publicationId:'1717'}).telegramPostUrl,'https://t.me/c/3920029691/8354/9600');
  assert.equal(previewProduct(products,{id:'343'}).telegramPostUrl,null);
  assert.equal(previewProduct(products,{publicationId:'1719'}),null);
});
