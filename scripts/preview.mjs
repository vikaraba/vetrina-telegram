// Local-only contract UAT. Neither this server nor its injected transport is a Pages asset.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const fixture=process.env.MINIAPP_UAT_FIXTURE;
if(!fixture)throw Error('Set MINIAPP_UAT_FIXTURE to a read-only product DTO JSON fixture.');
const raw=JSON.parse(await readFile(fixture,'utf8'));
const products=raw.map(({id,name,brand,category,model,color,gender,reference,sourceId,priceAmount,priceCurrency,imageBucket,imagePath,images,sizes,description,telegramPostUrl})=>({id,name,brand,category,model,color,gender,reference,sourceId,priceAmount,priceCurrency,imageBucket,imagePath,images,sizes,description,telegramPostUrl}));
const setup=`
const originalFetch=window.fetch.bind(window);
const params=new URLSearchParams(location.search);
const data=await originalFetch('/__qa/data').then(r=>r.json());
const signed=params.get('tgWebAppStartParam')||'';
window.Telegram={WebApp:{initData:'LOCAL_CONTRACT_FIXTURE_NOT_A_SIGNATURE',initDataUnsafe:{start_param:signed},colorScheme:params.get('theme')||'light',ready(){},expand(){},BackButton:{onClick(){},show(){},hide(){}},onEvent(){},openTelegramLink(url){document.getElementById('qa-status').textContent='LOCAL CONTACT: '+decodeURIComponent(url);}}};
const status=document.createElement('output');status.id='qa-status';status.textContent='LOCAL CONTRACT UAT · no external requests/messages';status.style.cssText='display:block;font:12px monospace;padding:12px;background:#eee;color:#111';document.body.append(status);
window.fetch=async(url,options={})=>{
 const u=new URL(url,location.href);if(u.hostname!==location.hostname&&u.hostname!=='dbgcpgteuwkxqjgvppfp.supabase.co')throw Error('Blocked by UAT');
 const action=u.searchParams.get('action'),body=options.body?JSON.parse(options.body):{};
 const answer=(value,code=200)=>new Response(JSON.stringify(value),{status:code,headers:{'Content-Type':'application/json'}});
 status.textContent='LOCAL '+action+' '+(body.interactionName||body.size||u.searchParams.get('id')||'');
 if(action==='catalog'){
   if(signed&&u.searchParams.get('explore')!=='1')return answer({error:'explore required'},400);
   const offset=Number(u.searchParams.get('offset')),limit=Number(u.searchParams.get('limit'));
   return answer({total:data.length,items:data.slice(offset,offset+limit).map(({images,sizes,description,...p})=>({...p,sizeCount:sizes.length}))});
 }
 if(action==='product'){
   const id=Number(u.searchParams.get('id'));
   if(signed&&signed!=='product_'+id&&u.searchParams.get('explore')!=='1')return answer({error:'explore required'},400);
   const p=data.find(x=>x.id===id);return p?answer(p):answer({},404);
 }
 if(action==='size-interest')return answer({status:params.get('outcome')||'available',checkId:'00000000-0000-4000-8000-000000000001'},202);
 if(action==='size-status')return answer({status:'unknown'});
 if(action==='interaction')return answer({ok:true});
 throw Error('Unmocked UAT request');
};
await import('/vetrina-telegram/app.js?v=20260926-brand-home');
`;
const assets=new Set(['index.html','app.js','style.css','catalog-core.mjs','size-picker.mjs','storefront-api.mjs']);
http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' https://dbgcpgteuwkxqjgvppfp.supabase.co; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'none'");
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 const path=new URL(req.url,'http://localhost').pathname;
 try{
   if(path==='/__qa/data'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(products));return;}
   if(path==='/__qa/setup.js'){res.setHeader('Content-Type','text/javascript');res.end(setup);return;}
   const name=path.replace(/^\/vetrina-telegram\//,'')||'index.html';
   if(!assets.has(name)){res.writeHead(404);res.end();return;}
   let content=await readFile(new URL(name,root),'utf8');
   if(name==='index.html')content=content.replace('<script src="https://telegram.org/js/telegram-web-app.js"></script>','').replace('src="./app.js?v=20260926-brand-home"','src="/__qa/setup.js"');
   res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':'text/javascript');res.end(content);
 }catch{res.writeHead(500);res.end('Local UAT failed');}
}).listen(43135,'127.0.0.1',()=>console.log('Local contract UAT: http://127.0.0.1:43135/vetrina-telegram/'));
