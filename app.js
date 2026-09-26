import {createStorefrontClient,requestedProductId,openContact,MINI_APP_URL,StorefrontError} from './storefront-api.mjs?v=20260926-order-post';
const tg=window.Telegram?.WebApp;
tg?.ready();tg?.expand();
const client=createStorefrontClient({tg});
import {sizeValues,createSizeWheel,createLatestCheck} from './size-picker.mjs';
import {blankFilters,modelName,categoryOf,categoryLabel,genderLabel,colorLabel,filterProducts,facets,setFilter,activeCount,priceError,validPrice} from './catalog-core.mjs';
const $=s=>document.querySelector(s);
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',filter:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="17" r="2" fill="currentColor"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',back:'<path d="M19 12H5m5-5-5 5 5 5"/>',photo:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 17 5-5 4 3 3-4 5 6"/><circle cx="8" cy="9" r="1"/>',zoom:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5M7 10h6m-3-3v6"/>',bag:'<path d="M5 7h14l1 14H4L5 7Zm3 0V5a4 4 0 0 1 8 0v2"/>',chat:'<path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2 1.5-5A8 8 0 1 1 20 11.5Z"/><path d="M7 10h9M7 14h6"/>',check:'<path d="m5 12 4 4L19 6"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',left:'<path d="m15 6-6 6 6 6"/>',right:'<path d="m9 6 6 6-6 6"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[n]||paths.info}</svg>`;
const state={products:[],filters:blankFilters(),draft:blankFilters(),query:'',sort:'curated',limit:12,product:null,imageIndex:0,size:null,check:'idle',navigation:0,catalogLoaded:false,explored:false,theme:'light',scroll:0,source:'catalog'};
const money=p=>p.priceCurrency==='RUB'&&Number.isFinite(p.priceAmount)&&p.priceAmount>0?new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(p.priceAmount)+' ₽':'Цена уточняется';
const title=modelName;
const colors={'Nero':'Чёрный','Rosso Ciliegia':'Вишнёвый','Rosa Ballerina':'Нежно-розовый','Altri pellami':'Кожа','Fashion Leather':'Кожа','GAZON':'Зелёный'};
const color=p=>colors[p.color]||p.color||'Цвет уточняется';
const material=p=>({'Tela Monogram':'Канва Monogram','Altri pellami':'Кожа','AUTRES TOILES':'Канва','Pelle Monogram Empreinte':'Кожа Monogram Empreinte','Tela Damier Azur':'Канва Damier Azur','Fashion Leather':'Кожа','Monogram Reverse Canvas':'Канва Monogram Reverse'}[p.description?.split(' · ')[0]]||p.description?.split(' · ')[0]||'Уточним в личном сообщении');
const gender=p=>p.gender==='men'?'Мужская модель':p.gender==='women'?'Женская модель':'Унисекс';
const imageUrl=i=>{if(i?.url){try{const u=new URL(i.url);return u.protocol==='https:'&&u.hostname==='dbgcpgteuwkxqjgvppfp.supabase.co'?escapeHtml(u.href):'';}catch{return '';}}return i?.bucket==='product-images'&&i?.path?'https://dbgcpgteuwkxqjgvppfp.supabase.co/storage/v1/object/public/product-images/'+escapeHtml(i.path.split('/').map(encodeURIComponent).join('/')):'';};
const images=p=>[...new Map([{bucket:p.imageBucket,path:p.imagePath},...(p.images||[]),...(p.imageUrls||[]).map(url=>({url})),{url:p.imageUrl}].filter(i=>(i.path||i.url)&&imageUrl(i)).map(i=>[imageUrl(i),i])).values()];
const cover=p=>imageUrl(images(p)[0]);
function event(type,extra={}){const map={gallery_image_viewed:'gallery_image_viewed',image_zoom_opened:'gallery_image_viewed',catalog_search:'catalog_search_submitted',catalog_filter:'catalog_filter_changed',catalog_explored:'catalog_search_opened'};const name=map[type];if(name)void client.track(name,state.product?.id||null,{size:state.size,source:state.source,start_param:tg?.initDataUnsafe?.start_param||null,timestamp:new Date().toISOString(),...(type==='image_zoom_opened'?{mode:'zoom'}:{}),...extra});}
function announce(text){$('#announcement').textContent=text;}
function setTheme(theme){state.theme=theme;document.documentElement.dataset.theme=theme;$('#theme').innerHTML=icon(theme==='light'?'moon':'sun');$('#theme').setAttribute('aria-label',theme==='light'?'Переключить на тёмную тему':'Переключить на светлую тему');document.querySelector('meta[name=theme-color]').content=theme==='light'?'#f8f7f3':'#14211b';}
$('#theme').onclick=()=>setTheme(state.theme==='light'?'dark':'light');setTheme(tg?.colorScheme==='dark'?'dark':'light');
tg?.onEvent?.('themeChanged',()=>setTheme(tg.colorScheme==='dark'?'dark':'light'));
tg?.BackButton?.onClick?.(()=>{const open=[...document.querySelectorAll('dialog[open]')].at(-1);if(open)open.close();else if(state.product)showCatalog({restore:true});});
function navigationUrl(id){const url=new URL(location.href);if(id)url.searchParams.set('product',id);else url.searchParams.delete('product');return url.pathname+url.search+url.hash;}
function errorScreen(error,retry){document.body.classList.remove('has-product');$('#app').innerHTML=`<div class="empty-state" role="alert"><h2>${error?.status===401?'Откройте каталог в Telegram':'Не удалось загрузить каталог'}</h2><p>${escapeHtml(error?.message||'Проверьте соединение и попробуйте ещё раз.')}</p><button id="retry-load" class="primary">${error?.status===401?'Открыть в Telegram':'Попробовать снова'}</button><button id="error-catalog" class="text-button">В каталог</button></div>`;$('#retry-load').onclick=error?.status===401?()=>{if(tg?.openTelegramLink)tg.openTelegramLink(MINI_APP_URL);else location.href=MINI_APP_URL;}:retry;$('#error-catalog').onclick=()=>showCatalog({reset:true});}


