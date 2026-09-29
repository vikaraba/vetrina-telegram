#!/usr/bin/env node
// Private UI fixture only. Never publish this output as a customer catalog.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [archiveArg,outputArg,excludedArg='']=process.argv.slice(2);
if(!archiveArg||!outputArg||(!excludedArg.match(/^(?:[1-9][0-9]*(?:,[1-9][0-9]*)*)?$/))){
  console.error('Usage: node scripts/build-messika-uat-fixture.mjs <verified-catalog.json> <private-output.json> [excluded-product-ids]');
  process.exitCode=2;
}else{
  const archivePath=resolve(archiveArg),outputPath=resolve(outputArg);
  if(archivePath===outputPath)throw Error('Output must differ from the source archive');
  const archive=JSON.parse(await readFile(archivePath,'utf8'));
  if(!Array.isArray(archive.products))throw Error('Expected verified products array');
  const excluded=new Set(excludedArg?excludedArg.split(',').map(Number):[]);
  const fixture=[];
  for(const entry of archive.products){
    const product=entry.product,id=entry.crmProductIds?.[0];
    if(excluded.has(id))continue;
    if(entry.crmProductIds?.length!==1||!Number.isSafeInteger(id)||id<=0
      ||product?.source!=='messika_it'||product.brand!=='Messika'
      ||product.category==='unknown'||!entry.allOfficialPhotosArchived
      ||!Array.isArray(entry.images)||!entry.images.length
      ||entry.images.some(image=>!/^[a-f0-9]{64}$/.test(image.optimizedSha256))){
      throw Error('UAT fixture source is incomplete or ambiguous');
    }
    // Mirror the guarded CRM transfer: a verified white image is the cover,
    // while the rest of the official gallery keeps its source order.
    const coverIndex=entry.images.findIndex(image=>image.coverEligible&&image.background?.publicationEligible);
    if(coverIndex<0)throw Error('UAT fixture has no verified white cover');
    const orderedImages=[entry.images[coverIndex],...entry.images.filter((_,index)=>index!==coverIndex)];
    const images=orderedImages.map(image=>({bucket:'product-images',path:`qa/${image.optimizedSha256}.jpg`}));
    fixture.push({id,brand:'Messika',name:product.productName,model:null,
      category:product.category,reference:entry.reference,sourceId:'messika_it',
      color:null,gender:null,priceMode:'on_request',priceAmount:null,
      priceCurrency:null,imageBucket:images[0].bucket,imagePath:images[0].path,
      images,sizes:[],description:null,telegramPostUrl:null});
  }
  if(new Set(fixture.map(product=>product.id)).size!==fixture.length)throw Error('Duplicate CRM identity in UAT fixture');
  await writeFile(outputPath,JSON.stringify(fixture,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({output:outputPath,products:fixture.length,excluded:[...excluded],mode:'local_fixture_only'}));
}
