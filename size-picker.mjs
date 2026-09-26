export const ROW_HEIGHT=56;
export const sizeValues=product=>[...new Set((product?.sizes||[]).map(s=>String(s.value??'').trim()).filter(Boolean))];
export const clampIndex=(index,count)=>Math.max(0,Math.min(Math.max(0,count-1),Math.round(Number(index)||0)));
export const indexAtScroll=(scrollTop,count)=>clampIndex(scrollTop/ROW_HEIGHT,count);

// Each request owns its product, size and outcome; only the latest may render.
export function createLatestCheck(){
  let revision=0;
  return {
    cancel(){revision++;},
    async run(request,resolve,commit){
      const current=++revision;
      commit({phase:'pending',...request});
      let outcome;
      try{outcome=await resolve(request);}catch{outcome='error';}
      if(current!==revision)return false;
      commit({phase:outcome,...request});
      return true;
    }
  };
}

export function createSizeWheel({list,onChange,onConfirm}){
  let options=[],index=0,frame=0;
  const paint=()=>{
    options.forEach((el,i)=>{el.setAttribute('aria-selected',String(i===index&&i>0));el.classList.toggle('is-current',i===index);});
    if(options[index])list.setAttribute('aria-activedescendant',options[index].id);
    onChange(index>0?options[index].dataset.value:null);
  };
  const choose=(next,{scroll=true}={})=>{
    index=clampIndex(next,options.length);
    paint();
    if(scroll)list.scrollTo({top:index*ROW_HEIGHT,behavior:'instant'});
  };
  list.addEventListener('scroll',()=>{
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>choose(indexAtScroll(list.scrollTop,options.length),{scroll:false}));
  },{passive:true});
  list.addEventListener('click',e=>{const option=e.target.closest('[role=option]');if(option&&list.contains(option))choose(options.indexOf(option));});
  list.addEventListener('keydown',e=>{
    const next={ArrowDown:index+1,ArrowUp:index-1,PageDown:index+3,PageUp:index-3,Home:1,End:options.length-1}[e.key];
    if(next!==undefined){e.preventDefault();choose(next);}
    else if(e.key==='Enter'&&index>0){e.preventDefault();onConfirm();}
  });
  return {
    open(selected){
      cancelAnimationFrame(frame);
      options=[...list.querySelectorAll('[role=option]')];
      choose(selected?options.findIndex(el=>el.dataset.value===selected):0);
      list.focus({preventScroll:true});
    },
    move(delta){choose(index+delta);list.focus({preventScroll:true});},
    value(){return index>0?options[index]?.dataset.value:null;},
    settle(){choose(indexAtScroll(list.scrollTop,options.length),{scroll:false});return index>0?options[index]?.dataset.value:null;},
    cancel(){cancelAnimationFrame(frame);}
  };
}
