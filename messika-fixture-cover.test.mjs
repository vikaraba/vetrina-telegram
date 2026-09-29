import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

test('Messika UAT fixture shows the verified white cover, retaining every official photo',()=>{
  const root=mkdtempSync(join(tmpdir(),'messika-fixture-'));
  try{
    const input=join(root,'input.json'),output=join(root,'output.json');
    const hashes=['a','b','c'].map(letter=>letter.repeat(64));
    writeFileSync(input,JSON.stringify({products:[{
      crmProductIds:[115],reference:'14142-WG',allOfficialPhotosArchived:true,
      product:{source:'messika_it',brand:'Messika',category:'necklaces_and_pendants',productName:'Care(s)'},
      images:hashes.map((hash,index)=>({optimizedSha256:hash,coverEligible:index===1,
        background:{publicationEligible:index===1}})),
    }]}));
    const result=spawnSync(process.execPath,[new URL('./scripts/build-messika-uat-fixture.mjs',import.meta.url).pathname,input,output],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    const [product]=JSON.parse(readFileSync(output,'utf8'));
    assert.equal(product.imagePath,`qa/${hashes[1]}.jpg`);
    assert.deepEqual(product.images.map(image=>image.path),[hashes[1],hashes[0],hashes[2]].map(hash=>`qa/${hash}.jpg`));
    assert.equal(product.priceMode,'on_request');
    assert.equal(product.priceAmount,null);
  }finally{rmSync(root,{recursive:true,force:true});}
});
