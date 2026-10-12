// Local UAT fixture resolver only; never imported by the production client.
export function previewProduct(products,{id,publicationId}={}){
  if(publicationId!=null){
    const requested=Number(publicationId);
    if(!Number.isSafeInteger(requested)||requested<=0)return null;
    for(const product of products){
      const links=product.telegramPublications||[];
      const link=links.find(item=>Number(item.id)===requested);
      if(link)return {...product,telegramPublicationId:requested,telegramPostUrl:link.url};
      if(!links.length&&Number(product.telegramPublicationId)===requested)return product;
    }
    return null;
  }
  const product=products.find(item=>item.id===Number(id));
  if(!product)return null;
  // A product-only launch cannot guess which of several posts was clicked.
  return product.telegramPublications?.length>1
    ? {...product,telegramPublicationId:null,telegramPostUrl:null}
    : product;
}
