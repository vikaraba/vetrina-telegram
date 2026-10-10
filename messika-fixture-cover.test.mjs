import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

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

test('fresh local acquisition becomes a UAT fixture only with exact media bytes and source order',()=>{
  const root=mkdtempSync(join(tmpdir(),'messika-fresh-fixture-'));
  try{
    const input=join(root,'input.json'),output=join(root,'output.json');
    mkdirSync(join(root,'web'));
    const bytes=[Buffer.from('official-image-1'),Buffer.from('official-image-2')];
    const images=bytes.map((value,position)=>{
      const optimizedSha256=createHash('sha256').update(value).digest('hex');
      const optimizedPath=join(root,'web',`${optimizedSha256}.jpg`);
      writeFileSync(optimizedPath,value);
      return {optimizedPath,optimizedSha256,optimizedBytes:value.length,position,
        sourceUrl:`https://www.messika.com/media-cms/photo-${position}.jpg`,
        coverEligible:position===1,background:{publicationEligible:position===1}};
    });
    const archive={schemaVersion:'messika-local-acquisition-v1',mode:'local_only',
      summary:{crmWrites:0,storageUploads:0,telegramWrites:0},products:[{
        crmProductIds:[116],reference:'14659-WG',
        sourceUrl:'https://www.messika.com/it/bracciale-messika-14659-wg',
        mediaComplete:true,coverEligible:true,errors:[],archiveImages:images,
        product:{source:'messika_it',brand:'Messika',category:'bracelets',
          externalReference:'14659-WG',productName:'Messika Care(s)',
          images:images.map(({sourceUrl,position})=>({sourceUrl,position}))},
      }]};
    writeFileSync(input,JSON.stringify(archive));
    const run=()=>spawnSync(process.execPath,[new URL('./scripts/build-messika-uat-fixture.mjs',import.meta.url).pathname,input,output],{encoding:'utf8'});
    const result=run();assert.equal(result.status,0,result.stderr);
    const [product]=JSON.parse(readFileSync(output,'utf8'));
    assert.equal(product.imagePath,`qa/${images[1].optimizedSha256}.jpg`);
    assert.deepEqual(product.images.map(image=>image.path),[images[1],images[0]].map(image=>`qa/${image.optimizedSha256}.jpg`));
    assert.equal(product.priceMode,'on_request');
    rmSync(output);
    archive.products[0].archiveImages[0].optimizedBytes++;
    writeFileSync(input,JSON.stringify(archive));
    assert.notEqual(run().status,0);
    archive.products[0].archiveImages[0].optimizedBytes--;
    archive.products[0].archiveImages[0].optimizedPath=join(root,'outside.jpg');
    writeFileSync(input,JSON.stringify(archive));
    assert.notEqual(run().status,0);
  }finally{rmSync(root,{recursive:true,force:true});}
});
