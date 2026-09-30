#!/usr/bin/env node
// Read-only check against a private official-source archive. No prices or media
// are emitted, and the archive itself never enters the public Pages build.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {categoryOf,filterProducts,blankFilters,productTitle} from '../catalog-core.mjs';

const path=process.argv[2];
if(!path){console.error('Usage: node scripts/audit-messika-copy.mjs <verified-catalog.json>');process.exitCode=2;}
else{
  const archive=JSON.parse(await readFile(resolve(path),'utf8'));
  if(!Array.isArray(archive.products))throw Error('Expected verified products array');
  const untranslated=/\b(?:con|modello|rigido|rivière|choker|pendenti|cerchio|chevalier|girocollo|cravatta|cesellato|cesellata|antracite|rosa|arancione|bracelet|earrings|asymmetrical|stud|multiformi)\b|pavé/i;
  const failures=[];
  const products=[];
  for(const entry of archive.products){
    if(entry.product?.source!=='messika_it'||!entry.reference||!entry.product.productName){failures.push({reference:entry.reference||null,reason:'identity'});continue;}
    const product={id:entry.crmProductIds?.[0],brand:'Messika',category:entry.product.category,name:entry.product.productName,reference:entry.reference};
    const title=productTitle(product);
    if(!/[А-Яа-яЁё]/.test(title)||untranslated.test(title))failures.push({reference:entry.reference,reason:'untranslated_generic_term',title});
    products.push(product);
  }
  const searchTerms={rings:'кольцо',bracelets:'браслет',earrings:'серьги','necklaces-pendants':'колье'};
  for(const product of products){
    const term=searchTerms[categoryOf(product)];
    if(term&&!filterProducts(products,blankFilters(),term).some(found=>found.id===product.id))failures.push({reference:product.reference,reason:'russian_search'});
  }
  const categories=Object.fromEntries([...new Set(products.map(categoryOf))].map(category=>[category,products.filter(product=>categoryOf(product)===category).length]));
  console.log(JSON.stringify({checked:archive.products.length,categories,failures}));
  if(failures.length)process.exitCode=1;
}
