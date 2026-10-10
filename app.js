import {createStorefrontClient,requestedProductId,requestedPublicationId,openContact,customerPriceLabel,MINI_APP_URL,API_BASE,StorefrontError} from './storefront-api.mjs?v=20261010-discovery';
import {mountDiscovery,discoveryState} from './discovery-ui.mjs?v=20261010-discovery';
const tg=window.Telegram?.WebApp;
tg?.ready();tg?.expand();
const client=createStorefrontClient({tg});
import {sizeValues,createSizeWheel,createLatestCheck} from './size-picker.mjs';
import {productTitle,jewelryMaterial,categoryOf,watchReferenceLabel,colorLabel} from './catalog-core.mjs?v=20261010-discovery';
const $=s=>document.querySelector(s);
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',filter:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="17" r="2" fill="currentColor"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',back:'<path d="M19 12H5m5-5-5 5 5 5"/>',photo:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 17 5-5 4 3 3-4 5 6"/><circle cx="8" cy="9" r="1"/>',zoom:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5M7 10h6m-3-3v6"/>',bag:'<path d="M5 7h14l1 14H4L5 7Zm3 0V5a4 4 0 0 1 8 0v2"/>',chat:'<path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2 1.5-5A8 8 0 1 1 20 11.5Z"/><path d="M7 10h9M7 14h6"/>',check:'<path d="m5 12 4 4L19 6"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',left:'<path d="m15 6-6 6 6 6"/>',right:'<path d="m9 6 6 6-6 6"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[n]||paths.info}</svg>`;
const state={page:'catalog',products:[],discovery:discoveryState(),product:null,imageIndex:0,size:null,check:'idle',navigation:0,catalogLoaded:false,explored:false,theme:'light',scroll:0,source:'catalog'};
const money=customerPriceLabel;
const title=productTitle;
const color=p=>colorLabel(p.color)||'Цвет уточняется';
const material=p=>jewelryMaterial(p)||({'Tela Monogram':'Канва Monogram','Altri pellami':'Кожа','AUTRES TOILES':'Канва','Pelle Monogram Empreinte':'Кожа Monogram Empreinte','Tela Damier Azur':'Канва Damier Azur','Fashion Leather':'Кожа','Monogram Reverse Canvas':'Канва Monogram Reverse'}[p.description?.split(' · ')[0]]||p.description?.split(' · ')[0]||'Уточним в личном сообщении');
const gender=p=>p.gender==='men'?'Мужская модель':p.gender==='women'?'Женская модель':p.gender==='unisex'?'Унисекс':'Для кого — уточняется';
const storageOrigin=new URL(API_BASE).origin;
const imageUrl=i=>{if(i?.url){try{const u=new URL(i.url);const publicPhoto=u.pathname.startsWith('/storage/v1/object/public/product-images/');const privatePhoto=u.pathname.startsWith('/storage/v1/object/sign/product-imports/')&&u.searchParams.has('token');return u.origin===storageOrigin&&(publicPhoto||privatePhoto)?escapeHtml(u.href):'';}catch{return '';}}return i?.bucket==='product-images'&&i?.path?storageOrigin+'/storage/v1/object/public/product-images/'+escapeHtml(i.path.split('/').map(encodeURIComponent).join('/')):'';};
const images=p=>[...new Map([{bucket:p.imageBucket,path:p.imagePath},...(p.images||[]),...(p.imageUrls||[]).map(url=>({url})),{url:p.imageUrl}].filter(i=>(i.path||i.url)&&imageUrl(i)).map(i=>[imageUrl(i),i])).values()];
const cover=p=>imageUrl(images(p)[0]);
function event(type,extra={}){const map={gallery_image_viewed:'gallery_image_viewed',image_zoom_opened:'gallery_image_viewed',catalog_search:'catalog_search_submitted',catalog_filter:'catalog_filter_changed',catalog_explored:'catalog_search_opened'};const name=map[type];if(name)void client.track(name,state.product?.id||null,{size:state.size,source:state.source,start_param:tg?.initDataUnsafe?.start_param||null,timestamp:new Date().toISOString(),...(type==='image_zoom_opened'?{mode:'zoom'}:{}),...extra});}
function announce(text){$('#announcement').textContent=text;}
function setTheme(theme){state.theme=theme;document.documentElement.dataset.theme=theme;$('#theme').innerHTML=icon(theme==='light'?'moon':'sun');$('#theme').setAttribute('aria-label',theme==='light'?'Переключить на тёмную тему':'Переключить на светлую тему');document.querySelector('meta[name=theme-color]').content=theme==='light'?'#f8f7f3':'#14211b';}
$('#theme').onclick=()=>setTheme(state.theme==='light'?'dark':'light');setTheme(tg?.colorScheme==='dark'?'dark':'light');
tg?.onEvent?.('themeChanged',()=>setTheme(tg.colorScheme==='dark'?'dark':'light'));
tg?.BackButton?.onClick?.(()=>{const open=[...document.querySelectorAll('dialog[open]')].at(-1);if(open)open.close();else if(state.product)showCatalog({restore:true});else if(state.page==='catalog')showHome();});
function navigationUrl(id){const url=new URL(location.href);if(id)url.searchParams.set('product',id);else url.searchParams.delete('product');return url.pathname+url.search+url.hash;}
function errorScreen(error,retry){
  const expired=error?.status===401,unavailable=error?.status===404;
  document.body.classList.remove('has-product');
  $('#app').innerHTML=`<div class="empty-state" role="alert"><h2>${expired?'Откройте каталог в Telegram':unavailable?'Модель недоступна':'Не удалось загрузить каталог'}</h2><p>${escapeHtml(error?.message||'Проверьте соединение и попробуйте ещё раз.')}</p><button id="retry-load" class="primary">${expired?'Открыть в Telegram':unavailable?'Смотреть другие модели':'Попробовать снова'}</button>${unavailable?'':'<button id="error-catalog" class="text-button">К брендам</button>'}</div>`;
  $('#retry-load').onclick=expired?()=>{if(tg?.openTelegramLink)tg.openTelegramLink(MINI_APP_URL);else location.href=MINI_APP_URL;}:unavailable?()=>showHome():retry;
  if(!unavailable)$('#error-catalog').onclick=()=>showHome();
}


