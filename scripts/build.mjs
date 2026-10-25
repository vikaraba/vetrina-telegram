import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
export const files=['index.html','ask.html','style.css','app.js','catalog-core.mjs','size-picker.mjs','storefront-api.mjs','public-origins.mjs','product-image.mjs'];
const refs=Object.freeze({production:'dbgcpgteuwkxqjgvppfp',staging:'zwhdxuiuhtxugvhzopjo'});
const target=process.env.MINIAPP_BUILD_TARGET||'production';
if(!Object.hasOwn(refs,target))throw Error('MINIAPP_BUILD_TARGET must be production or staging');
await mkdir(new URL('dist/',root),{recursive:true});
const hashes={};
for(const file of files){
  let data=await readFile(new URL(file,root));
  if(file==='public-origins.mjs'||file==='ask.html'){
    const source=data.toString();
    if(source.split(refs.production).length!==2||source.includes(refs.staging))throw Error('Unexpected public origin source: '+file);
    if(target==='staging')data=Buffer.from(source.replace(refs.production,refs.staging));
  }
  if(/SUPABASE_SERVICE_ROLE_KEY|TELEGRAM_BOT_TOKEN|\/data\.json|Демо-результат|scenario:/.test(data.toString()))throw Error('Forbidden production content: '+file);
  await writeFile(new URL('dist/'+file,root),data);
  hashes[file]=createHash('sha256').update(data).digest('hex');
}
await writeFile(new URL('dist/asset-manifest.json',root),JSON.stringify(hashes,null,2)+'\n');
console.log('Built and inspected '+files.length+' public assets for '+target+' (no credentials, fixtures or demo transport).');
