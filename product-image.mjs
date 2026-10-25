import {SUPABASE_ORIGIN,STORAGE_IMAGE_BASE} from './public-origins.mjs?v=20261026-c312-origins';

const PUBLIC_IMAGE_PATH='/storage/v1/object/public/product-images/';
export function productImageUrl(image){
  if(image?.url){
    try{
      const url=new URL(image.url);
      return url.origin===SUPABASE_ORIGIN&&!url.username&&!url.password&&url.pathname.startsWith(PUBLIC_IMAGE_PATH)?url.href:'';
    }catch{return '';}
  }
  if(image?.bucket!=='product-images'||!image?.path)return '';
  const parts=image.path.split('/');
  if(parts.some(part=>!part||part==='.'||part==='..'))return '';
  return STORAGE_IMAGE_BASE+parts.map(encodeURIComponent).join('/');
}
