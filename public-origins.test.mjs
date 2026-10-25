import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {API_BASE,SUPABASE_ORIGIN} from './public-origins.mjs';
import {productImageUrl} from './product-image.mjs';

const prod='https://dbgcpgteuwkxqjgvppfp.supabase.co';
const stage='https://zwhdxuiuhtxugvhzopjo.supabase.co';
const build=target=>execFileSync(process.execPath,['scripts/build.mjs'],{
  cwd:fileURLToPath(new URL('.',import.meta.url)),env:{...process.env,MINIAPP_BUILD_TARGET:target},encoding:'utf8',stdio:'pipe'
});
const output=file=>readFile(new URL('dist/'+file,import.meta.url),'utf8');

test('source defaults to production and rejects foreign or private image URLs',()=>{
  assert.equal(SUPABASE_ORIGIN,prod);
  assert.equal(API_BASE,prod+'/functions/v1/telegram-storefront');
  assert.equal(productImageUrl({bucket:'product-images',path:'brand/model one.jpg'}),
    prod+'/storage/v1/object/public/product-images/brand/model%20one.jpg');
  assert.equal(productImageUrl({url:prod+'/storage/v1/object/public/product-images/a.jpg'}),
    prod+'/storage/v1/object/public/product-images/a.jpg');
  for(const url of [stage+'/storage/v1/object/public/product-images/a.jpg',
    prod+'/storage/v1/object/private/product-images/a.jpg',
    'http://dbgcpgteuwkxqjgvppfp.supabase.co/storage/v1/object/public/product-images/a.jpg',
    'https://user@dbgcpgteuwkxqjgvppfp.supabase.co/storage/v1/object/public/product-images/a.jpg']){
    assert.equal(productImageUrl({url}),'');
  }
  assert.equal(productImageUrl({bucket:'product-images',path:'../other.jpg'}),'');
});

test('explicit staging build binds API and images to the same allowlisted origin; default remains production',async()=>{
  try{
    build('staging');
    const config=await output('public-origins.mjs');
    const contactPage=await output('ask.html');
    assert.match(config,/zwhdxuiuhtxugvhzopjo/);
    assert.doesNotMatch(config,/dbgcpgteuwkxqjgvppfp/);
    assert.match(contactPage,/zwhdxuiuhtxugvhzopjo/);
    assert.doesNotMatch(contactPage,/dbgcpgteuwkxqjgvppfp/);
    const stageApi=await import('./dist/storefront-api.mjs?target=staging');
    const stageImage=await import('./dist/product-image.mjs?target=staging');
    assert.equal(stageApi.API_BASE,stage+'/functions/v1/telegram-storefront');
    assert.equal(stageImage.productImageUrl({bucket:'product-images',path:'c312/test/cover.svg'}),
      stage+'/storage/v1/object/public/product-images/c312/test/cover.svg');
    assert.equal(stageImage.productImageUrl({url:prod+'/storage/v1/object/public/product-images/a.jpg'}),'');
    assert.throws(()=>build('https://attacker.example'),/MINIAPP_BUILD_TARGET must be production or staging/);
  }finally{build('production');}
  const config=await output('public-origins.mjs');
  const contactPage=await output('ask.html');
  assert.match(config,/dbgcpgteuwkxqjgvppfp/);
  assert.doesNotMatch(config,/zwhdxuiuhtxugvhzopjo/);
  assert.match(contactPage,/dbgcpgteuwkxqjgvppfp/);
  assert.doesNotMatch(contactPage,/zwhdxuiuhtxugvhzopjo/);
});