let discovery=null;

let catalogPromise=null;
async function loadCatalog(navigation,retry){
  if(state.catalogLoaded)return true;
  $('#app').innerHTML='<div class="loading-state" role="status"><span class="spinner"></span>Загружаем каталог…</div>';
  try{
    catalogPromise??=client.catalog().finally(()=>{catalogPromise=null;});
    const products=await catalogPromise;
    if(navigation!==state.navigation)return false;
    state.products=products;state.catalogLoaded=true;return true;
  }catch(error){if(navigation===state.navigation)errorScreen(error,retry);return false;}
}
function saveCatalogHistory(){
  if(state.page!=='catalog'||!history.state?.catalog)return;
  history.replaceState({...history.state,discovery:state.discovery,scroll:window.scrollY},'',location.href);
}
function showHome({push=true}={}){return showCatalog({reset:true,push});}
async function showCatalog({reset=false,restore=false,push=true,brand=null}={}){
  closeOverlays();discovery?.destroy();discovery=null;sizeCheck.cancel();
  const navigation=++state.navigation;state.page='catalog';state.product=null;
  state.explored=true;state.source='catalog';state.size=null;state.check='idle';client.explore();tg?.BackButton?.hide?.();
  document.body.classList.remove('has-product');
  if(!await loadCatalog(navigation,()=>showCatalog({reset,restore,push,brand})))return;
  if(reset||!state.discovery){state.discovery=discoveryState();state.scroll=0;}
  if(brand){state.discovery=discoveryState();state.discovery.filters.brand=[brand];}
  if(push)history.pushState({catalog:true,explored:true},'',navigationUrl());
  discovery=mountDiscovery({root:$('#app'),products:state.products,snapshot:state.discovery,
    cover,priceLabel:money,track:event,
    onChange:snapshot=>{state.discovery=snapshot;saveCatalogHistory();},
    onProduct:id=>{state.scroll=window.scrollY;state.catalogFocus=id;saveCatalogHistory();showProduct(id);}});
  window.scrollTo({top:restore?state.scroll:0,behavior:'instant'});saveCatalogHistory();
  if(restore&&state.catalogFocus)document.querySelector('[data-product="'+state.catalogFocus+'"]')?.focus({preventScroll:true});
}
async function showProduct(id,{push=true,publicationId=null}={}){
  saveCatalogHistory();discovery?.destroy();discovery=null;state.page='product';
  closeOverlays();sizeCheck.cancel();const navigation=++state.navigation;
  state.product=null;document.body.classList.remove('has-product');
  $('#app').innerHTML='<div class="loading-state" role="status"><span class="spinner"></span>Загружаем модель…</div>';
  let p;try{p=publicationId?await client.productByPublication(publicationId):await client.product(id);}catch(error){if(navigation===state.navigation)errorScreen(error,()=>showProduct(id,{push,publicationId}));return;}
  if(navigation!==state.navigation)return;
  state.product=p;state.imageIndex=0;state.size=null;state.check='idle';document.body.classList.add('has-product');tg?.BackButton?.show?.();
  if(push)history.pushState({product:p.id,publicationId:publicationId||null,explored:state.explored},'',navigationUrl(p.id));
  event('product_opened');
  const photos=images(p);const on=categoryOf(p)==='shoes';const hasSizes=Boolean(p.sizes?.length);const subtitle=on?gender(p)+' · '+color(p):[p.color?color(p):null,watchReferenceLabel(p)].filter(Boolean).join(' · ');const dimensions=p.description?.match(/\d+(?:[.,]\d+)?\s*x\s*\d+(?:[.,]\d+)?\s*x\s*\d+(?:[.,]\d+)?\s*cm/i)?.[0]?.replace(/cm/i,'см').replaceAll('x','×');
  $('#app').innerHTML=`<section class="detail-page"><nav class="detail-nav" aria-label="Навигация по товару"><button class="back-button" id="back-catalog" aria-label="Вернуться в каталог">${icon('back')}<span>В каталог</span></button><button class="browse-button" id="explore" aria-label="Посмотреть другие модели ${escapeHtml(p.brand)}"><span>Другие модели</span>${icon('arrow')}</button></nav><div class="product-layout"><div class="gallery"><div class="gallery-main"><button class="gallery-open" id="gallery-open" aria-label="Увеличить фото 1"><img id="hero-image" src="${imageUrl(photos[0])}" alt="${escapeHtml(title(p))}, фото 1" width="960" height="900" fetchpriority="high" decoding="async"></button><span class="gallery-counter" id="gallery-counter">1 / ${photos.length}</span>${photos.length>1?`<button id="gallery-prev" class="icon-button gallery-arrow prev" aria-label="Предыдущее фото">${icon('left')}</button><button id="gallery-next" class="icon-button gallery-arrow next" aria-label="Следующее фото">${icon('right')}</button>`:''}<button class="gallery-zoom" id="gallery-zoom">${icon('zoom')}Рассмотреть ближе</button></div><div class="thumbnail-row" aria-label="Фотографии модели">${photos.map((img,i)=>`<button class="thumbnail" data-image="${i}" aria-label="Показать фото ${i+1}" aria-pressed="${i===0}"><img src="${imageUrl(img)}" alt="" width="74" height="74" loading="lazy" decoding="async"></button>`).join('')}</div><p class="gallery-help">${icon('photo')}Все фотографии относятся к выбранной модели.</p></div><div class="product-info"><p class="detail-brand">${escapeHtml(p.brand)}</p><h1>${escapeHtml(title(p))}</h1>${subtitle?'<p class="detail-subtitle">'+escapeHtml(subtitle)+'</p>':''}<p class="detail-price">${money(p)}</p><p class="price-note">Доставка рассчитывается отдельно</p>${hasSizes?`<button class="size-trigger" id="size-open" aria-haspopup="dialog" aria-controls="size-dialog"><span id="selected-size">Выбрать размер</span><span class="size-trigger-end">${on?'EU':''} ${icon('right')}</span></button>`:''}<div id="availability" aria-live="polite"></div><div class="detail-actions"><button class="primary" id="detail-contact">${icon('chat')}Заказать</button></div><details class="details-disclosure"><summary>О модели</summary><dl><div><dt>Артикул</dt><dd>${escapeHtml(p.reference)}</dd></div>${p.color?'<div><dt>Цвет</dt><dd>'+escapeHtml(color(p))+'</dd></div>':''}${on?`<div><dt>Для кого</dt><dd>${gender(p)}</dd></div>`:`<div><dt>Материал</dt><dd>${escapeHtml(material(p))}</dd></div>${dimensions?`<div><dt>Размеры</dt><dd>${escapeHtml(dimensions)}</dd></div>`:''}`}</dl></details><details class="details-disclosure"><summary>Как заказать и получить</summary><p>Напишите Анастасии. Она уточнит наличие, подтвердит стоимость и согласует доставку. Товар приобретается после подтверждения вашего запроса.</p></details></div></div></section><div class="mobile-dock"><span class="dock-price">${money(p)}<span class="dock-caption">Доставка отдельно</span></span><button class="primary" id="dock-contact">${icon('chat')}Заказать</button></div>`;
  $('#back-catalog').onclick=()=>showCatalog({restore:true});$('#explore').onclick=()=>{event('catalog_explored');showCatalog({reset:true,brand:p.brand});};
  $('#detail-contact').onclick=contact;$('#dock-contact').onclick=contact;$('#gallery-open').onclick=openZoom;$('#gallery-zoom').onclick=openZoom;
  if($('#gallery-next'))$('#gallery-next').onclick=()=>setImage(state.imageIndex+1);if($('#gallery-prev'))$('#gallery-prev').onclick=()=>setImage(state.imageIndex-1);
  document.querySelectorAll('[data-image]').forEach(b=>b.onclick=()=>setImage(Number(b.dataset.image)));
  const sizeTrigger=$('#size-open');
  if(sizeTrigger){
    if(on){
      sizeTrigger.classList.add('size-trigger--verify');
      sizeTrigger.setAttribute('aria-label','Проверить доступные размеры');
      $('#selected-size').textContent='Проверить размеры';
      $('.price-note').before(sizeTrigger);
    }
    sizeTrigger.onclick=openSizePicker;
  }
  updateOrderActions();
  let touchX=null;$('#gallery-open').addEventListener('touchstart',e=>{touchX=e.touches[0].clientX;},{passive:true});$('#gallery-open').addEventListener('touchend',e=>{if(touchX!==null&&Math.abs(e.changedTouches[0].clientX-touchX)>45)setImage(state.imageIndex+(e.changedTouches[0].clientX<touchX?1:-1));touchX=null;},{passive:true});
  window.scrollTo({top:0,behavior:'instant'});
}
function setImage(index){if(!state.product)return;const gallery=images(state.product);state.imageIndex=(index+gallery.length)%gallery.length;const n=state.imageIndex+1;$('#hero-image').src=imageUrl(gallery[state.imageIndex]);$('#hero-image').alt=`${title(state.product)}, фото ${n}`;$('#gallery-open').setAttribute('aria-label',`Увеличить фото ${n}`);$('#gallery-counter').textContent=`${n} / ${gallery.length}`;document.querySelectorAll('[data-image]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.image)===state.imageIndex));event('gallery_image_viewed',{imageIndex:n});}

const sizeCheck=createLatestCheck();
let pickerProductId=null;
function closeOverlays(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function sizeLabel(value){return (categoryOf(state.product)==='shoes'?'EU ':'')+value;}
const wheel=createSizeWheel({
  list:$('#size-wheel'),
  onChange(value){
    $('#size-confirm').disabled=!value;
    $('#size-confirm').textContent=value?`Проверить · ${sizeLabel(value)}`:'Выберите размер';
  },
  onConfirm:confirmSize
});
function openSizePicker(){
  const p=state.product,values=sizeValues(p);if(!p||!values.length)return;
  pickerProductId=p.id;
  $('#size-context').innerHTML=`<img src="${cover(p)}" alt="" width="64" height="64"><div><strong>${escapeHtml(title(p))}</strong><span>${escapeHtml(p.brand)} · ${money(p)}</span></div>`;
  $('#size-unit').textContent=categoryOf(p)==='shoes'?'EU':'Размер';
  $('#size-wheel').innerHTML='<div id="wheel-option-0" role="option" aria-disabled="true" aria-selected="false" class="wheel-option wheel-placeholder">Выберите</div>'+values.map((value,i)=>`<div id="wheel-option-${i+1}" class="wheel-option" role="option" aria-selected="false" data-value="${escapeHtml(value)}">${escapeHtml(value)}</div>`).join('');
  $('#size-dialog').showModal();wheel.open(state.size);
  event('size_picker_opened');
}
function confirmSize(){
  const value=wheel.settle();
  if(!value||!state.product||state.product.id!==pickerProductId||!sizeValues(state.product).includes(value))return;
  state.size=value;
  $('#size-dialog').close();
  $('#selected-size').textContent='Размер '+sizeLabel(value);
  event('size_selected');
  checkSize();
}
$('#size-confirm').onclick=confirmSize;
$('#size-up').onclick=()=>wheel.move(-1);$('#size-down').onclick=()=>wheel.move(1);
$('#size-dialog').addEventListener('close',()=>{wheel.cancel();pickerProductId=null;});
function updateOrderActions(){
  const label=state.check==='pending'?'Проверяем…':'Заказать';
  for(const id of ['detail-contact','dock-contact']){
    const button=document.getElementById(id);if(!button)continue;
    button.textContent=label;button.disabled=state.check==='pending';
  }
}
async function checkSize(){
  if(!state.product||!state.size)return;
  const request={productId:state.product.id,size:state.size};
  const sourceId=state.product.sourceId;
  await sizeCheck.run(request,current=>sourceId==='on_running_it'?client.checkSize(current.productId,current.size,{isCurrent:()=>state.product?.id===current.productId&&state.size===current.size}):Promise.resolve('unknown'),result=>{
    if(state.product?.id!==result.productId||state.size!==result.size)return;
    state.check=result.phase;
    event(result.phase==='pending'?'size_check_requested':'size_check_result',{outcome:result.phase});
    renderAvailability();updateOrderActions();
  });
}
function renderAvailability(){
  const el=$('#availability');if(!el)return;
  const s=escapeHtml(sizeLabel(state.size));
  const texts={
    pending:['Проверяем '+s,'Проверяем фактическое наличие. Обычно это занимает несколько секунд.'],
    available:[s+' — доступен','Наличие подтверждено проверкой. Напишите, чтобы согласовать заказ.'],
    unavailable:[s+' — недоступен','Выберите другой размер или уточните у Анастасии.'],
    unknown:[s+' — нужно уточнить','Автоматическая проверка не завершена. Можно уточнить в чате.'],
    error:['Не удалось проверить '+s,'Попробуйте ещё раз или уточните в чате.']
  };const t=texts[state.check];
  el.innerHTML=t?`<div class="availability ${state.check==='available'?'success':state.check==='error'?'error':''}">${state.check==='pending'?'<span class="spinner"></span>':icon(state.check==='available'?'check':'info')}<div><strong>${t[0]}</strong><small>${t[1]}</small>${state.check==='error'?'<button class="text-button" id="retry-check">Попробовать снова</button>':''}</div></div>`:'';
  if($('#retry-check'))$('#retry-check').onclick=checkSize;
}
function contact(){const p=state.product;if(!p||state.check==='pending')return;if(sizeValues(p).length&&!state.size){openSizePicker();return;}openContact(client,tg,{...p,name:title(p)},state.size);}
let zoomScale=1,pan={x:0,y:0},pointers=new Map(),pinchBase=null;
function applyZoom(){zoomScale=Math.max(1,Math.min(3,zoomScale));const box=$('#zoom-stage').getBoundingClientRect();pan.x=Math.max(-box.width*(zoomScale-1)/2,Math.min(box.width*(zoomScale-1)/2,pan.x));pan.y=Math.max(-box.height*(zoomScale-1)/2,Math.min(box.height*(zoomScale-1)/2,pan.y));$('#zoom-image').style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoomScale})`;$('#zoom-reset').textContent=`${Math.round(zoomScale*100)}%`;$('#zoom-minus').disabled=zoomScale<=1;$('#zoom-plus').disabled=zoomScale>=3;}
function openZoom(){const p=state.product;$('#zoom-image').src=imageUrl(images(p)[state.imageIndex]);$('#zoom-image').alt=`${title(p)}, фото ${state.imageIndex+1}`;$('#zoom-caption').textContent=`${title(p)} · ${state.imageIndex+1} / ${images(p).length}`;zoomScale=1;pan={x:0,y:0};$('#zoom-dialog').showModal();applyZoom();event('image_zoom_opened',{imageIndex:state.imageIndex+1});}
$('#zoom-plus').onclick=()=>{zoomScale+=.5;applyZoom();};$('#zoom-minus').onclick=()=>{zoomScale-=.5;applyZoom();};$('#zoom-reset').onclick=()=>{zoomScale=1;pan={x:0,y:0};applyZoom();};$('#zoom-stage').ondblclick=()=>{zoomScale=zoomScale>1?1:2;pan={x:0,y:0};applyZoom();};
$('#zoom-stage').onpointerdown=e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});e.currentTarget.setPointerCapture(e.pointerId);if(pointers.size===2){const[a,b]=[...pointers.values()];pinchBase={distance:Math.hypot(a.x-b.x,a.y-b.y),scale:zoomScale};}};
$('#zoom-stage').onpointermove=e=>{const old=pointers.get(e.pointerId);if(!old)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinchBase){const[a,b]=[...pointers.values()];zoomScale=pinchBase.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinchBase.distance);}else if(zoomScale>1){pan.x+=e.clientX-old.x;pan.y+=e.clientY-old.y;}applyZoom();};
for(const name of ['pointerup','pointercancel'])$('#zoom-stage').addEventListener(name,e=>{pointers.delete(e.pointerId);pinchBase=null;});
$('#zoom-dialog').addEventListener('close',()=>{pointers.clear();pinchBase=null;});
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
window.addEventListener('popstate',e=>{
  if(e.state?.explored){client.explore();state.explored=true;}
  if(e.state?.product||e.state?.publicationId){showProduct(e.state.product||null,{push:false,publicationId:e.state.publicationId||null});return;}
  if(e.state?.catalog){
    state.discovery=e.state.discovery||discoveryState();state.scroll=e.state.scroll||0;
    showCatalog({restore:true,push:false});
  }else showHome({push:false});
});
async function boot(){if(!tg?.initData){errorScreen(new StorefrontError(401),boot);return;}const publicationId=requestedPublicationId(tg,location.search);if(publicationId){state.source='telegram_publication_post';history.replaceState({publicationId,explored:false},'',location.href);await showProduct(null,{push:false,publicationId});return;}const id=requestedProductId(tg,location.search);if(id){state.source='telegram_product_post';history.replaceState({product:id,explored:false},'',location.href);await showProduct(id,{push:false});}else {history.replaceState({catalog:true,explored:true},'',location.href);await showCatalog({reset:true,push:false});}}
boot();
