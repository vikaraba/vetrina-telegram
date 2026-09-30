// Local-only contract UAT. Neither this server nor its injected transport is a Pages asset.
import http from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.env.MINIAPP_UAT_BUILD?pathToFileURL(resolve(process.env.MINIAPP_UAT_BUILD)+'/'):new URL('../',import.meta.url);
const port=Number(process.env.MINIAPP_UAT_PORT||43135);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid local UAT port');
const fixture=process.env.MINIAPP_UAT_FIXTURE;
if(!fixture)throw Error('Set MINIAPP_UAT_FIXTURE to a read-only product DTO JSON fixture.');
const mediaRoots=await Promise.all([process.env.MINIAPP_UAT_MEDIA_ROOT,
  ...String(process.env.MINIAPP_UAT_EXTRA_MEDIA_ROOTS||'').split(',')]
  .filter(Boolean).map(path=>realpath(resolve(path))));
const fixturePaths=[fixture,...String(process.env.MINIAPP_UAT_EXTRA_FIXTURES||'').split(',').filter(Boolean)];
const sources=await Promise.all(fixturePaths.map(async path=>JSON.parse(await readFile(resolve(path),'utf8'))));
if(sources.some(source=>!Array.isArray(source)))throw Error('Every UAT fixture must be a product array');
const raw=sources.flat();
if(new Set(raw.map(product=>product.id)).size!==raw.length)throw Error('Duplicate product ID across UAT fixtures');
const products=raw.map(({id,name,brand,category,model,color,gender,reference,sourceId,priceMode,priceAmount,priceCurrency,imageBucket,imagePath,images,sizes,description,telegramPostUrl})=>({id,name,brand,category,model,color,gender,reference,sourceId,priceMode,priceAmount,priceCurrency,imageBucket,imagePath,images,sizes,description,telegramPostUrl}));
// Validate every local QA image before opening the preview, not just the ones
// visible on the first page. Public CRM paths are intentionally left alone.
const qaMedia=new Set(products.flatMap(product=>[product.imagePath,...(product.images||[]).map(image=>image?.path)]).filter(path=>typeof path==='string'&&path.startsWith('qa/')));
for(const path of qaMedia){
  const match=/^qa\/([a-f0-9]{64})[.]jpg$/.exec(path);
  if(!match)throw Error('Invalid QA image path: '+path);
  let bytes;
  for(const root of mediaRoots){
    try{bytes=await readFile(join(root,match[1]+'.jpg'));break;}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  if(!bytes)throw Error('Missing QA image: '+path);
  if(createHash('sha256').update(bytes).digest('hex')!==match[1])throw Error('QA image checksum mismatch: '+path);
}
const setup=`
const originalFetch=window.fetch.bind(window);
const params=new URLSearchParams(location.search);
let data=await originalFetch('/__qa/data').then(r=>r.json());
if(params.get('catalog')==='empty')data=[];
let catalogAttempts=0,telegramBack=()=>{};
const log=document.createElement('pre');log.id='qa-log';log.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:11px monospace;padding:12px';document.body.append(log);
const record=value=>{log.textContent+=JSON.stringify(value)+String.fromCharCode(10);};
const back=document.createElement('button');back.id='qa-back';back.textContent='Telegram Back · UAT';back.hidden=true;back.style.cssText='min-height:44px';back.onclick=()=>telegramBack();document.body.append(back);
const signed=params.get('tgWebAppStartParam')||'';
window.Telegram={WebApp:{initData:params.has('unauthenticated')?'':'LOCAL_CONTRACT_FIXTURE_NOT_A_SIGNATURE',initDataUnsafe:{start_param:signed},colorScheme:params.get('theme')||'light',ready(){},expand(){},BackButton:{onClick(fn){telegramBack=fn;},show(){back.hidden=false;},hide(){back.hidden=true;}},onEvent(){},openTelegramLink(url){record({contact:decodeURIComponent(url)});document.getElementById('qa-status').textContent='LOCAL CONTACT: '+decodeURIComponent(url);}}};
const status=document.createElement('output');status.id='qa-status';status.textContent='LOCAL CONTRACT UAT · no external requests/messages';status.style.cssText='display:block;font:12px monospace;padding:12px;background:#eee;color:#111;overflow-wrap:anywhere';document.body.append(status);
window.fetch=async(url,options={})=>{
 const u=new URL(url,location.href);if(u.hostname!==location.hostname&&u.hostname!=='dbgcpgteuwkxqjgvppfp.supabase.co')throw Error('Blocked by UAT');
 const action=u.searchParams.get('action'),body=options.body?JSON.parse(options.body):{};
 record({action,id:u.searchParams.get('id'),offset:u.searchParams.get('offset'),explore:u.searchParams.get('explore'),size:body.size||null,interaction:body.interactionName||null});
 const answer=(value,code=200)=>new Response(JSON.stringify(value),{status:code,headers:{'Content-Type':'application/json'}});
 status.textContent='LOCAL '+action+' '+(body.interactionName||body.size||u.searchParams.get('id')||'');
 if(action==='catalog'){
   catalogAttempts++;
   if(params.get('catalog')==='error'||(params.get('catalog')==='retry'&&catalogAttempts===1))return answer({},500);
   if(signed&&u.searchParams.get('explore')!=='1')return answer({error:'explore required'},400);
   const offset=Number(u.searchParams.get('offset')),limit=Number(u.searchParams.get('limit'));
   return answer({total:data.length,items:data.slice(offset,offset+limit).map(({images,sizes,description,...p})=>({...p,sizeCount:sizes.length}))});
 }
 if(action==='product'){
   if(params.get('detail')==='error')return answer({},500);
   const id=Number(u.searchParams.get('id'));
   if(signed&&signed!=='product_'+id&&u.searchParams.get('explore')!=='1')return answer({error:'explore required'},400);
   const p=data.find(x=>x.id===id);return p?answer(p):answer({},404);
 }
 if(action==='size-interest')return answer({status:params.get('outcome')||'available',checkId:'00000000-0000-4000-8000-000000000001'},202);
 if(action==='size-status')return answer({status:'unknown'});
 if(action==='interaction')return answer({ok:true});
 throw Error('Unmocked UAT request');
};
await import('/vetrina-telegram/app.js?v=20260930-compatible-filters');
`;
const assets=new Set(['index.html','app.js','style.css','catalog-core.mjs','size-picker.mjs','storefront-api.mjs']);
http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' https://dbgcpgteuwkxqjgvppfp.supabase.co; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'none'");
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 const path=new URL(req.url,'http://localhost').pathname;
 try{
   if(path.startsWith('/__qa/media/')){
     if(!mediaRoots.length){res.writeHead(404);res.end();return;}
     const match=/^\/__qa\/media\/qa\/([a-f0-9]{64})[.]jpg$/.exec(path);
     if(!match){res.writeHead(404);res.end();return;}
     let bytes;
     for(const root of mediaRoots){
       try{bytes=await readFile(join(root,match[1]+'.jpg'));break;}
       catch(error){if(error.code!=='ENOENT')throw error;}
     }
     if(!bytes){res.writeHead(404);res.end();return;}
     if(createHash('sha256').update(bytes).digest('hex')!==match[1])throw Error('Media fixture checksum mismatch');
     res.setHeader('Content-Type','image/jpeg');res.end(bytes);return;
   }
   if(path==='/__qa/data'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(products));return;}
   if(path==='/__qa/setup.js'){res.setHeader('Content-Type','text/javascript');res.end(setup);return;}
   const name=path.replace(/^\/vetrina-telegram\//,'')||'index.html';
   if(!assets.has(name)){res.writeHead(404);res.end();return;}
   let content=await readFile(new URL(name,root),'utf8');
   if(name==='index.html')content=content.replace('<script src="https://telegram.org/js/telegram-web-app.js"></script>','').replace('src="./app.js?v=20260930-compatible-filters"','src="/__qa/setup.js"');
   // Only QA fixture paths are served from local, hash-verified archives.
   // Existing public CRM media keep their real URL in mixed-brand UAT.
   if(name==='app.js'&&mediaRoots.length){
     const publicRoot="'https://dbgcpgteuwkxqjgvppfp.supabase.co/storage/v1/object/public/product-images/'";
     const source=publicRoot+'+escapeHtml(i.path';
     if(!content.includes(source))throw Error('UAT media override no longer matches the app');
     content=content.replace(source,"(i.path.startsWith('qa/')?'/__qa/media/':"+publicRoot+")+escapeHtml(i.path");
   }
   res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':'text/javascript');res.end(content);
 }catch{res.writeHead(500);res.end('Local UAT failed');}
}).listen(port,'127.0.0.1',()=>console.log('Local staging UAT: http://127.0.0.1:'+port+'/vetrina-telegram/ · assets: '+root.pathname+' · verified local images: '+qaMedia.size));
