// Compact canonical size observations; never infer stock from missing data.
export function normalizeSize(value){
 const text=String(value??'').trim().replace(',','.');
 return /^\d{2}(?:\.\d)?$/.test(text)?String(Number(text)):null;
}
export const sizeDisplay=value=>String(value).replace('.',',');
export const selectedSizes=f=>[...new Set((Array.isArray(f.selectedSizes)?f.selectedSizes:[]).map(normalizeSize).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
export const knownOrderableSizes=p=>p.sourceId==='on_running_it'?[...new Set((p.sizeAvailability||[]).filter(s=>{const age=Date.now()-Date.parse(s.observedAt);return ['available','on_order'].includes(s.status)&&Number.isFinite(age)&&age>=-60000&&age<6*3600000;}).map(s=>normalizeSize(s.value)).filter(Boolean))]:[];
export const matchesSizes=(p,values)=>!values.length||knownOrderableSizes(p).some(s=>values.includes(s));
export function sizeFacets(pool,selected=[]){
 const keys=new Set(selected),counts=new Map();
 for(const p of pool.filter(p=>p.sourceId==='on_running_it')){
  for(const s of p.sizeAvailability||[]){const value=normalizeSize(s.value);if(value)keys.add(value);}
  for(const value of knownOrderableSizes(p))counts.set(value,(counts.get(value)||0)+1);
 }
 return [...keys].sort((a,b)=>Number(a)-Number(b)).map(value=>({value,count:counts.get(value)||0}));
}
