import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
export const files=['index.html','style.css','app.js','catalog-core.mjs','size-picker.mjs','storefront-api.mjs'];
await mkdir(new URL('dist/',root),{recursive:true});
const hashes={};
for(const file of files){
  const data=await readFile(new URL(file,root));
  if(/SUPABASE_SERVICE_ROLE_KEY|TELEGRAM_BOT_TOKEN|\/data\.json|Демо-результат|scenario:/.test(data.toString()))throw Error('Forbidden production content: '+file);
  await writeFile(new URL('dist/'+file,root),data);
  hashes[file]=createHash('sha256').update(data).digest('hex');
}
await writeFile(new URL('dist/asset-manifest.json',root),JSON.stringify(hashes,null,2)+'\n');
console.log('Built and inspected '+files.length+' public assets (no credentials, fixtures or demo transport).');
