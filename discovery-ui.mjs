import {initial,multi,labels,label,departmentLabel,productTitle,colorLabel,matches,facets,sortItems,countFilters,priceError,publicationTime,discountPercent,productCount} from './discovery-core.mjs?v=20261010-discovery';

const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const catalogs=['clothing','shoes','bags','jewelry','watches','accessories'];
const sorts={curated:'Обзор каталога',newest:'Сначала новые публикации','price-low':'Сначала дешевле','price-high':'Сначала дороже',discount:'Сначала большая скидка',name:'По названию'};
const clone=x=>structuredClone(x);
export const discoveryState=()=>({filters:initial(),query:'',sort:'curated',tab:'all',limit:12,saved:[],favoritesOnly:false});

// The caller owns API access, identity, navigation and order/availability flows.
// This component never fetches details to populate filters or stores Telegram data.
export function mountDiscovery({root,products,snapshot,onChange,onProduct,track,cover,priceLabel}){
  const abort=new AbortController();
  const state={...discoveryState(),...clone(snapshot||{})};
  state.filters={...initial(),...state.filters};
  let draft=null,searchTimer,alive=true;
  const $=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)];
  const dated=products.some(p=>publicationTime(p)!==null);
  const discounts=products.some(p=>discountPercent(p)!==null);
  const sized=products.some(p=>Array.isArray(p.availableSizes)&&p.availableSizes.length);
  root.innerHTML=`<section class="discovery" aria-label="Каталог товаров">
    <header class="masthead"><button class="wordmark" data-action="all">Каталог<span>.</span></button><div class="header-actions"><button class="plain" data-action="catalogs">Каталоги ⌄</button><button id="favorites" class="icon" aria-label="Избранное" aria-pressed="false">♡<span id="fav-count"></span></button></div></header>
    <div class="catalog-main"><section class="search-zone" aria-label="Поиск товаров"><form id="search-form" role="search"><span aria-hidden="true" class="search-icon">⌕</span><label class="sr-only" for="search">Бренд, модель или артикул</label><input id="search" type="search" placeholder="Бренд, модель или артикул" autocomplete="off" enterkeyhint="search" aria-controls="suggestions"><button type="submit" class="search-submit" aria-label="Найти товары">→</button></form><div id="suggestions" class="suggestions" hidden></div></section>
    <nav class="audience" aria-label="Для кого"><button data-audience="all">Всем</button><button data-audience="women">Женщинам</button><button data-audience="men">Мужчинам</button><button data-quick="brand" class="audience-brands">Бренды ↗</button></nav>
    <nav class="tabs" aria-label="Подбор товаров"><button data-tab="all">Все товары</button><button data-tab="recent">Новинки</button><button data-tab="sale">Скидки</button><button data-tab="offers">Подборки</button></nav>
    <nav id="category-bar" class="category-bar" aria-label="Каталоги товаров"></nav>
    <div class="catalog-layout"><aside id="desktop-filters" aria-label="Фильтры каталога"></aside><section class="results-area"><div id="collections" hidden></div><div class="toolbar"><button id="filters-open" class="filter-trigger">☷ Фильтры <span id="filter-count"></span></button><div class="quick-filters"><button data-quick="brand">Бренд ⌄</button>${sized?'<button data-quick="size">Размер ⌄</button>':''}<button data-quick="price">Цена ⌄</button></div><button id="sort-open" class="sort-trigger" aria-label="Сортировка">⇅<span>Сортировка</span></button></div><div id="active-filters" class="active-filters" aria-label="Выбранные фильтры"></div><div class="result-heading"><div><h1 id="heading" tabindex="-1">Все товары</h1><span id="result-count" role="status" aria-live="polite"></span></div><span id="sort-label"></span></div><p id="data-note" class="data-note" hidden></p><div id="products" class="product-grid"></div><div id="more-wrap" class="more-wrap"></div></section></div></div>
    <dialog id="discovery-dialog" class="discovery-panel" aria-labelledby="discovery-dialog-title"><div class="panel-head"><h2 id="discovery-dialog-title">Фильтры</h2><button id="discovery-close" class="icon" aria-label="Закрыть">×</button></div><div id="discovery-body" class="panel-body"></div><div id="discovery-foot" class="panel-foot"><button id="filter-reset" class="plain">Сбросить</button><button id="filter-apply" class="primary">Показать товары</button></div></dialog>
  </section>`;
  $('#search').value=state.query;
  const pool=(filters=state.filters)=>matches(products,filters,state.query).filter(p=>!state.favoritesOnly||state.saved.includes(p.id));
  const emit=()=>onChange(clone(state));
  const changed=()=>{state.limit=12;render();track('catalog_filter',{filters:clone(state.filters),resultCount:pool().length});};
  const reset=()=>{Object.assign(state,{...discoveryState(),saved:state.saved});$('#search').value='';render();};
  const open=(heading,content,filters=false)=>{const dialog=$('#discovery-dialog');$('#discovery-dialog-title').textContent=heading;$('#discovery-body').innerHTML=content;$('#discovery-foot').hidden=!filters;dialog.dataset.kind=filters?'filters':'menu';dialog.showModal();document.body.classList.add('discovery-modal-open');};
  const close=()=>$('#discovery-dialog').close();
  $('#discovery-dialog').addEventListener('close',()=>document.body.classList.remove('discovery-modal-open'));
  $('#discovery-close').onclick=close;
  const filterNote='По последней проверке. Перед заказом проверим наличие выбранного размера ещё раз.';
  function card(p,i){
    const photo=cover(p),saved=state.saved.includes(p.id),discount=discountPercent(p);
    return `<article class="card"><button class="product-link" data-product="${p.id}" aria-label="${esc(p.brand+' '+productTitle(p)+', '+priceLabel(p))}"><span class="product-image">${photo?`<img src="${photo}" alt="${esc(productTitle(p))}" loading="${i<6?'eager':'lazy'}" decoding="async" width="400" height="320">`:'<span class="filter-hint">Фото уточняется</span>'}</span><span class="card-info"><span class="price">${esc(priceLabel(p))}</span><span class="brand">${esc(p.brand)}</span><span class="product-name">${esc(productTitle(p))}</span><span class="meta">${esc([label('gender',p.gender||''),colorLabel(p.color)].filter(Boolean).join(' · '))}</span></span></button><button class="card-favorite" data-save="${p.id}" aria-label="${saved?'Убрать из избранного':'В избранное'}: ${esc(productTitle(p))}" aria-pressed="${saved}">${saved?'♥':'♡'}</button>${discount!==null?`<span class="badge">−${discount}%</span>`:''}</article>`;
  }
  function render({sidebar=true}={}){
    if(!alive)return;
    const list=sortItems(pool(),state.sort),f=state.filters,n=countFilters(f);
    $('#filter-count').textContent=n?String(n):'';$('#favorites').setAttribute('aria-pressed',String(state.favoritesOnly));$('#fav-count').textContent=state.saved.length||'';
    all('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===state.tab)));
    all('[data-audience]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.audience==='all'?!f.gender.length:f.gender.length===1&&f.gender[0]===b.dataset.audience)));
    $('#category-bar').innerHTML=catalogs.map(k=>`<button data-category="${k}" aria-pressed="${f.catalog.includes(k)}">${departmentLabel(k)}</button>`).join('');
    $('#heading').textContent=state.favoritesOnly?'Избранное':state.query?'Результаты поиска':state.tab==='recent'?'Недавно опубликовано':state.tab==='sale'?'Скидки':f.catalog.length===1?departmentLabel(f.catalog[0]):'Все товары';
    $('#result-count').textContent=productCount(list.length);$('#sort-label').textContent=sorts[state.sort];
    const chips=[];
    for(const k of multi)for(const v of f[k])chips.push(`<button data-remove="${k}" data-value="${esc(v)}" aria-label="Убрать фильтр ${esc(label(k,v))}">${esc(label(k,v))} ×</button>`);
    if(f.min||f.max)chips.push(`<button data-remove="price">${f.min?'от '+Number(f.min).toLocaleString('ru')+' ':''}${f.max?'до '+Number(f.max).toLocaleString('ru'):''} ₽ ×</button>`);
    if(f.period!=='all')chips.push(`<button data-remove="period">За ${esc(f.period)} дней ×</button>`);
    if(f.discount!=='all')chips.push(`<button data-remove="discount">Со скидкой ×</button>`);
    if(chips.length)chips.push('<button data-action="all" class="reset-all">Сбросить всё</button>');
    $('#active-filters').innerHTML=chips.join('');
    const note=f.size.length?filterNote:!dated&&(f.period!=='all'||state.sort==='newest')?'История дат публикаций пока недоступна. Товары можно найти через поиск и другие фильтры.':!discounts&&(f.discount!=='all'||state.sort==='discount')?'Сейчас нет подтверждённых скидок для клиента. Все цены указаны в рублях.':'';
    $('#data-note').textContent=note;$('#data-note').hidden=!note;
    $('#collections').hidden=state.tab!=='offers';$('#collections').innerHTML=state.tab==='offers'?'<h2>Найдите свою подборку</h2><div class="collection-grid"><button data-collection="budget"><strong>До 20 000 ₽</strong><span>Подбор по бюджету →</span></button><button data-collection="jewelry"><strong>Украшения</strong><span>Кольца и подвески →</span></button></div>':'';
    $('#products').innerHTML=list.length?list.slice(0,state.limit).map(card).join(''):`<div class="empty"><h2>${state.favoritesOnly?'В избранном пока пусто':'Ничего не найдено'}</h2><p>${state.favoritesOnly?'Нажмите на сердечко у товара, чтобы сохранить его на время просмотра.':'Попробуйте изменить запрос или убрать один фильтр.'}</p><button class="primary" data-action="all">Все товары</button></div>`;
    $('#more-wrap').innerHTML=list.length>state.limit?`<button id="more">Показать ещё</button><small>${state.limit} из ${list.length}</small>`:list.length?`<small>Показаны все ${list.length}</small>`:'';
    if(sidebar)renderFilters($('#desktop-filters'),f,false);
    emit();
  }
  function group(key,body,opened){return `<details data-group="${key}" ${opened?'open':''}><summary>${labels[key]||'Цена, ₽'}</summary><div>${body}</div></details>`;}
  function renderFilters(container,f,modal){
    const opened=allIn(container,'details[open]').map(d=>d.dataset.group),first=!container.children.length,scroll=container.scrollTop;
    const focused=document.activeElement,focusKey=container.contains(focused)?[focused.dataset.filter,focused.value]:null;
    let html=modal?'':'<h2>Уточнить поиск</h2>';
    for(const key of multi){
      const opts=facets(products,f,state.query,key);
      if(!opts.length&&!f[key].length)continue;
      const body=(key==='brand'?'<input class="filter-search" type="search" placeholder="Найти бренд" aria-label="Найти бренд">':'')+opts.map(o=>`<label class="option" data-option><input type="checkbox" data-filter="${key}" value="${esc(o.value)}" ${f[key].includes(o.value)?'checked':''}><span>${esc(label(key,o.value))}</span><small>${o.count}</small></label>`).join('')+(key==='size'?`<p class="filter-hint">Можно выбрать несколько размеров. ${filterNote}</p>`:'');
      html+=group(key,body,opened.includes(key)||(first&&['catalog','brand','gender'].includes(key)));
    }
    html+=group('price',`<div class="price-fields"><label>От<input data-price="min" inputmode="numeric" value="${esc(f.min)}" placeholder="0"></label><label>До<input data-price="max" inputmode="numeric" value="${esc(f.max)}" placeholder="Без ограничения"></label></div><div class="preset-row"><button data-budget="20000">До 20 000 ₽</button><button data-budget="100000">До 100 000 ₽</button></div><p class="filter-error" role="alert">${priceError(f)}</p><p class="filter-hint">«Цена по запросу» не входит в фильтр по сумме.</p>`,opened.includes('price'));
    const select=(key,options,hint)=>group(key,`<select data-single="${key}" aria-label="${labels[key]}">${options.map(([v,t])=>`<option value="${v}" ${f[key]===v?'selected':''}>${t}</option>`).join('')}</select><p class="filter-hint">${hint}</p>`,opened.includes(key));
    html+=select('period',[['all','За всё время'],['7','За последние 7 дней'],['30','За последние 30 дней'],['90','За последние 90 дней']],dated?'По дате публикации, не дате импорта.':'История дат публикаций пока недоступна.');
    html+=select('discount',[['all','Любая цена'],['1','Только со скидкой'],['20','От 20%'],['30','От 30%'],['50','От 50%']],'Только подтверждённое снижение цены клиента в ₽.');
    if(!sized)html+='<p class="filter-hint">Размеры и проверка наличия доступны в карточке модели.</p>';
    container.innerHTML=html;container.scrollTop=scroll;
    if(focusKey?.[0])allIn(container,'[data-filter]').find(b=>b.dataset.filter===focusKey[0]&&b.value===focusKey[1])?.focus({preventScroll:true});
    if(modal)updateCount();
  }
  function allIn(node,selector){return [...node.querySelectorAll(selector)];}
  function updateCount(){const error=priceError(draft);$('#filter-apply').disabled=!!error;$('#filter-apply').textContent=error?'Проверьте цену':`Показать ${productCount(pool(draft).length)}`;$('#discovery-body .filter-error').textContent=error;}
  function openFilters(key){draft=clone(state.filters);open('Фильтры','',true);renderFilters($('#discovery-body'),draft,true);if(key){const target=all('#discovery-body [data-group]').find(d=>d.dataset.group===key);if(target){target.open=true;target.scrollIntoView({block:'start'});}}}
  function filterContainer(target){return target.closest('#desktop-filters')||target.closest('#discovery-body');}
  root.addEventListener('change',e=>{
    const c=filterContainer(e.target);if(!c)return;const modal=c.id==='discovery-body',f=modal?draft:state.filters,t=e.target;
    if(t.dataset.filter){const k=t.dataset.filter;f[k]=t.checked?[...new Set([...f[k],t.value])]:f[k].filter(v=>v!==t.value);}
    else if(t.dataset.single)f[t.dataset.single]=t.value;else return;
    if(modal)renderFilters(c,f,true);else changed();
  },{signal:abort.signal});
  root.addEventListener('input',e=>{
    const c=filterContainer(e.target);if(!c)return;const modal=c.id==='discovery-body',t=e.target,f=modal?draft:state.filters;
    if(t.classList.contains('filter-search')){allIn(t.closest('details'),'[data-option]').forEach(o=>o.hidden=!o.textContent.toLowerCase().includes(t.value.toLowerCase()));return;}
    if(!t.dataset.price)return;f[t.dataset.price]=t.value.trim();
    if(modal)updateCount();else{c.querySelector('.filter-error').textContent=priceError(f);if(!priceError(f)){state.limit=12;render({sidebar:false});}}
  },{signal:abort.signal});
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.product){clearTimeout(searchTimer);onProduct(Number(b.dataset.product));return;}
    if(b.dataset.save){const id=Number(b.dataset.save);state.saved=state.saved.includes(id)?state.saved.filter(v=>v!==id):[...state.saved,id];render();all('[data-save]').find(x=>Number(x.dataset.save)===id)?.focus({preventScroll:true});return;}
    if(b.dataset.quick){openFilters(b.dataset.quick);return;}
    if(b.dataset.action==='all'){reset();return;}
    if(b.dataset.action==='catalogs'){open('Каталоги',catalogs.map(k=>`<button class="menu-option" data-catalog="${k}">${departmentLabel(k)}<span>${matches(products,{...initial(),catalog:[k]}).length} →</span></button>`).join(''));return;}
    if(b.dataset.catalog){state.filters=initial();state.filters.catalog=[b.dataset.catalog];state.query='';$('#search').value='';state.tab='all';close();changed();return;}
    if(b.dataset.category){state.filters.catalog=state.filters.catalog.length===1&&state.filters.catalog[0]===b.dataset.category?[]:[b.dataset.category];for(const k of ['type','model','size','material'])state.filters[k]=[];changed();return;}
    if(b.dataset.audience){state.filters.gender=b.dataset.audience==='all'?[]:[b.dataset.audience];changed();return;}
    if(b.dataset.tab){state.tab=b.dataset.tab;state.favoritesOnly=false;state.filters.period=state.tab==='recent'?'7':'all';state.filters.discount=state.tab==='sale'?'1':'all';state.sort=state.tab==='recent'?'newest':state.tab==='sale'?'discount':'curated';if(state.tab==='all'){state.filters=initial();state.query='';$('#search').value='';}changed();return;}
    if(b.dataset.remove){const k=b.dataset.remove;if(multi.includes(k))state.filters[k]=state.filters[k].filter(v=>v!==b.dataset.value);else if(k==='price'){state.filters.min='';state.filters.max='';}else{state.filters[k]='all';state.tab='all';}changed();return;}
    if(b.dataset.sort){state.sort=b.dataset.sort;close();render();return;}
    if(b.dataset.budget){const c=filterContainer(b),modal=c.id==='discovery-body',f=modal?draft:state.filters;f.min='';f.max=b.dataset.budget;if(modal)renderFilters(c,f,true);else changed();return;}
    if(b.dataset.collection){state.filters=initial();state.query='';$('#search').value='';if(b.dataset.collection==='budget')state.filters.max='20000';else state.filters.catalog=['jewelry'];state.tab='all';changed();return;}
    if(b.dataset.suggestion){$('#search').value=b.dataset.suggestion;submitSearch();return;}
    if(b.id==='more'){state.limit+=12;render({sidebar:false});}
  },{signal:abort.signal});
  function suggestions(){const q=$('#search').value.trim(),opts=q?[...new Set(matches(products,initial(),q).flatMap(p=>[p.brand,productTitle(p)]))].slice(0,5):[...new Set(products.map(p=>p.brand))].slice(0,8);$('#suggestions').innerHTML=opts.map(x=>`<button type="button" data-suggestion="${esc(x)}">${esc(x)} ↗</button>`).join('');$('#suggestions').hidden=!opts.length;}
  function submitSearch(){clearTimeout(searchTimer);state.query=$('#search').value.trim();$('#suggestions').hidden=true;$('#search').blur();state.limit=12;render();track('catalog_search',{query:state.query,resultCount:pool().length});}
  $('#search').oninput=()=>{suggestions();clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.query=$('#search').value.trim();state.limit=12;render();},150);};
  $('#search').onfocus=suggestions;
  $('#search').onkeydown=e=>{if(e.key==='Escape')$('#suggestions').hidden=true;if(e.key==='ArrowDown'){e.preventDefault();$('#suggestions button')?.focus();}};
  $('#search-form').onsubmit=e=>{e.preventDefault();submitSearch();};
  $('#filters-open').onclick=()=>openFilters();
  $('#filter-reset').onclick=()=>{draft=initial();renderFilters($('#discovery-body'),draft,true);};
  $('#filter-apply').onclick=()=>{if(priceError(draft))return;state.filters=clone(draft);close();changed();};
  $('#favorites').onclick=()=>{state.favoritesOnly=!state.favoritesOnly;state.limit=12;render();};
  $('#sort-open').onclick=()=>open('Сортировка',Object.entries(sorts).map(([v,t])=>`<button class="menu-option" data-sort="${v}" aria-pressed="${state.sort===v}">${t}<span>${state.sort===v?'✓':''}</span></button>`).join(''));
  render();
  return {destroy(){alive=false;clearTimeout(searchTimer);abort.abort();if($('#discovery-dialog')?.open)close();document.body.classList.remove('discovery-modal-open');}};
}
