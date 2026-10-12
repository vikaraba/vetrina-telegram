import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const root=new URL('./',import.meta.url);
const build=target=>spawnSync(process.execPath,['scripts/build.mjs'],{
  cwd:root,encoding:'utf8',env:{...process.env,MINIAPP_TARGET:target}
});

test('staging and production builds use only their own storefront endpoint',async()=>{
  for(const target of ['production','staging']){
    const result=build(target);
    assert.equal(result.status,0,result.stderr);
  }
  const production=await readFile(new URL('dist/storefront-api.mjs',root),'utf8');
  const staging=await readFile(new URL('dist-staging/storefront-api.mjs',root),'utf8');
  assert.match(production,/dbgcpgteuwkxqjgvppfp\.supabase\.co\/functions\/v1\/telegram-storefront/);
  assert.doesNotMatch(production,/zwhdxuiuhtxugvhzopjo\.supabase\.co/);
  assert.match(staging,/zwhdxuiuhtxugvhzopjo\.supabase\.co\/functions\/v1\/telegram-storefront/);
  assert.doesNotMatch(staging,/dbgcpgteuwkxqjgvppfp\.supabase\.co/);
  const stagingApp=await readFile(new URL('dist-staging/app.js',root),'utf8');
  assert.match(stagingApp,/customerImageUrl\(i\)/);
  assert.doesNotMatch(stagingApp,/dbgcpgteuwkxqjgvppfp\.supabase\.co/,
    'staging images must use the staging API origin, including signed private media');
  const stageModule=await import(new URL('dist-staging/storefront-api.mjs',root));
  assert.equal(stageModule.customerImageUrl({bucket:'product-imports',path:'telegram/A.jpg',
    url:'https://zwhdxuiuhtxugvhzopjo.supabase.co/storage/v1/object/sign/product-imports/telegram/A.jpg?token=synthetic'}),
  'https://zwhdxuiuhtxugvhzopjo.supabase.co/storage/v1/object/sign/product-imports/telegram/A.jpg?token=synthetic');
  assert.equal(stageModule.customerImageUrl({bucket:'product-imports',path:'telegram/A.jpg',
    url:'https://dbgcpgteuwkxqjgvppfp.supabase.co/storage/v1/object/sign/product-imports/telegram/A.jpg?token=synthetic'}),null);
  const source=await readFile(new URL('storefront-api.mjs',root),'utf8');
  assert.equal(production,source,'the production build must remain byte-for-byte unchanged');
});

test('unknown build targets fail closed',()=>{
  assert.notEqual(build('preview-or-production').status,0);
});
