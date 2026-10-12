import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
export const files=['index.html','ask.html','style.css','discovery.css','app.js','catalog-core.mjs','discovery-core.mjs','discovery-ui.mjs','size-picker.mjs','storefront-api.mjs'];
const target=process.env.MINIAPP_TARGET||'production';
if(!['production','staging'].includes(target))throw Error('Unsupported MINIAPP_TARGET');
const directory=target==='staging'?'dist-staging/':'dist/';
const productionApi='https://dbgcpgteuwkxqjgvppfp.supabase.co/functions/v1/telegram-storefront';
const stagingApi='https://zwhdxuiuhtxugvhzopjo.supabase.co/functions/v1/telegram-storefront';
await mkdir(new URL(directory,root),{recursive:true});
const hashes={};
for(const file of files){
  let data=await readFile(new URL(file,root));
  if(target==='staging'&&file==='storefront-api.mjs'){
    const source=data.toString();
    if(source.split(productionApi).length!==2)throw Error('Production API contract changed; staging build refused');
    data=Buffer.from(source.replace(productionApi,stagingApi));
  }
  if(/SUPABASE_SERVICE_ROLE_KEY|TELEGRAM_BOT_TOKEN|\/data\.json|Демо-результат|scenario:/.test(data.toString()))throw Error('Forbidden public content: '+file);
  await writeFile(new URL(directory+file,root),data);
  hashes[file]=createHash('sha256').update(data).digest('hex');
}
await writeFile(new URL(directory+'asset-manifest.json',root),JSON.stringify(hashes,null,2)+'\n');
console.log('Built and inspected '+files.length+' '+target+' assets (no credentials, fixtures or demo transport).');
