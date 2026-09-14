'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.EdgeTabs=api;
  if(typeof document!=='undefined')api.install();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const tabs=['cockpit','navigation','data','radio','spotify','cargo','proximity','port','systems'];
  function adjacent(current,direction){
    const index=Math.max(0,tabs.indexOf(current));
    return tabs[(index+(direction==='next'?1:-1)+tabs.length)%tabs.length];
  }
  function classify(startX,endX,deltaY,width,elapsed){
    const edge=32,dx=endX-startX;
    if(elapsed>700||Math.abs(dx)<60||Math.abs(dx)<Math.abs(deltaY)*1.4)return null;
    if(startX<=edge&&dx>0)return'previous';
    if(startX>=width-edge&&dx<0)return'next';
    return null;
  }
  function install(){
    let gesture=null;
    document.addEventListener('pointerdown',event=>{
      if(document.body.classList.contains('booting'))return;
      if(!event.isPrimary||event.button>0||event.target.closest('input,select,textarea,audio,[contenteditable]'))return;
      if(event.clientX>32&&event.clientX<innerWidth-32)return;
      gesture={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};
    },{passive:true});
    document.addEventListener('pointerup',event=>{
      if(!gesture||event.pointerId!==gesture.id)return;
      const direction=classify(gesture.x,event.clientX,event.clientY-gesture.y,innerWidth,performance.now()-gesture.time);
      gesture=null;
      if(!direction)return;
      const current=document.querySelector('.view.active')?.id||'cockpit';
      showView(adjacent(current,direction));
    },{passive:true});
    document.addEventListener('pointercancel',()=>{gesture=null},{passive:true});
  }
  return{tabs,adjacent,classify,install};
});
