import {departmentOf,departmentLabel,categoryOf,categoryLabel,modelName,modelLabel,productTitle,colorLabel,jewelryMaterial,filterProducts,blankFilters,validPrice} from './catalog-core.mjs?v=20261010-discovery';
export {departmentLabel,productTitle,modelLabel,colorLabel,validPrice};
export const initial=()=>({catalog:[],brand:[],gender:[],type:[],model:[],color:[],size:[],material:[],min:'',max:'',period:'all',discount:'all'});
export const multi=['catalog','brand','gender','type','model','color','size','material'];
export const labels={catalog:'Каталог',brand:'Бренд',gender:'Для кого',type:'Тип товара',model:'Модель / коллекция',color:'Цвет',size:'Размер',material:'Материал',min:'Цена от',max:'Цена до',period:'Дата публикации',discount:'Скидка'};
export function values(p,k){
 if(k==='catalog')return [departmentOf(p)];
 if(k==='type'){
  const c=categoryOf(p),n=productTitle(p).toLowerCase();
  if(c==='jewelry')return [n.startsWith('кольцо')?'Кольца':n.startsWith('подвеска')?'Подвески':categoryLabel(c)];
  return [categoryLabel(c)];
 }
 if(k==='model')return [modelLabel(modelName(p))].filter(Boolean);
 if(k==='color')return [colorLabel(p.color)].filter(Boolean);
 // List facets accept verified available sizes only; the model's full size grid
 // is not stock. The API owns freshness and must omit expired observations.
 if(k==='size')return Date.parse(p.availabilityValidUntil||'')>Date.now()?[...new Set((p.availableSizes||[]).map(s=>String(s).replace(',','.')))]:[];
 if(k==='material'){const m=jewelryMaterial(p);return m&&m!=='Уточним в личном сообщении'?m.split(' · '):[];}
 return p[k]?[String(p[k])]:[];
}
export const label=(k,v)=>k==='catalog'?departmentLabel(v):k==='gender'?({women:'Женщинам',men:'Мужчинам',unisex:'Унисекс'}[v]||v):k==='size'?v.replace('.',','):v;
export function productCount(n){const last=n%10,lastTwo=n%100;return n+' '+(last===1&&lastTwo!==11?'товар':last>=2&&last<=4&&(lastTwo<12||lastTwo>14)?'товара':'товаров');}
export function discountPercent(p){
 // No source-price discount is presented as an approved customer discount.
 if(!validPrice(p)||p.discountVerified!==true||p.previousPriceCurrency!=='RUB'||!Number.isFinite(p.previousPriceAmount)||p.previousPriceAmount<=p.priceAmount)return null;
 return Math.round(100*(1-p.priceAmount/p.previousPriceAmount));
}
export function publicationTime(p){const t=Date.parse(p.publishedAt||'');return Number.isFinite(t)?t:null;}
export function priceError(f){return [f.min,f.max].some(x=>x!==''&&(!/^\d+$/.test(String(x))||!Number.isSafeInteger(Number(x))))?'Введите цену в целых рублях.':f.min!==''&&f.max!==''&&Number(f.min)>Number(f.max)?'Цена «от» не должна превышать цену «до».':'';}
export function matches(products,f,q='',exclude='',now=Date.now()){
 return filterProducts(products,blankFilters(),q).filter(p=>{
  if(multi.some(k=>k!==exclude&&f[k]?.length&&!f[k].some(v=>values(p,k).includes(v))))return false;
  if(exclude!=='price'&&(f.min!==''||f.max!=='')){if(!validPrice(p))return false;if(f.min!==''&&p.priceAmount<Number(f.min))return false;if(f.max!==''&&p.priceAmount>Number(f.max))return false;}
  if(exclude!=='period'&&f.period!=='all'){const t=publicationTime(p);if(t===null||t>now||now-t>Number(f.period)*86400000)return false;}
  if(exclude!=='discount'&&f.discount!=='all'){const d=discountPercent(p);if(d===null||d<Number(f.discount))return false;}
  return true;
 });
}
export function facets(products,f,q,k){const counts=new Map();for(const p of matches(products,f,q,k))for(const v of values(p,k))counts.set(v,(counts.get(v)||0)+1);for(const v of f[k]||[])if(!counts.has(v))counts.set(v,0);return [...counts].sort(([a],[b])=>a.localeCompare(b,'ru',{numeric:true})).map(([value,count])=>({value,count}));}
export function sortItems(p,sort){
 if(sort==='curated'){
  // Brand overview, not a claim of popularity or recent publication.
  const groups=new Map();for(const item of p){if(!groups.has(item.brand))groups.set(item.brand,[]);groups.get(item.brand).push(item);}
  const out=[];for(let i=0;out.length<p.length;i++)for(const group of groups.values())if(group[i])out.push(group[i]);return out;
 }
 return [...p].sort((a,b)=>sort==='price-low'?(validPrice(a)?a.priceAmount:Infinity)-(validPrice(b)?b.priceAmount:Infinity)||a.id-b.id:sort==='price-high'?(validPrice(b)?b.priceAmount:-Infinity)-(validPrice(a)?a.priceAmount:-Infinity)||a.id-b.id:sort==='newest'?(publicationTime(b)??-Infinity)-(publicationTime(a)??-Infinity)||a.id-b.id:sort==='discount'?(discountPercent(b)??-Infinity)-(discountPercent(a)??-Infinity)||a.id-b.id:sort==='name'?productTitle(a).localeCompare(productTitle(b),'ru')||a.id-b.id:0);
}
export const countFilters=f=>multi.reduce((n,k)=>n+f[k].length,0)+(f.min!==''||f.max!==''?1:0)+(f.period!=='all'?1:0)+(f.discount!=='all'?1:0);
