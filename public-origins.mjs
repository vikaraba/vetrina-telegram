// Public build configuration. The checked-in source always targets production.
// scripts/build.mjs may emit the one approved staging origin into dist/.
export const SUPABASE_ORIGIN='https://dbgcpgteuwkxqjgvppfp.supabase.co';
export const API_BASE=SUPABASE_ORIGIN+'/functions/v1/telegram-storefront';
export const STORAGE_IMAGE_BASE=SUPABASE_ORIGIN+'/storage/v1/object/public/product-images/';
