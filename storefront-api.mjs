// Existing authenticated Edge contract. Never persist or put initData in a URL.
export const API_BASE='https://dbgcpgteuwkxqjgvppfp.supabase.co/functions/v1/telegram-storefront';
export const MINI_APP_URL='https://t.me/aerofeevaBot/katalog';
export function randomUuid(){
  if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
  const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
  const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
  return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join('-');
}
export function requestedProductId(tg,search=''){
  const raw=String(tg?.initDataUnsafe?.start_param||new URLSearchParams(search).get('tgWebAppStartParam')||'');
  const match=/^product_([1-9][0-9]*)$/.exec(raw),id=match?Number(match[1]):NaN;
  return Number.isSafeInteger(id)?id:null;
}
export function clientContext(tg,pageSessionId){
  const s=globalThis.screen||{},nav=globalThis.navigator||{};
  return {schema_version:'telegram-webapp-client-v1',captured_at:new Date().toISOString(),page_session_id:pageSessionId,trust:'client_reported',
    telegram_web_app:{platform:tg?.platform??null,version:tg?.version??null,color_scheme:tg?.colorScheme??null,theme_params:tg?.themeParams??null,
      viewport_height:tg?.viewportHeight??null,viewport_stable_height:tg?.viewportStableHeight??null,is_active:tg?.isActive??null,is_expanded:tg?.isExpanded??null,is_fullscreen:tg?.isFullscreen??null,is_orientation_locked:tg?.isOrientationLocked??null,is_closing_confirmation_enabled:tg?.isClosingConfirmationEnabled??null,is_vertical_swipes_enabled:tg?.isVerticalSwipesEnabled??null,safe_area_inset:tg?.safeAreaInset??null,content_safe_area_inset:tg?.contentSafeAreaInset??null},
    runtime:{language:nav.language??null,languages:Array.from(nav.languages||[]),time_zone:Intl.DateTimeFormat().resolvedOptions().timeZone??null,user_agent:nav.userAgent??null,screen_width:s.width??null,screen_height:s.height??null,device_pixel_ratio:globalThis.devicePixelRatio??null}};
}
export class StorefrontError extends Error{
  constructor(status){super(status===401?'Сессия истекла. Закройте каталог и откройте его снова в Telegram.':status===404?'Модель сейчас недоступна. Выберите другой товар.':status===409?'Наличие изменилось. Уточните размер у Анастасии.':'Не удалось загрузить данные. Попробуйте ещё раз.');this.status=status;}
}
export function normalizeProduct(raw){
  // Deliberately exclude internal/source prices returned by legacy API versions.
  const {id,name,brand,category,model,color,gender,reference,sourceId,priceAmount,priceCurrency,imageBucket,imagePath,imageUrl,imageUrls,images,sizes,description,sizeCount}=raw;
  return {id:Number(id),name,brand,category,model,color,gender,reference,sourceId,priceAmount:priceAmount==null?null:Number(priceAmount),priceCurrency,imageBucket,imagePath,imageUrl,imageUrls,images,sizes,description,sizeCount};
}
export function createStorefrontClient({tg,fetchImpl=globalThis.fetch,timeoutMs=12000,sleep=ms=>new Promise(r=>setTimeout(r,ms)),pollAttempts=20}={}){
  const pageSessionId=randomUuid();let explored=false;
  const pending=new Map();
  async function api(action,params={},body,timeout=timeoutMs){
    if(!tg?.initData)throw new StorefrontError(401);
    const url=new URL(API_BASE);url.searchParams.set('action',action);
    for(const[k,v]of Object.entries(params))if(v!=null)url.searchParams.set(k,String(v));
    if(explored)url.searchParams.set('explore','1');
    const controller=new AbortController();let timer;
    try{
      return await Promise.race([
        (async()=>{const response=await fetchImpl(url,{method:body?'POST':'GET',cache:'no-store',signal:controller.signal,
          headers:{'Content-Type':'application/json','x-telegram-init-data':tg.initData,'x-telegram-client-context':JSON.stringify(clientContext(tg,pageSessionId))},
          ...(body?{body:JSON.stringify(body),keepalive:action==='interaction'}:{})});
          if(!response.ok)throw new StorefrontError(response.status);
          return await response.json();
        })(),
        new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new StorefrontError(0));},timeout);})
      ]);
    }catch(error){if(error instanceof StorefrontError)throw error;throw new StorefrontError(0);}
    finally{clearTimeout(timer);}
  }
  return {
    explore(){explored=true;},
    async catalog(){
      const items=new Map();let offset=0,total=Infinity;
      while(offset<total){
        const page=await api('catalog',{limit:100,offset});
        if(!Array.isArray(page.items)||!Number.isSafeInteger(page.total)||page.total<0)throw new StorefrontError(0);
        total=page.total;
        for(const p of page.items)items.set(Number(p.id),normalizeProduct(p));
        if(!page.items.length&&offset<total)throw new StorefrontError(0);
        offset+=page.items.length;
        // Fail explicitly on an inconsistent or unbounded response; never silently truncate.
        if(offset>10000)throw new StorefrontError(0);
      }
      if(items.size!==total)throw new StorefrontError(0);
      return [...items.values()];
    },
    async product(id){return normalizeProduct(await api('product',{id}));},
    track(name,productId,details={}){
      return api('interaction',{}, {productId,interactionName:name,eventId:randomUuid(),details},4000).catch(()=>null);
    },
    async checkSize(productId,size,{isCurrent=()=>true}={}){
      const deadline=Date.now()+45000;
      const checkApi=(action,params,body)=>api(action,params,body,Math.max(1,Math.min(timeoutMs,deadline-Date.now())));
      const key=productId+':'+size;
      // Reuse the same event/check after a timeout. A retry must not duplicate intent.
      let request=pending.get(key);
      if(!request){request={eventId:randomUuid(),checkId:null};pending.set(key,request);}
      let result;
      if(request.checkId)result=await checkApi('size-status',{checkId:request.checkId});
      else{
        result=await checkApi('size-interest',{}, {productId,size,eventId:request.eventId});
        request.checkId=result.checkId;
      }
      const terminal=new Set(['available','unavailable','unknown','failed']);
      for(let attempt=0;attempt<pollAttempts&&!terminal.has(result.status);attempt++){
        if(!isCurrent()||Date.now()>=deadline)return 'unknown';
        if(!request.checkId)throw new StorefrontError(0);
        await sleep(1500);
        if(!isCurrent()||Date.now()>=deadline)return 'unknown';
        result=await checkApi('size-status',{checkId:request.checkId});
      }
      if(terminal.has(result.status))pending.delete(key);
      return result.status==='failed'?'error':terminal.has(result.status)?result.status:'unknown';
    }
  };
}
export function contactUrl(product,size){
  const message='Анастасия, здравствуйте!\n\nМеня интересует '+product.brand+' '+product.name+
    (product.reference?' (артикул '+product.reference+')':'')+(product.color?', цвет '+product.color:'')+'.'+
    (size?'\nРазмер '+(product.category==='shoes'?'EU ':'')+size+'.':'')+
    '\n\nПодскажите, пожалуйста, актуальное наличие, итоговую стоимость и условия доставки. Спасибо!';
  return 'https://t.me/buyer_rome?text='+encodeURIComponent(message);
}
export function openContact(client,tg,product,size,navigate=url=>{globalThis.location.href=url;}){
  // Dispatch telemetry without awaiting it: a slow analytics API cannot block buying.
  void client.track('contact_anastasia_opened',product.id,{size:size||null});
  const url=contactUrl(product,size);
  if(tg?.openTelegramLink)tg.openTelegramLink(url);else navigate(url);
}
