'use strict';
(() => {
  const q=s=>document.querySelector(s), ns='http://www.w3.org/2000/svg';
  const MIN_RANGE=5, MAX_RANGE=200, RANGE_STEP=5;
  let receivedAt=null, zones=[], testContacts=null, selectedId=null, savedTestRange=null;
  const tracker=typeof RadarEvents!=='undefined'?new RadarEvents(kind=>globalThis.radarTone?.(kind)):null;
  let mode='proximity', preview=false, vehicles=false, rangeMeters=MAX_RANGE, phase=0, liveContacts=[];
  const title=q('.cockpit-scanner .flight-top');
  title.innerHTML='<span>LOCAL SCANNER</span><span class="cyan" id="scanner-source">NO SENSOR DATA</span>';
  const controls=document.createElement('div'); controls.className='scanner-mode-controls';
  controls.innerHTML='<label>SCAN MODE<select id="scan-mode"><option value="map">MAP</option><option value="vehicle">VEHICLE</option><option value="road">ROAD</option><option value="proximity" selected>PROXIMITY</option></select></label><label id="road-overlay" hidden><input id="scan-vehicles" type="checkbox"> SHOW CONTACTS</label>';
  title.after(controls);
  const reset=q('#scanner-reset'); if(reset&&reset.remove)reset.remove();
  q('#scanner-out').textContent='+ 5 M'; q('#scanner-in').textContent='− 5 M';
  const section=document.createElement('section');section.id='proximity';section.className='view';section.setAttribute('aria-label','Proximity');
  section.innerHTML='<div class="section-heading"><div><small>PERCEPTION / SENSOR FUSION</small><h1>PROXIMITY</h1></div><span class="cyan" id="perception-state">NO SENSOR DATA</span></div><div class="proximity-layout"><article class="panel"><div class="panel-title">LOCAL CONTACT FIELD <span id="proximity-range">200 M DISPLAY</span></div><svg id="proximity-scope" viewBox="0 0 360 220" role="img" aria-label="Proximity sensor view, no data"></svg><p id="proximity-message" role="status">No sensor source connected. An empty display does not mean the area is clear.</p><label class="setting">Preview simulated contacts<input id="perception-preview" type="checkbox"></label></article><article class="panel"><div class="panel-title">CONTACT CLASSIFICATION</div><div id="contact-list"></div><p id="contact-detail" role="status">Select a target for confidence.</p><div class="panel-title">SENSOR SOURCES</div><div class="sensor-source-list"><p><b>WIDE ULTRASONIC</b><span>SHORT RANGE / NOT CONNECTED</span></p><p><b>NARROW ULTRASONIC</b><span>SHORT RANGE / NOT CONNECTED</span></p><p><b>CAMERA</b><span>CLASSIFICATION / NOT CONNECTED</span></p><p><b>RADAR · LIDAR · TOF</b><span>OPTIONAL RANGE / NOT CONNECTED</span></p></div><p>Centered bands show sensor-reported confidence by range. Unreported bands stay unshaded. ▲ human · ■ animal · dotted circle miscellaneous · arrow vehicle heading / rectangle when unknown. Display range is not sensor range. Only measured contacts supplied by connected hardware are plotted.</p><p class="tiny">Prototype only—not collision avoidance. Camera classification requires an on-device detector plus calibrated distance data.</p></article></div>';
  q('main').append(section);
  function element(tag,attrs,parent){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;}
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function confidenceColor(confidence){if(!Number.isFinite(confidence))return 'hsl(28 35% 67%)';const c=clamp(confidence,0,1);return `hsl(${Math.round(18+c*20)} 86% ${Math.round(58+c*8)}%)`;}
  function normalizeContact(item,index){
    if(!item||typeof item!=='object')return null;
    const distance=item.distanceMeters,bearing=item.bearingDegrees,confidence=item.confidence==null?null:item.confidence;
    if(!Number.isFinite(distance)||distance<0||!Number.isFinite(bearing)||confidence!==null&&!Number.isFinite(confidence))return null;
    const type=String(item.type||'unknown').toUpperCase().replace(/[^A-Z0-9 _-]/g,'').slice(0,18)||'UNKNOWN';
    return {id:item.id==null?null:String(item.id),headingDegrees:Number.isFinite(item.headingDegrees)?item.headingDegrees:null,type,distanceMeters:distance,bearingDegrees:bearing,confidence:confidence===null?null:clamp(confidence,0,1),uncertaintyMeters:Number.isFinite(item.uncertaintyMeters)&&item.uncertaintyMeters>=0?item.uncertaintyMeters:null,sensor:String(item.sensor||'UNSPECIFIED').toUpperCase().slice(0,20)};
  }
  function simulatedContacts(){return [
    {id:'sim-car',type:'CAR',headingDegrees:45,distanceMeters:62+Math.sin(phase)*3,bearingDegrees:-32,confidence:.93,sensor:'SIM'},
    {id:'sim-person',type:'PERSON',distanceMeters:31,bearingDegrees:38+Math.sin(phase)*3,confidence:.78,sensor:'SIM'},
    {id:'sim-animal',type:'ANIMAL',distanceMeters:18,bearingDegrees:-8,confidence:.64,sensor:'SIM'},
    {id:'sim-unknown',type:'UNKNOWN',distanceMeters:108,bearingDegrees:55,confidence:.39,sensor:'SIM'}
  ];}
  function activeContacts(kind){const source=testContacts||(preview?simulatedContacts():liveContacts);if(!(kind==='vehicle'||kind==='proximity'||kind==='road'&&vehicles))return [];return source.filter(c=>c.distanceMeters<=rangeMeters&&(kind==='proximity'||/CAR|TRUCK|VEHICLE|MOTORCYCLE|BUS/.test(c.type)));}
  function position(contact){const angle=contact.bearingDegrees*Math.PI/180,ratio=clamp(contact.distanceMeters/rangeMeters,0,1);return [180+Math.sin(angle)*158*ratio,110-Math.cos(angle)*81*ratio];}
  function draw(parent,kind,full=false){
    parent.replaceChildren();
    if(kind==='map'||kind==='road'){
      element('path',{d:'M35 80H325 M35 140H325 M115 25V195 M240 25V195',fill:'none',stroke:'#d07632','stroke-width':3},parent);
      if(kind==='map')for(const [x,y,w,h] of [[45,30,55,35],[130,30,90,35],[260,30,50,35],[45,95,55,28],[130,95,90,28],[260,95,50,28],[45,156,55,30],[130,156,90,30]])element('rect',{x,y,width:w,height:h,fill:'#ae5d2524',stroke:'#ae6b37'},parent);
    }else{
      const bands=preview||testContacts?[{radiusMeters:200,confidence:.35},{radiusMeters:100,confidence:.65},{radiusMeters:40,confidence:.9}]:zones;
      for(const band of [...bands].sort((a,b)=>b.radiusMeters-a.radiusMeters)){const r=158*Math.min(1,band.radiusMeters/rangeMeters);element('ellipse',{cx:180,cy:110,rx:r,ry:r*.52,fill:confidenceColor(band.confidence),'fill-opacity':.07+.14*band.confidence,stroke:confidenceColor(band.confidence),'stroke-opacity':.35,class:'confidence-zone'},parent);}
      for(const r of [40,80,125,164])element('ellipse',{cx:180,cy:110,rx:r,ry:r*.52,fill:'none',stroke:'#945225','stroke-opacity':.55},parent);
      element('path',{d:'M16 110H344 M180 25V195',stroke:'#57371e'},parent);
      if(preview)element('path',{d:'M180 110L123 31A164 85 0 0 1 237 31Z',fill:'#78dce710',stroke:'#78dce733',class:'sensor-fov wide'},parent);
      if(preview)element('path',{d:'M180 110L165 26A164 85 0 0 1 195 26Z',fill:'#ffab540e',stroke:'#ffab5438',class:'sensor-fov narrow'},parent);
      element('ellipse',{cx:180,cy:110,rx:164,ry:85,fill:'none',stroke:'#ffc98e',class:'acquisition-ring'},parent);
    }
    for(const contact of activeContacts(kind)){
      const [x,y]=position(contact),color=confidenceColor(contact.confidence);
      const car=/CAR|TRUCK|VEHICLE|MOTORCYCLE|BUS/.test(contact.type),human=/PERSON|HUMAN|PEDESTRIAN/.test(contact.type),animal=/ANIMAL|DOG|CAT|DEER/.test(contact.type);
      const attrs={fill:color,stroke:color,class:'contact-lock',role:'button',tabindex:0,'aria-label':contact.type+' confidence '+(contact.confidence==null?'unavailable':Math.round(contact.confidence*100)+' percent'),'data-confidence':contact.confidence??'unknown'};
      let mark;
      if(car&&Number.isFinite(contact.headingDegrees))mark=element('path',{...attrs,d:`M${x} ${y-7}l5 13-5-3-5 3Z`,transform:`rotate(${contact.headingDegrees} ${x} ${y})`},parent);
      else if(car)mark=element('rect',{...attrs,x:x-6,y:y-4,width:12,height:8},parent);
      else if(human)mark=element('path',{...attrs,d:`M${x} ${y-7}l6 12h-12Z`},parent);
      else if(animal)mark=element('rect',{...attrs,x:x-5,y:y-5,width:10,height:10},parent);
      else mark=element('circle',{...attrs,cx:x,cy:y,r:7,fill:'transparent','stroke-dasharray':'1 3'},parent);
      const select=()=>{selectedId=contact.id;q('#contact-detail').textContent=contact.type+' / CONFIDENCE '+(contact.confidence==null?'UNAVAILABLE':Math.round(contact.confidence*100)+'%')+' / '+contact.distanceMeters.toFixed(1)+' M';if(typeof toast==='function')toast(q('#contact-detail').textContent);};
      mark.onclick=select;mark.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}};
      if(full){const t=element('text',{x:x+9,y:y+3,fill:color,'font-size':7},parent);t.textContent=contact.type;}
    }
    if(full)element('path',{d:'M180 99L188 118L180 114L172 118Z',fill:'#93efff'},parent);
  }
  function range(){q('#scanner-range').textContent=rangeMeters+' M';q('#proximity-range').textContent=rangeMeters+' M DISPLAY';q('#scanner-in').disabled=rangeMeters<=MIN_RANGE;q('#scanner-out').disabled=rangeMeters>=MAX_RANGE;q('#scanner-svg').setAttribute('aria-label',`${mode} view, ${rangeMeters} meter display range, ${preview?'simulated contacts':liveContacts.length?'live contacts':'no sensor data'}`);}
  function renderContacts(){
    const source=testContacts||(preview?simulatedContacts():liveContacts),list=q('#contact-list');list.replaceChildren();
    if(!source.length){list.textContent='No classifications received.';return;}
    for(const c of source.filter(c=>c.distanceMeters<=rangeMeters)){const row=document.createElement('button');row.className='contact-row';row.onclick=()=>{selectedId=c.id;q('#contact-detail').textContent=c.type+' / CONFIDENCE '+(c.confidence==null?'UNAVAILABLE':Math.round(c.confidence*100)+'%');};row.style.setProperty&&row.style.setProperty('--confidence-color',confidenceColor(c.confidence));row.textContent=`${c.type} · ${c.distanceMeters.toFixed(1)} M · ${c.confidence==null?'CONF —':Math.round(c.confidence*100)+'%'}${preview?' · SIM':''}`;list.append(row);}
    if(!list.children.length)list.textContent='No contacts inside selected display range.';
  }
  function render(){
    draw(q('#scanner-world'),mode);draw(q('#proximity-scope'),'proximity',true);range();renderContacts();q('#road-overlay').hidden=mode!=='road';
    const hasLive=receivedAt!==null;q('#scanner-source').textContent=testContacts?'SYSTEM TEST / SIMULATED':mode==='map'||mode==='road'?'SCHEMATIC MAP':preview?'SIMULATED CONTACTS':hasLive?'LIVE SENSOR INPUT':'NO SENSOR DATA';
    q('.interactive-scanner .tiny').textContent=(mode==='map'||mode==='road')?'SCHEMATIC LAYER / NATIVE MAP OPENS ON ANDROID':preview?'SIMULATION / NOT OBSTACLE DETECTION':hasLive?'MEASURED SENSOR CONTACTS':'NO SENSOR DATA / NOT AN ALL-CLEAR';
    q('#perception-state').textContent=testContacts?'SYSTEM TEST / SIMULATED':preview?'SIMULATION / NOT LIVE':hasLive?'LIVE INPUT':'NO SENSOR DATA';q('#proximity-message').textContent=testContacts?'SYSTEM TEST / Synthetic targets. Live measurements remain separate.':preview?'Simulated classifications and motion. Not camera detections.':hasLive?'Only measured contacts inside the selected display range are shown.':'No sensor source connected. An empty display does not mean the area is clear.';q('#proximity-scope').setAttribute('aria-label',preview?'Simulated proximity contacts':hasLive?`${liveContacts.length} received sensor contacts`:'Proximity sensor view, no data');
  }
  q('#scan-mode').onchange=e=>{mode=e.target.value;rangeMeters=MAX_RANGE;render();};q('#scan-vehicles').onchange=e=>{vehicles=e.target.checked;render();};q('#perception-preview').onchange=e=>{preview=e.target.checked;render();};q('#scanner-in').onclick=()=>{rangeMeters=Math.max(MIN_RANGE,rangeMeters-RANGE_STEP);render();};q('#scanner-out').onclick=()=>{rangeMeters=Math.min(MAX_RANGE,rangeMeters+RANGE_STEP);render();};
  globalThis.SurfacePerception={ingestContacts(items,coverage=[]){if(!Array.isArray(items))return 0;const valid=items.map(normalizeContact).filter(Boolean);if(items.length&&!valid.length)return 0;zones=Array.isArray(coverage)?coverage.filter(z=>Number.isFinite(z.radiusMeters)&&z.radiusMeters>0&&Number.isFinite(z.confidence)&&z.confidence>=0&&z.confidence<=1):[];receivedAt=Date.now();tracker?.update(valid,receivedAt);globalThis.SurfaceAlerts?.update('perception',true,'warning','Proximity feed');liveContacts=valid;preview=false;if(q('#perception-preview'))q('#perception-preview').checked=false;render();return liveContacts.length;},clear(){receivedAt=null;liveContacts=[];zones=[];tracker?.reset();globalThis.SurfaceAlerts?.update('perception',false,'warning','Proximity feed');render();},test(items){if(items!==null&&testContacts===null){savedTestRange=rangeMeters;rangeMeters=200;}if(items===null&&savedTestRange!==null){rangeMeters=savedTestRange;savedTestRange=null;}testContacts=items;render();},selectTest(index){const c=testContacts?.[index];if(c)q('#contact-detail').textContent='TEST / '+c.type+' / '+Math.round(c.confidence*100)+'%';},state(){return {rangeMeters,mode,preview,contactCount:liveContacts.length};},confidenceColor};
  render();setInterval(()=>{if(receivedAt!==null)tracker?.update(liveContacts);if(selectedId!==null&&!liveContacts.some(c=>c.id===selectedId)&&!preview&&!testContacts){q('#contact-detail').textContent='TARGET NO LONGER TRACKED';selectedId=null;}if(receivedAt!==null&&Date.now()-receivedAt>3000){receivedAt=null;liveContacts=[];zones=[];tracker?.reset();globalThis.SurfaceAlerts?.update('perception',false,'warning','Proximity feed');render();}if(document.hidden||!preview||q('#animations').checked===false||matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(!q('#cockpit').classList.contains('active')&&!section.classList.contains('active'))return;phase+=.12;draw(q('#scanner-world'),mode);draw(q('#proximity-scope'),'proximity',true);renderContacts();},250);if(location.hash==='#proximity')showView('proximity');
})();
