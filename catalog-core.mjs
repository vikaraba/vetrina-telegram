// Data-driven catalog rules. No API calls and no assumptions about stock.
export const blankFilters=()=>({brand:'all',category:'all',gender:'all',model:'all',color:'all',size:'all',minPrice:'',maxPrice:''});
export const modelName=p=>(p.model||p.name||'').replace(/\s+da (uomo|donna)/gi,'').replace(/^Borsa /,'').replace(/^Portafoglio con catenella /,'').replace(/ con catenella/,'').trim();
const categoryLabels={shoes:'Обувь','bags-accessories':'Сумки и аксессуары',bags:'Сумки',jewelry:'Украшения',watches:'Часы',clothing:'Одежда',accessories:'Аксессуары',rings:'Кольца','wedding-rings':'Обручальные кольца',bracelets:'Браслеты',earrings:'Серьги',necklaces:'Колье и цепочки',pendants:'Подвески','necklaces-pendants':'Колье и подвески',other:'Другие товары'};
const categoryAliases={'wedding band':'wedding-rings',nozze:'wedding-rings',fede:'wedding-rings',ring:'rings',anello:'rings',bracelet:'bracelets',bracciale:'bracelets',earrings:'earrings',orecchini:'earrings',pendants:'pendants',pendente:'pendants',necklace:'necklaces',collana:'necklaces',necklaces_and_pendants:'necklaces-pendants','steel watches':'watches',gioielleria:'jewelry',gioielli:'jewelry'};
// The legacy snapshot labels its bag/accessory category with a brand name.
export const categoryOf=p=>p.category==='Louis Vuitton'?'bags-accessories':categoryAliases[String(p.category||'').trim().toLowerCase()]||p.category||'other';
export const categoryLabel=value=>categoryLabels[value]||value;
const jewelryBrand=p=>['Cartier','Van Cleef & Arpels','Messika'].includes(p.brand);
// A collection/model is a filter, not the identity of a jewel. Keep the full
// source product name (width, size and collection), translating only known nouns.
export function productTitle(p){
  if(!jewelryBrand(p))return modelName(p);
  let text=p.name||p.model||'';
  for(const [pattern,replacement] of [[/fede nuziale|wedding band|\bfede\b/gi,'Обручальное кольцо'],[/collana|necklace/gi,'Колье'],[/catena/gi,'Цепочка'],[/pendente|pendant/gi,'Подвеска'],[/bracciale|bracelet/gi,'Браслет'],[/orecchini|earrings/gi,'Серьги'],[/anello|\bring\b/gi,'Кольцо'],[/\bwatch\b/gi,'Часы'],[/small model|modello piccolo/gi,'малая модель'],[/medium model|modello medio/gi,'средняя модель'],[/large model|modello grande/gi,'большая модель'],[/\bwidth\b/gi,'ширина'],[/\bmm\b/gi,'мм'],[/\bcm\b/gi,'см']])text=text.replace(pattern,replacement);
  if(p.brand==='Messika')for(const [pattern,replacement] of [[/con cordino/gi,'на шнурке'],[/con pavé/gi,'с паве'],[/con diamanti/gi,'с бриллиантами'],[/\bnero\b/gi,'чёрный'],[/\bgiallo\b/gi,'жёлтый'],[/\bturchese\b/gi,'бирюзовый']])text=text.replace(pattern,replacement);
  return text.trim();
}
export function jewelryMaterial(p){
  if(!jewelryBrand(p))return null;
  const text=String(p.description||'');
  const facts=[[/oro giallo|yellow gold/i,'Жёлтое золото'],[/oro rosa|rose gold|pink gold/i,'Розовое золото'],[/oro bianco|white gold/i,'Белое золото'],[/platino|platinum/i,'Платина'],[/stainless steel|\bsteel\b|acciaio/i,'Сталь']];
  // Never label the whole marketing description as a material or infer purity.
  return facts.filter(([pattern])=>pattern.test(text)).map(([,label])=>label).join(' · ')||'Уточним в личном сообщении';
}
export const genderLabel=value=>({men:'Мужские',women:'Женские',unisex:'Унисекс'}[value]||value);
export const colorLabels={'Nero':'Чёрный','Rosso Ciliegia':'Вишнёвый','Rosa Ballerina':'Нежно-розовый','Altri pellami':'Кожа','Fashion Leather':'Кожа','GAZON':'Зелёный'};
export const colorLabel=value=>colorLabels[value]||value;
const norm=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('ru').replace(/[|·/–—_-]/g,' ').replace(/\s+/g,' ').trim();
const searchTerms=q=>norm(q).replace(/\b(lv|louisvuitton)\b/g,'louis vuitton').replace(/(^|\s)(лв|луи виттон|луи вуиттон)(?=\s|$)/g,' louis vuitton').split(' ').filter(Boolean);
export const validPrice=p=>p.priceCurrency==='RUB'&&Number.isFinite(p.priceAmount)&&p.priceAmount>0;
export function priceError(f){
  for(const k of ['minPrice','maxPrice'])if(f[k]!==''&&(!/^\d+$/.test(String(f[k]))||!Number.isSafeInteger(Number(f[k]))))return 'Введите цену в целых рублях, не меньше 0.';
  return f.minPrice!==''&&f.maxPrice!==''&&Number(f.minPrice)>Number(f.maxPrice)?'Цена «от» не должна превышать цену «до».':'';
}
export function valuesFor(p,key){
  if(key==='category')return [categoryOf(p)];
  if(key==='model')return [modelName(p)];
  if(key==='size')return [...new Set((p.sizes||[]).map(s=>String(s.value)).filter(Boolean))];
  return p[key]?[String(p[key])]:[];
}
export function filterProducts(products,filters=blankFilters(),query='',exclude=''){
  const terms=searchTerms(query);
  return products.filter(p=>{
    const haystack=norm([p.name,productTitle(p),p.brand,p.reference,modelName(p),p.color,colorLabel(p.color),categoryLabel(categoryOf(p))].join(' '));
    if(!terms.every(term=>haystack.includes(term)))return false;
    for(const key of ['brand','category','gender','model','color','size'])if(key!==exclude&&filters[key]!=='all'&&!valuesFor(p,key).includes(filters[key]))return false;
    if(exclude!=='price'&&(filters.minPrice!==''||filters.maxPrice!=='')){
      if(!validPrice(p))return false;
      if(filters.minPrice!==''&&p.priceAmount<Number(filters.minPrice))return false;
      if(filters.maxPrice!==''&&p.priceAmount>Number(filters.maxPrice))return false;
    }
    return true;
  });
}
export function facets(products,filters,query,key){
  const pool=filterProducts(products,filters,query,key),counts=new Map();
  for(const p of pool)for(const value of valuesFor(p,key))counts.set(value,(counts.get(value)||0)+1);
  if(filters[key]!=='all'&&!counts.has(filters[key]))counts.set(filters[key],0);
  return [...counts].sort(([a],[b])=>a.localeCompare(b,'ru',{numeric:true})).map(([value,count])=>({value,count}));
}
export function setFilter(filters,key,value){
  const next={...filters,[key]:value};
  if(key==='brand'||key==='category')for(const child of ['model','color','size'])next[child]='all';
  return next;
}
export const activeCount=f=>Object.entries(f).filter(([k,v])=>k==='minPrice'||k==='maxPrice'?v!=='':v!=='all').length;