function results(filters=state.filters){
  const list=filterProducts(state.products,filters,state.query);
  const byPrice=direction=>(a,b)=>validPrice(a)&&validPrice(b)?direction*(a.priceAmount-b.priceAmount):validPrice(a)?-1:validPrice(b)?1:0;
  return list.sort(state.sort==='low'?byPrice(1):state.sort==='high'?byPrice(-1):state.sort==='name'?(a,b)=>title(a).localeCompare(title(b)):(a,b)=>a.id-b.id);
}
const filterCount=()=>activeCount(state.filters);
const productNoun=n=>n%100>=11&&n%100<=14?'товаров':n%10===1?'товар':n%10>=2&&n%10<=4?'товара':'товаров';
const facetLabel=(key,value)=>key==='category'?categoryLabel(value):key==='gender'?genderLabel(value):key==='color'?colorLabel(value):value;
function renderCard(p){return `<button class="product-card" data-product="${p.id}" aria-label="${escapeHtml(p.brand+' '+title(p)+', '+money(p))}"><span class="card-image"><img src="${cover(p)}" alt="${escapeHtml(title(p)+' · '+color(p))}" loading="lazy" decoding="async" width="480" height="480"></span><span class="card-copy"><span class="card-brand">${escapeHtml(p.brand)}</span><span class="card-name">${escapeHtml(title(p))}</span><span class="card-description">${escapeHtml(categoryOf(p)==='shoes'?gender(p)+' · '+color(p):color(p))}</span><span class="card-price">${money(p)}<span aria-hidden="true">↗</span></span></span></button>`;}
async function showCatalog({reset=false,restore=false,push=true}={}){
  closeOverlays();sizeCheck.cancel();const navigation=++state.navigation;state.product=null;state.explored=true;client.explore();tg?.BackButton?.hide?.();
  if(!state.catalogLoaded){$('#app').innerHTML='<div class="loading-state" role="status"><span class="spinner"></span>Загружаем каталог…</div>';try{const products=await client.catalog();if(navigation!==state.navigation)return;state.products=products;state.catalogLoaded=true;}catch(error){if(navigation===state.navigation)errorScreen(error,()=>showCatalog({reset,restore,push}));return;}}
  if(reset){state.filters=blankFilters();state.query='';state.limit=12;state.sort='curated';state.scroll=0;}
  state.product=null;document.body.classList.remove('has-product');
  if(push)history.pushState({catalog:true,explored:true},'',navigationUrl());
  $('#app').innerHTML=`<section class="catalog" aria-label="Каталог"><h1 class="sr-only">Каталог</h1><div class="catalog-toolbar"><label class="search-field">${icon('search')}<span class="sr-only">Поиск по бренду, модели или артикулу</span><input type="search" id="search" placeholder="Бренд, модель, артикул" value="${escapeHtml(state.query)}" autocomplete="off"></label><button id="filters-open" class="filter-button" aria-label="Открыть фильтры">${icon('filter')}<span class="filter-text">Фильтры</span><span id="filter-badge" class="filter-count" hidden></span></button></div><div class="brand-strip" id="brand-strip" aria-label="Бренды"></div><div class="active-filters" id="active-filters" aria-label="Выбранные фильтры"></div><div class="catalog-meta"><span id="result-count" aria-live="polite"></span><label class="sort-label"><select id="sort" aria-label="Сортировка">${[['curated','По умолчанию'],['low','Сначала дешевле'],['high','Сначала дороже'],['name','По названию']].map(([key,label])=>`<option value="${key}" ${state.sort===key?'selected':''}>${label}</option>`).join('')}</select></label></div><div class="product-grid" id="products"></div><div class="more-wrap" id="more-wrap"></div></section>`;
  $('#search').oninput=e=>{state.query=e.target.value;state.limit=12;renderResults();};
  $('#search').onchange=()=>event('catalog_search',{query:state.query,resultCount:results().length});
  $('#sort').onchange=e=>{state.sort=e.target.value;renderResults();};$('#filters-open').onclick=openFilters;
  renderResults();window.scrollTo({top:restore?state.scroll:0,behavior:'instant'});
}
function renderFilterSummary(){
  const count=filterCount();$('#filter-badge').hidden=!count;$('#filter-badge').textContent=count;
  const brands=[...new Set(state.products.map(p=>p.brand).filter(Boolean))].sort();
  const brandCounts=new Map(brands.map(brand=>[brand,filterProducts(state.products,setFilter(state.filters,'brand',brand),state.query).length]));
  $('#brand-strip').innerHTML=[['all','Все'],...brands.map(b=>[b,b])].map(([value,label])=>`<button class="brand-tab" data-brand="${escapeHtml(value)}" aria-pressed="${state.filters.brand===value}">${escapeHtml(label)}${value==='all'?'':`<span>${brandCounts.get(value)||0}</span>`}</button>`).join('');
  document.querySelectorAll('[data-brand]').forEach(b=>b.onclick=()=>{state.filters=setFilter(state.filters,'brand',b.dataset.brand);state.limit=12;event('catalog_filter',{filters:state.filters});renderResults();});
  const chips=Object.entries(state.filters).filter(([key,value])=>value!==''&&value!=='all'&&key!=='brand');
  const label=(key,value)=>key==='minPrice'?`От ${Number(value).toLocaleString('ru')} ₽`:key==='maxPrice'?`До ${Number(value).toLocaleString('ru')} ₽`:key==='size'?`Размер ${value}`:facetLabel(key,value);
  $('#active-filters').hidden=chips.length===0;
  $('#active-filters').innerHTML=chips.map(([key,value])=>`<button class="filter-chip" data-remove="${key}" aria-label="Убрать фильтр: ${escapeHtml(label(key,value))}">${escapeHtml(label(key,value))}<span aria-hidden="true">×</span></button>`).join('');
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const key=b.dataset.remove;state.filters[key]=blankFilters()[key];state.limit=12;renderResults();});
}
function renderResults(){
  const list=results(),shown=list.slice(0,state.limit);
  renderFilterSummary();
  $('#result-count').innerHTML=`<strong>${list.length}</strong> ${productNoun(list.length)}${filterCount()?` <button class="text-button" id="clear-filters">Сбросить</button>`:''}`;
  $('#products').innerHTML=list.length?shown.map(renderCard).join(''):'<div class="empty-state" style="grid-column:1/-1"><h2>Ничего не найдено</h2><p>Измените запрос или фильтры.</p><button class="secondary" id="empty-reset">Сбросить поиск и фильтры</button></div>';
  $('#more-wrap').innerHTML=list.length?`${shown.length<list.length?'<button id="more" class="secondary">Показать ещё '+icon('arrow')+'</button>':''}<p>${shown.length} из ${list.length}</p>`:'';
  document.querySelectorAll('[data-product]').forEach(b=>b.onclick=()=>{state.scroll=window.scrollY;state.source='catalog';showProduct(Number(b.dataset.product));});
  if($('#clear-filters'))$('#clear-filters').onclick=()=>{state.filters=blankFilters();state.limit=12;renderResults();};
  if($('#empty-reset'))$('#empty-reset').onclick=()=>showCatalog({reset:true,push:false});
  if($('#more'))$('#more').onclick=()=>{state.limit+=12;renderResults();announce(`Показано ${Math.min(state.limit,list.length)} из ${list.length} товаров`);};
}
function openFilters(){state.draft={...state.filters};renderFilterFields();$('#filters-dialog').showModal();}
function draftOptions(key,allLabel){
  let options=facets(state.products,state.draft,state.query,key);
  // All brands stay reachable when switching from a brand-specific model.
  if(key==='brand')options=[...new Set(state.products.map(p=>p.brand).filter(Boolean))].sort().map(value=>({value,count:filterProducts(state.products,setFilter(state.draft,'brand',value),state.query).length}));
  return `<option value="all">${allLabel}</option>`+options.map(({value,count})=>`<option value="${escapeHtml(value)}" ${state.draft[key]===value?'selected':''}>${escapeHtml(facetLabel(key,value))} (${count})</option>`).join('');
}
function renderFilterFields(focusKey){
  const listForPrice=filterProducts(state.products,state.draft,state.query,'price').filter(validPrice);
  const range=listForPrice.length?`${Math.min(...listForPrice.map(p=>p.priceAmount)).toLocaleString('ru')} – ${Math.max(...listForPrice.map(p=>p.priceAmount)).toLocaleString('ru')} ₽`:'Нет товаров по текущему запросу';
  const select=(key,label,allLabel)=>{const options=facets(state.products,state.draft,state.query,key);if(!options.length&&['size','gender','color'].includes(key))return '';return `<div class="field-group"><label class="field-label" for="filter-${key}">${label}</label><select id="filter-${key}" data-filter-select="${key}">${draftOptions(key,allLabel)}</select>${key==='size'?'<p class="field-hint">Размер для поиска, не подтверждение наличия.</p>':''}</div>`;};
  $('#filter-fields').innerHTML=select('brand','Бренд','Все бренды')+select('model','Модель','Все модели')+`<div class="field-group"><span class="field-label">Цена, ₽</span><div class="price-inputs"><label><span>От</span><input id="min-price" data-price="minPrice" type="text" inputmode="numeric" pattern="[0-9]*" value="${escapeHtml(state.draft.minPrice)}" placeholder="0" aria-describedby="price-error"></label><label><span>До</span><input id="max-price" data-price="maxPrice" type="text" inputmode="numeric" pattern="[0-9]*" value="${escapeHtml(state.draft.maxPrice)}" placeholder="Без лимита" aria-describedby="price-error"></label></div><p class="field-hint">${range}</p><p id="price-error" class="field-error" role="alert"></p></div><div class="advanced-heading">Дополнительно</div>`+select('category','Категория','Все категории')+select('gender','Для кого','Все')+select('color','Цвет','Все цвета');
  document.querySelectorAll('[data-filter-select]').forEach(s=>s.onchange=()=>{const key=s.dataset.filterSelect;state.draft=setFilter(state.draft,key,s.value);renderFilterFields(key);});
  document.querySelectorAll('[data-price]').forEach(input=>{input.oninput=()=>{state.draft[input.dataset.price]=input.value.trim();updateFilterCount();if(!priceError(state.draft))document.querySelectorAll('[data-filter-select]').forEach(s=>{const all=s.options[0].textContent;s.innerHTML=draftOptions(s.dataset.filterSelect,all);});};});
  updateFilterCount();
  if(focusKey)document.getElementById(focusKey.includes('-price')?focusKey:'filter-'+focusKey)?.focus({preventScroll:true});
}
function updateFilterCount(){
  const error=priceError(state.draft);$('#price-error').textContent=error;
  document.querySelectorAll('[data-price]').forEach(i=>i.setAttribute('aria-invalid',Boolean(error)));
  $('#filters-apply').disabled=Boolean(error);$('#filters-apply').textContent=error?'Проверьте цену':`Показать · ${results(state.draft).length}`;
}
$('#filters-reset').onclick=()=>{state.draft=blankFilters();renderFilterFields();};
$('#filters-apply').onclick=()=>{if(priceError(state.draft))return;state.filters={...state.draft};state.limit=12;event('catalog_filter',{filters:state.filters,resultCount:results().length});$('#filters-dialog').close();showCatalog({push:false});};
async function showProduct(id,{push=true}={}){
  closeOverlays();sizeCheck.cancel();const navigation=++state.navigation;
  state.product=null;document.body.classList.remove('has-product');
  $('#app').innerHTML='<div class="loading-state" role="status"><span class="spinner"></span>Загружаем модель…</div>';
  let p;try{p=await client.product(id);}catch(error){if(navigation===state.navigation)errorScreen(error,()=>showProduct(id,{push}));return;}
  if(navigation!==state.navigation)return;
  state.product=p;state.imageIndex=0;state.size=null;state.check='idle';document.body.classList.add('has-product');tg?.BackButton?.show?.();
  if(push)history.pushState({product:id,explored:state.explored},'',navigationUrl(id));
  event('product_opened');
  const photos=images(p);const on=categoryOf(p)==='shoes';const hasSizes=Boolean(p.sizes?.length);const dimensions=p.description?.match(/\d+(?:[.,]\d+)?\s*x\s*\d+(?:[.,]\d+)?\s*x\s*\d+(?:[.,]\d+)?\s*cm/i)?.[0]?.replace(/cm/i,'см').replaceAll('x','×');
  $('#app').innerHTML=`<section class="detail-page"><nav class="detail-nav" aria-label="Навигация по товару"><button class="back-button" id="back-catalog" aria-label="Вернуться в каталог">${icon('back')}<span>В каталог</span></button><button class="browse-button" id="explore" aria-label="Посмотреть другие модели ${escapeHtml(p.brand)}"><span>Другие модели</span>${icon('arrow')}</button></nav><div class="product-layout"><div class="gallery"><div class="gallery-main"><button class="gallery-open" id="gallery-open" aria-label="Увеличить фото 1"><img id="hero-image" src="${imageUrl(photos[0])}" alt="${escapeHtml(title(p))}, фото 1" width="960" height="900" fetchpriority="high" decoding="async"></button><span class="gallery-counter" id="gallery-counter">1 / ${photos.length}</span>${photos.length>1?`<button id="gallery-prev" class="icon-button gallery-arrow prev" aria-label="Предыдущее фото">${icon('left')}</button><button id="gallery-next" class="icon-button gallery-arrow next" aria-label="Следующее фото">${icon('right')}</button>`:''}<button class="gallery-zoom" id="gallery-zoom">${icon('zoom')}Рассмотреть ближе</button></div><div class="thumbnail-row" aria-label="Фотографии модели">${photos.map((img,i)=>`<button class="thumbnail" data-image="${i}" aria-label="Показать фото ${i+1}" aria-pressed="${i===0}"><img src="${imageUrl(img)}" alt="" width="74" height="74" loading="lazy" decoding="async"></button>`).join('')}</div><p class="gallery-help">${icon('photo')}Все фотографии относятся к выбранной модели.</p></div><div class="product-info"><p class="detail-brand">${escapeHtml(p.brand)}</p><h1>${escapeHtml(title(p))}</h1><p class="detail-subtitle">${escapeHtml(on?gender(p)+' · '+color(p):color(p))}</p><p class="detail-price">${money(p)}</p><p class="price-note">Доставка рассчитывается отдельно</p>${hasSizes?`<button class="size-trigger" id="size-open" aria-haspopup="dialog" aria-controls="size-dialog"><span id="selected-size">Выбрать размер</span><span class="size-trigger-end">${on?'EU':''} ${icon('right')}</span></button>`:''}<div id="availability" aria-live="polite"></div><div class="detail-actions"><button class="primary" id="detail-contact">${icon('chat')}Заказать</button></div><details class="details-disclosure"><summary>О модели</summary><dl><div><dt>Артикул</dt><dd>${escapeHtml(p.reference)}</dd></div><div><dt>Цвет</dt><dd>${escapeHtml(color(p))}</dd></div>${on?`<div><dt>Для кого</dt><dd>${gender(p)}</dd></div>`:`<div><dt>Материал</dt><dd>${escapeHtml(material(p))}</dd></div>${dimensions?`<div><dt>Размеры</dt><dd>${escapeHtml(dimensions)}</dd></div>`:''}`}</dl></details><details class="details-disclosure"><summary>Как заказать и получить</summary><p>Напишите Анастасии. Она уточнит наличие, подтвердит стоимость и согласует доставку. Товар приобретается после подтверждения вашего запроса.</p></details></div></div></section><div class="mobile-dock"><span class="dock-price">${money(p)}<span class="dock-caption">Доставка отдельно</span></span><button class="primary" id="dock-contact">${icon('chat')}Заказать</button></div>`;
  $('#back-catalog').onclick=()=>showCatalog({restore:true});$('#explore').onclick=()=>{event('catalog_explored');state.filters={...blankFilters(),brand:p.brand};state.query='';state.limit=12;showCatalog();};
  $('#detail-contact').onclick=contact;$('#dock-contact').onclick=contact;$('#gallery-open').onclick=openZoom;$('#gallery-zoom').onclick=openZoom;
  if($('#gallery-next'))$('#gallery-next').onclick=()=>setImage(state.imageIndex+1);if($('#gallery-prev'))$('#gallery-prev').onclick=()=>setImage(state.imageIndex-1);
  document.querySelectorAll('[data-image]').forEach(b=>b.onclick=()=>setImage(Number(b.dataset.image)));
  if($('#size-open'))$('#size-open').onclick=openSizePicker;updateOrderActions();
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
  const hasSizes=sizeValues(state.product).length>0;
  const label=hasSizes&&!state.size?'Выбрать размер':state.check==='pending'?'Проверяем…':['error','unknown','unavailable'].includes(state.check)?'Уточнить':'Заказать';
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
window.addEventListener('popstate',e=>{if(e.state?.explored){client.explore();state.explored=true;}e.state?.product?showProduct(e.state.product,{push:false}):showCatalog({restore:true,push:false});});
async function boot(){if(!tg?.initData){errorScreen(new StorefrontError(401),boot);return;}const id=requestedProductId(tg,location.search);if(id){state.source='telegram_product_post';history.replaceState({product:id,explored:false},'',location.href);await showProduct(id,{push:false});}else {history.replaceState({catalog:true,explored:true},'',location.href);await showCatalog({push:false});}}
boot();
