// Data-driven catalog rules. No API calls and no assumptions about stock.
export const blankFilters=()=>({brand:'all',department:'all',category:'all',gender:'all',model:'all',color:'all',size:'all',publication:'all',minPrice:'',maxPrice:''});
const messikaCollections=['Messika Care(s)','Imperial Move','Move Classique','Move Titanium','Move Romane','Move Link','Move Noa','Move Uno','Lucky Move','So Move','D-Vibes','My Twin','Moderniste','Fiery'];
export const modelName=p=>{
  if(p.brand==='Messika'){
    if(String(p.model||'').trim())return String(p.model).trim();
    const label=String(p.name||'').toLocaleLowerCase('ru');
    // Only verified collection names become model facets. An unknown name
    // remains searchable as a product, without creating an Italian facet.
    return messikaCollections.find(collection=>label.includes(collection.toLocaleLowerCase('ru')))||'';
  }
  return (p.model||p.name||'').replace(/\s+da (uomo|donna)/gi,'').replace(/^Borsa /,'').replace(/^Portafoglio con catenella /,'').replace(/ con catenella/,'').trim();
};
const categoryLabels={shoes:'Обувь','bags-accessories':'Сумки и аксессуары',bags:'Сумки',jewelry:'Украшения',watches:'Часы',clothing:'Одежда',accessories:'Аксессуары',rings:'Кольца','wedding-rings':'Обручальные кольца',bracelets:'Браслеты',earrings:'Серьги',necklaces:'Колье и цепочки',pendants:'Подвески','necklaces-pendants':'Колье и подвески',other:'Другие товары'};
const categoryAliases={'wedding band':'wedding-rings',nozze:'wedding-rings',fede:'wedding-rings',ring:'rings',anello:'rings','кольцо':'rings',bracelet:'bracelets',bracciale:'bracelets','браслет':'bracelets',earrings:'earrings',orecchini:'earrings','серьги':'earrings',pendants:'pendants',pendente:'pendants','подвеска':'pendants',necklace:'necklaces',collana:'necklaces','колье':'necklaces',necklaces_and_pendants:'necklaces-pendants','steel watches':'watches',watches:'watches',watch:'watches',orologi:'watches',orologio:'watches',orologi_gioiello:'watches',jewelry_watches:'watches','часы':'watches',gioielleria:'jewelry',gioielli:'jewelry'};
// The legacy snapshot labels its bag/accessory category with a brand name.
Object.assign(categoryLabels,{eyewear:'Очки',coats:'Пальто и тренчи',jackets:'Куртки и пуховики',dresses:'Платья',shirts:'Рубашки и блузы',knitwear:'Трикотаж',trousers:'Брюки и джинсы',skirts:'Юбки',shorts:'Шорты',suits:'Костюмы',tops:'Футболки и топы',belts:'Ремни',wallets:'Кошельки',hats:'Головные уборы',scarves:'Шарфы',backpacks:'Рюкзаки'});
for(const [canonical,aliases] of Object.entries({
  shoes:['scarpe','sneakers','stivali','обувь','кроссовки','кеды','лоферы','мюли','слингбэки','сандалии','туфли','сапоги','шлепки','угги'],
  bags:['bag','bags','borsa','borse','сумка','сумки','портфель'],backpacks:['backpack','рюкзак'],
  clothing:['abbigliamento','одежда'],accessories:['accessori','аксессуары','portachiavi'],
  eyewear:['occhiali','очки'],coats:['cappotto','cappotti','пальто','плащ','тренч'],
  jackets:['giacca','giacche','piumino','пуховик','куртка'],dresses:['abito','vestito','платье'],
  shirts:['camicia','camicie','рубашка','блуза'],knitwear:['maglione','трикотаж','свитер','толстовка'],
  trousers:['pantaloni','брюки','джинсы'],skirts:['gonna','юбка'],shorts:['шорты'],suits:['костюм'],
  tops:['polo','t-shirt','поло','майка','футболка','топ'],belts:['cintura','ремень'],wallets:['portafoglio','кошелек','кошелёк','cardholder'],hats:['кепки','панама'],scarves:['шарф']
}))for(const alias of aliases)categoryAliases[alias]=canonical;
export const categoryOf=p=>p.category==='Louis Vuitton'?'bags-accessories':categoryAliases[String(p.category||'').trim().toLowerCase()]||(categoryLabels[p.category]?p.category:'other');
export const categoryLabel=value=>categoryLabels[value]||'Другие товары';
export const departments=[['all','Все товары'],['clothing','Одежда'],['shoes','Обувь'],['bags','Сумки'],['jewelry','Украшения'],['watches','Часы'],['accessories','Аксессуары']];
export function departmentOf(p){
  const category=categoryOf(p);
  if(['rings','wedding-rings','bracelets','earrings','necklaces','pendants','necklaces-pendants','jewelry'].includes(category))return 'jewelry';
  if(['coats','jackets','dresses','shirts','knitwear','trousers','skirts','shorts','suits','tops','clothing'].includes(category))return 'clothing';
  if(['bags','bags-accessories','backpacks'].includes(category))return 'bags';
  if(['eyewear','belts','wallets','hats','scarves','accessories'].includes(category))return 'accessories';
  return category;
}
export const departmentLabel=value=>departments.find(([key])=>key===value)?.[1]||'Другие товары';
export const hasPublishedPost=p=>typeof p.telegramPostUrl==='string'&&!/\s/.test(p.telegramPostUrl)&&/^https:\/\/t\.me\/(?:c\/[1-9][0-9]*|[A-Za-z][A-Za-z0-9_]{4,31})\/(?:[1-9][0-9]*\/)?[1-9][0-9]*$/.test(p.telegramPostUrl);
export const watchReferenceLabel=p=>categoryOf(p)==='watches'&&String(p.reference||'').trim()?`Арт. ${String(p.reference).trim()}`:null;
const jewelryBrand=p=>['Cartier','Van Cleef & Arpels','Messika'].includes(p.brand);
// A collection/model is a filter, not the identity of a jewel. Keep the full
// source product name (width, size and collection), translating only known nouns.
export function productTitle(p){
  // Watches retain the exact variant name, not just the collection. Category
  // labels are presentation only: they never establish source/reference identity.
  if(categoryOf(p)==='watches'){
    const variant=String(p.name||p.model||'').replace(/&ndash;/gi,'–').replace(/\b(?:watches|watch|orologi|orologio)\b/gi,'').replace(/\bautomatico\b/gi,'автоматические').replace(/\bmm\b/gi,'мм').replace(/\s+/g,' ').trim();
    return /^Часы(?:\s|$)/i.test(variant)?variant:`Часы${variant?' '+variant:''}`;
  }
  if(!jewelryBrand(p))return modelName(p);
  let text=p.name||p.model||'';
  if(p.brand==='Cartier')for(const [pattern,replacement] of [
    [/^(.+?) single hoop earring, mini model$/i,(_,model)=>`Одиночная серьга-кольцо ${model}, мини-модель`],
    [/^(.+?) pendant$/i,(_,model)=>`Подвеска ${model}`]
  ])text=text.replace(pattern,replacement);
  if(p.brand==='Messika')for(const [pattern,replacement] of [
    [/\bBracciale rigido\b/gi,'Жёсткий браслет'],[/\bAnello chevalier\b/gi,'Кольцо-печатка'],
    [/\bAnello rivière\b/gi,'Кольцо-дорожка'],[/\bCollana rivière\b/gi,'Колье-ривьера'],
    [/\bCollana (?:choker|girocollo)\b/gi,'Колье-чокер'],[/\bCollana cravatta\b/gi,'Колье-галстук'],
    [/\bCollana So Move pavé/gi,'Колье So Move с паве'],
    [/\bOrecchini (?:pendenti|a cerchio)\b/gi,match=>match.toLowerCase().includes('pendenti')?'Серьги-подвески':'Серьги-кольца'],
    [/\bOrecchini multiformi\b/gi,'Серьги разных форм'],
    [/^(.+?) pavé stud earrings$/i,(_,model)=>`Серьги-пусеты ${model} с паве`],
    [/^(.+?) asymmetrical earrings$/i,(_,model)=>`Асимметричные серьги ${model}`],
    [/^(.+?) bracelet$/i,(_,model)=>`Браслет ${model}`]
  ])text=text.replace(pattern,replacement);
  for(const [pattern,replacement] of [[/fede nuziale|wedding band|\bfede\b/gi,'Обручальное кольцо'],[/collana|necklace/gi,'Колье'],[/catena/gi,'Цепочка'],[/pendente|pendant/gi,'Подвеска'],[/bracciale|bracelets?/gi,'Браслет'],[/orecchini|earrings/gi,'Серьги'],[/anello|\bring\b/gi,'Кольцо'],[/\bwatch\b/gi,'Часы'],[/small model|modello piccolo/gi,'малая модель'],[/medium model|modello medio/gi,'средняя модель'],[/large model|modello grande/gi,'большая модель'],[/mini model|modello mini/gi,'мини-модель'],[/\bwidth\b/gi,'ширина'],[/\bmm\b/gi,'мм'],[/\bcm\b/gi,'см']])text=text.replace(pattern,replacement);
  if(p.brand==='Messika')for(const [pattern,replacement] of [
    [/con cordino/gi,'на шнурке'],[/con semi pavé/gi,'с частичным паве'],[/con charm e pavé/gi,'с подвеской и паве'],
    [/con charm/gi,'с подвеской'],[/con pavé/gi,'с паве'],[/con diamanti/gi,'с бриллиантами'],
    [/con madreperla bianca/gi,'с белым перламутром'],[/con malachite/gi,'с малахитом'],
    [/modello mini/gi,'мини-модель'],[/\bcesellat[oa]\b/gi,'с чеканкой'],
    [/\bantracite\b/gi,'антрацитового цвета'],[/\bnero\b/gi,'чёрного цвета'],[/\bgiallo\b/gi,'жёлтого цвета'],
    [/\bturchese\b/gi,'бирюзового цвета'],[/\brosa\b/gi,'розового цвета'],[/\barancione\b/gi,'оранжевого цвета']
  ])text=text.replace(pattern,replacement);
  return text.replace(/ciondolo/gi,'Подвеска').replace(/a 1 fiore/gi,'с одним цветком').replace(/fiore di prunus/gi,'цветок сливы').replace(/\(Ariete\)/gi,'(Овен)').trim();
}
export function jewelryMaterial(p){
  if(!jewelryBrand(p))return null;
  const text=String(p.description||'');
  const facts=[[/oro giallo|yellow gold/i,'Жёлтое золото'],[/oro rosa|rose gold|pink gold/i,'Розовое золото'],[/oro bianco|white gold/i,'Белое золото'],[/platino|platinum/i,'Платина'],[/stainless steel|\bsteel\b|acciaio/i,'Сталь']];
  // Never label the whole marketing description as a material or infer purity.
  return facts.filter(([pattern])=>pattern.test(text)).map(([,label])=>label).join(' · ')||'Уточним в личном сообщении';
}
export const genderLabel=value=>({men:'Мужские',women:'Женские',unisex:'Унисекс'}[value]||'Не указан');
export const colorLabels={'Nero':'Чёрный','Rosso Ciliegia':'Вишнёвый','Rosa Ballerina':'Нежно-розовый','Altri pellami':'Кожа','Fashion Leather':'Кожа','GAZON':'Зелёный'};
const colorWords={black:'Чёрный',white:'Белый',sand:'Песочный',glacier:'Ледяной',sakura:'Сакура',eclipse:'Графитовый',seedling:'Светло-зелёный',ice:'Ледяной',chai:'Бежевый',frost:'Морозный',evergreen:'Тёмно-зелёный',pearl:'Жемчужный',ivory:'Слоновая кость',cream:'Кремовый',silver:'Серебристый',navy:'Тёмно-синий',blue:'Синий',green:'Зелёный',pink:'Розовый',red:'Красный',brown:'Коричневый',beige:'Бежевый',grey:'Серый',gray:'Серый',giallo:'Жёлтый',bianco:'Белый',rosa:'Розовый',nero:'Чёрный'};
Object.assign(colorWords,{asphalt:'Асфальт',lima:'Лима',desert:'Пустынный',earth:'Земляной',pebble:'Галька',fade:'Фейд',lime:'Лайм',fog:'Туман',cinder:'Пепельный',gourami:'Гурами',rock:'Каменный',wolf:'Вольф',honeydew:'Медовая роса',indigo:'Индиго',iceberg:'Айсберг',iron:'Железный',creek:'Крик',midnight:'Полночь',juniper:'Можжевельник',limelight:'Лаймлайт',lilac:'Сиреневый',linen:'Льняной',magnet:'Магнит',mineral:'Минеральный',obsidian:'Обсидиан',pelican:'Пеликан',peony:'Пион',heather:'Вереск',sailor:'Сэйлор',sunstone:'Солнечный камень',reef:'Риф',tempest:'Шторм',horizon:'Горизонт',chambray:'Шамбре',ore:'Руда'});
Object.assign(colorLabels,{'All White':'Белый','Silver Blue':'Серебристо-голубой','Monogram Rouge':'Monogram, красный','Monogram Dune':'Monogram Дюна',Dune:'Дюна','Boldly Black':'Чёрный','Monogram Reverse':'Monogram Reverse','Link Quartz':'Линк Кварц',Azur:'Азур'});
export const colorLabel=value=>colorLabels[value]||String(value||'').split(/\s*\|\s*/).map(word=>colorWords[word.toLowerCase()]||word).join(' / ');
export const modelLabel=value=>{
  const text=String(value||'');
  // Never run jewelry unit translation over another brand's model code (LV MM).
  if(!/^(anello|anelli|fedi|fede|orecchini|pendente|ciondolo|collan[ae]|braccial[ei])\b/i.test(text))return text;
  return productTitle({brand:'Van Cleef & Arpels',name:text}).replace(/fedi nuziali/gi,'Обручальные кольца').replace(/\banelli\b/gi,'Кольца').replace(/\bbracciali\b/gi,'Браслеты').replace(/collane e pendenti/gi,'Колье и подвески');
};
const norm=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('ru').replaceAll('ё','е').replace(/[|·/–—_-]/g,' ').replace(/\s+/g,' ').trim();
const brandAliases=[[/\b(lv|louisvuitton)\b/g,'louis vuitton'],[/(^|\s)(лв|луи виттон|луи вуиттон)(?=\s|$)/g,' louis vuitton'],[/(^|\s)(ван клиф(?: энд арпелс)?|ванклиф)(?=\s|$)/g,' van cleef'],[/(^|\s)картье(?=\s|$)/g,' cartier'],[/(^|\s)мессика(?=\s|$)/g,' messika'],[/(^|\s)прада(?=\s|$)/g,' prada'],[/(^|\s)гуччи(?=\s|$)/g,' gucci'],[/(^|\s)диор(?=\s|$)/g,' dior'],[/(^|\s)монклер(?=\s|$)/g,' moncler']];
const searchTerms=q=>brandAliases.reduce((text,[pattern,replacement])=>text.replace(pattern,replacement),norm(q)).split(' ').filter(Boolean);
export const validPrice=p=>p.priceMode!=='on_request'&&p.priceCurrency==='RUB'&&Number.isFinite(p.priceAmount)&&p.priceAmount>0;
export function priceError(f){
  for(const k of ['minPrice','maxPrice'])if(f[k]!==''&&(!/^\d+$/.test(String(f[k]))||!Number.isSafeInteger(Number(f[k]))))return 'Введите цену в целых рублях, не меньше 0.';
  return f.minPrice!==''&&f.maxPrice!==''&&Number(f.minPrice)>Number(f.maxPrice)?'Цена «от» не должна превышать цену «до».':'';
}
export function valuesFor(p,key){
  if(key==='department')return [departmentOf(p)];
  if(key==='publication')return hasPublishedPost(p)?['telegram']:[];
  if(key==='category')return [categoryOf(p)];
  if(key==='model')return modelName(p)?[modelName(p)]:[];
  if(key==='size')return [...new Set((p.sizes||[]).map(s=>String(s.value)).filter(Boolean))];
  return p[key]?[String(p[key])]:[];
}
export function filterProducts(products,filters=blankFilters(),query='',exclude=''){
  const terms=searchTerms(query);
  return products.filter(p=>{
    const haystack=norm([p.name,productTitle(p),p.brand,p.reference,modelName(p),modelLabel(modelName(p)),p.color,colorLabel(p.color),categoryLabel(categoryOf(p)),departmentLabel(departmentOf(p)),genderLabel(p.gender)].join(' '));
    if(!terms.every(term=>haystack.includes(term)))return false;
    for(const key of ['brand','department','category','gender','model','color','size','publication'])if(key!==exclude&&filters[key]!=null&&filters[key]!=='all'&&!valuesFor(p,key).includes(filters[key]))return false;
    if(exclude!=='price'&&(filters.minPrice!==''||filters.maxPrice!=='')){
      if(!validPrice(p))return false;
      if(filters.minPrice!==''&&p.priceAmount<Number(filters.minPrice))return false;
      if(filters.maxPrice!==''&&p.priceAmount>Number(filters.maxPrice))return false;
    }
    return true;
  });
}
export function priceFilterHint(products,filters=blankFilters(),query=''){
  const pool=filterProducts(products,filters,query,'price');
  if(!pool.length)return 'Нет товаров по текущему запросу';
  const priced=pool.filter(validPrice);
  const onRequest=pool.some(p=>p.priceMode==='on_request');
  const range=priced.length?`${Math.min(...priced.map(p=>p.priceAmount)).toLocaleString('ru')} – ${Math.max(...priced.map(p=>p.priceAmount)).toLocaleString('ru')} ₽`:'';
  if(onRequest)return `${range?range+' · ':''}Товары «Цена по запросу» не входят в фильтр по сумме.`;
  return range||'Цена этих товаров уточняется';
}
export function facets(products,filters,query,key){
  const pool=filterProducts(products,filters,query,key),counts=new Map();
  for(const p of pool)for(const value of valuesFor(p,key))counts.set(value,(counts.get(value)||0)+1);
  if(filters[key]!=='all'&&!counts.has(filters[key]))counts.set(filters[key],0);
  return [...counts].sort(([a],[b])=>a.localeCompare(b,'ru',{numeric:true})).map(([value,count])=>({value,count}));
}
export function setFilter(filters,key,value,products=null,query=''){
  const next={...filters,[key]:value};
  if(key==='brand'||key==='category'||key==='department'){
    const children=key==='department'?['category','model','color','size']:['model','color','size'];
    const selected=Object.fromEntries(children.map(child=>[child,next[child]]));
    for(const child of children)next[child]='all';
    // Brand/category changes preserve compatible choices. Clear only a child
    // that has no matching product under the new parent and prior choices.
    if(Array.isArray(products))for(const child of children){
      if(selected[child]==='all')continue;
      const candidate={...next,[child]:selected[child]};
      if(filterProducts(products,candidate,query,'price').length)next[child]=selected[child];
    }
  }
  return next;
}
export const activeCount=f=>Object.entries(f).filter(([k,v])=>k==='minPrice'||k==='maxPrice'?v!=='':v!=='all').length;

// The authenticated catalog is the sole source of visible brands and counts.
// Do not infer publication from a Telegram topic or prefetch product details.
export function brandCollections(products){
  const groups=new Map();
  for(const product of products){
    if(!product.brand?.trim())continue;
    if(!groups.has(product.brand))groups.set(product.brand,{brand:product.brand,products:[],categories:new Set()});
    const group=groups.get(product.brand);
    group.products.push(product);group.categories.add(categoryOf(product));
  }
  return [...groups.values()].sort((a,b)=>a.brand.localeCompare(b.brand,'ru')).map(group=>({
    brand:group.brand,count:group.products.length,
    categories:[...group.categories].map(categoryLabel),
    products:group.products,
  }));
}
