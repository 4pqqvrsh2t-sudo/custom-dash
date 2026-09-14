'use strict';
(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CargoInventory=api.CargoInventory;if(typeof document!=='undefined')api.install();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const CATEGORIES=['Food','Liquid','Tools / equipment','Packages','Emergency / safety','Personal','Miscellaneous'];
  class CargoInventory{
    constructor(storage){this.storage=storage;this.items=[];try{const saved=JSON.parse(storage?.getItem('surface-cargo')||'[]');if(Array.isArray(saved))this.items=saved.filter(CargoInventory.valid).slice(0,100)}catch{}}
    static valid(v){return v&&typeof v.id==='string'&&typeof v.label==='string'&&v.label.length>0&&v.label.length<=80&&CATEGORIES.includes(v.category)&&Number.isInteger(v.quantity)&&v.quantity>=1&&v.quantity<=999;}
    add(v){const source=['vision','camera'].includes(v.source)?v.source:'verified',item={id:(globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random()).toString(),label:String(v.label||'').trim().slice(0,80),category:v.category,quantity:Number(v.quantity),source,added:new Date().toISOString()};if(!CargoInventory.valid(item))throw Error('Complete the item, category and quantity.');this.items.unshift(item);this.save();return item;}
    remove(id){this.items=this.items.filter(v=>v.id!==id);this.save();}
    save(){try{this.storage?.setItem('surface-cargo',JSON.stringify(this.items))}catch{}}
  }
  function install(){
    let storage=null;try{storage=globalThis.localStorage}catch{}const q=s=>document.querySelector(s),video=q('#cargo-camera'),canvas=q('#cargo-capture'),status=q('#cargo-status'),inventory=new CargoInventory(storage);let stream=null,analyzer=null,lastSpeed=null,captured=false,visionSuggested=false;
    const setStatus=(message,state='')=>{status.textContent=message;status.dataset.state=state};
    function stopped(){return lastSpeed===null||lastSpeed<.5}
    function stopCamera(message='CAMERA OFFLINE'){
      stream?.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;q('#capture-cargo').disabled=true;q('#stop-camera').disabled=true;q('#start-camera').disabled=false;if(message)setStatus(message);
    }
    async function startCamera(){
      if(!q('#parked-confirm').checked){setStatus('CONFIRM THE VEHICLE IS PARKED BEFORE CAMERA ACCESS','warning');return}
      if(!stopped()){setStatus('CAMERA BLOCKED / VEHICLE MOVING','warning');return}
      if(!navigator.mediaDevices?.getUserMedia){setStatus('CAMERA HARDWARE OR BROWSER API UNAVAILABLE','warning');return}
      try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});video.srcObject=stream;await video.play();q('#capture-cargo').disabled=false;q('#stop-camera').disabled=false;q('#start-camera').disabled=true;setStatus('CAMERA ONLINE / FRAME NOT STORED');}
      catch(error){setStatus('CAMERA UNAVAILABLE / '+(error.name||'PERMISSION OR HARDWARE ERROR').toUpperCase(),'warning')}
    }
    async function capture(){
      if(!stream||!stopped()){stopCamera('CAMERA BLOCKED / VEHICLE MOVING');return}
      const width=video.videoWidth||1280,height=video.videoHeight||720;canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(video,0,0,width,height);canvas.hidden=false;captured=true;visionSuggested=false;q('#cargo-label').focus();
      if(!analyzer){setStatus('CAPTURE READY / VISION PROVIDER NOT CONNECTED — VERIFY ITEM MANUALLY','warning');return}
      setStatus('ANALYZING CAPTURE…');
      try{const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82)),result=await analyzer(blob);if(!result||typeof result.label!=='string'||!CATEGORIES.includes(result.category))throw Error('Invalid analyzer result');q('#cargo-label').value=result.label.slice(0,80);q('#cargo-category').value=result.category;visionSuggested=true;setStatus(`VISION SUGGESTION / ${result.confidence?Math.round(result.confidence*100)+'% — ':''}CONFIRM BEFORE ADDING`);}
      catch{setStatus('VISION ANALYSIS FAILED / VERIFY ITEM MANUALLY','warning')}
    }
    function render(){
      const list=q('#cargo-list');list.replaceChildren();q('#cargo-count').textContent=inventory.items.reduce((sum,item)=>sum+item.quantity,0)+' ITEMS';for(const category of CATEGORIES){const items=inventory.items.filter(item=>item.category===category);if(!items.length)continue;const group=document.createElement('section'),heading=document.createElement('h2');heading.textContent=category.toUpperCase()+' / '+items.reduce((sum,item)=>sum+item.quantity,0);group.className='cargo-group';group.append(heading);for(const item of items){const row=document.createElement('div'),label=document.createElement('span'),meta=document.createElement('small'),remove=document.createElement('button');label.textContent=item.label;meta.textContent='QTY '+item.quantity+' / '+(item.source==='vision'?'VISION SUGGESTION CONFIRMED':item.source==='camera'?'CAMERA FRAME VERIFIED':'MANUALLY VERIFIED');remove.textContent='REMOVE';remove.setAttribute('aria-label','Remove '+item.label);remove.onclick=()=>{inventory.remove(item.id);render()};row.append(label,meta,remove);group.append(row)}list.append(group)}if(!inventory.items.length){const empty=document.createElement('p');empty.className='cargo-empty';empty.textContent='NO VERIFIED CARGO RECORDED';list.append(empty)}
    }
    q('#start-camera').onclick=startCamera;q('#stop-camera').onclick=()=>stopCamera();q('#capture-cargo').onclick=capture;
    q('#cargo-form').onsubmit=e=>{e.preventDefault();try{inventory.add({label:q('#cargo-label').value,category:q('#cargo-category').value,quantity:Number(q('#cargo-quantity').value),source:visionSuggested?'vision':captured?'camera':'verified'});q('#cargo-form').reset();q('#cargo-quantity').value=1;canvas.hidden=true;captured=false;visionSuggested=false;setStatus('VERIFIED ITEM ADDED / IMAGE DISCARDED');render()}catch(error){setStatus(error.message.toUpperCase(),'warning')}};
    q('#manual-cargo').onclick=()=>{captured=false;visionSuggested=false;canvas.hidden=true;q('#cargo-label').focus();setStatus('MANUAL ENTRY / VERIFY BEFORE ADDING')};
    globalThis.addEventListener('surface-telemetry',e=>{lastSpeed=Number.isFinite(e.detail?.speed)?e.detail.speed:null;if(lastSpeed>=.5&&stream)stopCamera('CAMERA STOPPED / VEHICLE MOVING')});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera('CAMERA OFFLINE / APP BACKGROUNDED')});
    globalThis.SurfaceCargo={setAnalyzer(fn){if(typeof fn!=='function')throw Error('Analyzer must be a function.');analyzer=fn;q('#vision-state').textContent='VISION PROVIDER CONNECTED';},clearAnalyzer(){analyzer=null;q('#vision-state').textContent='VISION PROVIDER NOT CONNECTED';},categories:[...CATEGORIES]};render();
  }
  return {CargoInventory,CATEGORIES,install};
});
