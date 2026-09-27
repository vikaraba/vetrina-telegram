import {normalizeSize,sizeDisplay} from './size-filter.mjs';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bell='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></svg>';
export function observedSizes(product,observations=[],now=Date.now()){
 const map=new Map(observations.map(s=>[normalizeSize(s.value),s]));
 const values=[...new Set([...(product.sizes||[]).map(s=>normalizeSize(s.value)),...map.keys()].filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
 return values.map(value=>{
  const row=map.get(value),date=Date.parse(row?.observedAt),fresh=Number.isFinite(date)&&date<=now+60000&&now-date<6*60*60*1000;
  return {value,status:fresh&&['available','sold_out'].includes(row.status)?row.status:'unknown',observedAt:Number.isFinite(date)?row.observedAt:null};
 });
}
export function createOnAvailability({isCurrent,select,cover,title,money,client,tg}){
 const dialog=document.createElement('dialog');dialog.id='on-availability-dialog';dialog.className='on-availability-dialog';dialog.setAttribute('aria-labelledby','on-availability-title');document.body.append(dialog);
 let product=null,rows=[],subscriptions=[],revision=0,opener=null,selected=null;
 const $=s=>dialog.querySelector(s);
 const current=(token,id)=>token===revision&&dialog.open&&isCurrent(id);
 const subscribed=value=>subscriptions.some(s=>s.size===value);
 function shell(heading,body,footer=''){
  dialog.innerHTML=`<header class="sheet-head"><h2 id="on-availability-title" tabindex="-1">${heading}</h2><button class="icon-button" id="on-size-close" aria-label="Закрыть размеры">×</button></header><div class="on-size-content"><div class="on-size-context"><img src="${cover(product)}" alt="" width="64" height="64"><div><strong>${escape(title(product))}</strong><span>${escape(product.reference)} · ${money(product)}</span></div></div>${body}</div>${footer?`<footer class="on-size-bottom">${footer}</footer>`:''}`;
  $('#on-size-close').onclick=()=>dialog.close();$('#on-availability-title').focus({preventScroll:true});
 }
 function grid(focusValue){
  const dates=rows.map(r=>Date.parse(r.observedAt)).filter(Number.isFinite);
  const dateText=dates.length?'Проверено: '+new Date(Math.min(...dates)).toLocaleString('ru-RU'):'Нет подтверждённых данных';
  shell('Размеры · EU',`<p class="on-size-instruction">Выберите свой размер</p><div class="on-size-legend"><span><i class="legend-available"></i>Доступен*</span><span>${bell}Нет в наличии</span></div><div class="on-size-options" role="group" aria-label="Размеры этой модели">${rows.map(r=>{
   const label=r.status==='available'?'доступен по последней проверке':r.status==='sold_out'?(subscribed(r.value)?'уведомление запрошено':'нет в наличии, сообщить о поступлении'):'наличие нужно уточнить';
   return `<button class="on-size-option ${r.status}" data-on-size="${r.value}" aria-label="EU ${sizeDisplay(r.value)} — ${label}" ${r.status==='available'?`aria-pressed="${selected===r.value}"`:''}><span>${sizeDisplay(r.value)}</span>${r.status==='sold_out'?(subscribed(r.value)?'<span aria-hidden="true">✓</span>':bell):r.status==='unknown'?'<span aria-hidden="true">?</span>':''}</button>`;
  }).join('')}</div>${rows.length?'':'<p>Размеры пока не загружены.</p>'}<p class="on-size-explanation">* По последней проверке. При выборе размера уточним наличие. Колокольчик — сообщить о поступлении; «?» — уточнить.</p><p class="on-size-date">${escape(dateText)}</p>`,'<button class="secondary full" id="on-size-refresh">Проверить ещё раз</button>');
  dialog.querySelectorAll('[data-on-size]').forEach(button=>button.onclick=()=>{
   if(!isCurrent(product.id))return dialog.close();
   const row=rows.find(r=>r.value===button.dataset.onSize);
   if(row.status==='sold_out'){notify(row);return;}
   selected=row.value;select(product,row);dialog.close();
  });
  $('#on-size-refresh').onclick=()=>load();if(focusValue)$(`[data-on-size="${focusValue}"]`)?.focus({preventScroll:true});
 }
 function notify(row,error=''){
  const exists=subscribed(row.value);
  shell(exists?'Уведомление запрошено':'Сообщить о поступлении',`<div class="on-notify-icon">${bell}</div><h3 class="on-notify-size">Размер EU ${sizeDisplay(row.value)}</h3><p class="on-notify-copy">Одно уведомление в Telegram, только для этой модели и размера. Запрос действует 90 дней. Его можно отменить здесь.</p>${error?`<p class="on-size-alert" role="alert">${escape(error)}</p>`:''}`,
   `<button id="on-notify-confirm" class="${exists?'secondary':'primary'} full">${exists?'Отменить уведомление':'Сообщить о поступлении'}</button><button id="on-notify-back" class="text-button full">К размерам</button>`);
  $('#on-notify-back').onclick=()=>grid(row.value);
  $('#on-notify-confirm').onclick=async()=>{
   const token=revision,id=product.id,button=$('#on-notify-confirm');button.disabled=true;button.textContent='Сохраняем…';
   try{
    const result=await client.restock(id,row.value,exists?'cancel':'subscribe');
    if(!current(token,id))return;
    subscriptions=result.subscriptions||[];if(exists)grid(row.value);else notify(row);
   }catch(error){
    if(!current(token,id))return;
    if(error.status===403){
     notify(row,'Разрешите боту отправлять сообщения, затем закройте и снова откройте каталог. Подписка ещё не создана.');
     const button=$('#on-notify-confirm');button.textContent='Разрешить сообщения';
     button.onclick=()=>{if(typeof tg?.requestWriteAccess==='function')tg.requestWriteAccess(()=>{});};
    }else notify(row,'Не удалось сохранить запрос. Попробуйте ещё раз.');
   }
  };
 }
 async function load(){
  const token=++revision,id=product.id;
  shell('Размеры · EU','<div class="on-size-loading" role="status"><span class="spinner"></span><span>Проверяем размеры…</span></div>');
  try{
   const result=await client.availability(id);
   if(!current(token,id))return;
   if(result.failed)throw new Error('Unavailable');
   rows=observedSizes(product,result.sizes||[]);subscriptions=result.subscriptions||[];grid();
  }catch{
   if(!current(token,id))return;
   shell('Не удалось проверить','<p class="on-size-alert" role="alert">Нет ответа. Это не означает, что размеры закончились.</p>','<button id="on-size-retry" class="primary full">Попробовать снова</button><button id="on-size-manual" class="secondary full">Выбрать размер для уточнения</button>');
   $('#on-size-retry').onclick=()=>load();$('#on-size-manual').onclick=()=>{rows=observedSizes(product);grid();};
  }
 }
 dialog.addEventListener('close',()=>{if(dialog.open)return;revision++;if(opener?.isConnected)opener.focus({preventScroll:true});});
 return {open(p,size){if(dialog.open||!isCurrent(p.id))return;product=p;selected=normalizeSize(size);opener=document.activeElement;shell('Размеры · EU','');dialog.showModal();void load();}};
}
