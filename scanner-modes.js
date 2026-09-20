'use strict';
(() => {
  const q=s=>document.querySelector(s), ns='http://www.w3.org/2000/svg';
  const MIN_RANGE=5, MAX_RANGE=200, RANGE_STEP=5;
  let receivedAt=null, zones=[], testContacts=null, selectedId=null, savedTestRange=null,savedMode=null;
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
const bar=document.createElement('div');bar.className='scanner-mode-controls';bar.innerHTML='<select id="expanded-mode" aria-label="Expanded scanner mode"><option value="proximity">PROXIMITY</option><option value="map">MAP</option><option value="vehicle">VEHICLE</option><option value="road">ROAD</option></select><button id="expanded-in">− 5 M</button><button id="expanded-out">+ 5 M</button><label id="expanded-road" hidden><input id="expanded-vehicles" type="checkbox"> VEHICLES</label>';q('#proximity-scope').before?.(bar);
  function element(tag,attrs,parent){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;}
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function confidenceColor(confidence){if(!Number.isFinite(confidence))return 'hsl(35 12% 67%)';const c=clamp(confidence,0,1);return `hsl(${Math.round(35+c*105)} 30% ${Math.round(62+c*8)}%)`;}
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
  function defs(parent){
    const d=element('defs',{},parent),glow=element('filter',{id:'sensor-glow',x:'-80%',y:'-80%',width:'260%',height:'260%'},d);element('feGaussianBlur',{stdDeviation:'2.4',result:'blur'},glow);const merge=element('feMerge',{},glow);element('feMergeNode',{in:'blur'},merge);element('feMergeNode',{in:'SourceGraphic'},merge);
    const amber=element('linearGradient',{id:'scanner-amber',x1:'0',x2:'1'},d);element('stop',{offset:'0','stop-color':'#ff7b22','stop-opacity':'.05'},amber);element('stop',{offset:'.5','stop-color':'#ffd08a','stop-opacity':'.85'},amber);element('stop',{offset:'1','stop-color':'#ff7b22','stop-opacity':'.05'},amber);
    const cyan=element('radialGradient',{id:'scanner-cyan'},d);element('stop',{offset:'0','stop-color':'#c6fbff','stop-opacity':'.4'},cyan);element('stop',{offset:'1','stop-color':'#49b9cc','stop-opacity':'0'},cyan);
    const clip=element('clipPath',{id:'scope-mask'},d);element('path',{d:'M20 34L42 14H318L340 34V186L318 206H42L20 186Z'},clip);
  }
  function frame(parent,kind){
    element('path',{d:'M20 34L42 14H318L340 34V186L318 206H42L20 186Z',class:'scope-shell'},parent);
    element('path',{d:'M34 43L50 27H310L326 43 M34 177L50 193H310L326 177',class:'scope-inner'},parent);
    const label=element('text',{x:34,y:24,class:'scope-mode-label'},parent);label.textContent='SENSOR VIEW / '+kind.toUpperCase();
    const rangeLabel=element('text',{x:326,y:198,'text-anchor':'end',class:'scope-range-label'},parent);rangeLabel.textContent=rangeMeters+' M FIELD';
    for(let i=0;i<26;i++)element('line',{x1:42+i*11,y1:204,x2:47+i*11,y2:204,class:i%5?'scope-tick':'scope-tick major'},parent);
  }
  function backgroundGrid(parent){
    const grid=element('g',{class:'holo-grid','clip-path':'url(#scope-mask)'},parent);
    for(let y=50;y<=190;y+=20)element('path',{d:`M${25+(y-40)*.18} ${y}H${335-(y-40)*.18}`},grid);
    for(let x=48;x<=312;x+=33)element('path',{d:`M180 110L${x} 204`},grid);
    return grid;
  }
  function mapLayer(parent,buildings){
    const layer=element('g',{transform:`translate(180 110) scale(${200/rangeMeters}) translate(-180 -110)`,class:'map-geometry','clip-path':'url(#scope-mask)'},parent);
    const roads=['M10 66C82 48 125 72 180 103S282 150 355 130','M75 5C90 67 134 90 208 104S302 126 365 202','M-5 166C75 142 118 152 174 128S274 66 365 78','M150 -5C145 60 162 100 190 142S238 190 248 225'];
    roads.forEach((d,i)=>{element('path',{d,class:i===0?'map-road primary':'map-road'},layer);element('path',{d,class:'map-road-core'},layer);});
    if(buildings){
      for(const [x,y,w,h] of [[44,39,31,22],[87,76,24,18],[119,34,42,26],[208,39,34,25],[265,57,42,31],[62,122,37,29],[116,151,45,25],[236,143,33,24],[284,123,27,22]]){element('path',{d:`M${x} ${y+h}V${y+6}L${x+6} ${y}H${x+w}V${y+h}Z`,class:'map-building'},layer);element('path',{d:`M${x} ${y+h}H${x+w}`,class:'map-building-base'},layer);}
      const target=element('g',{class:'map-destination',transform:'translate(270 92)'},layer);element('circle',{r:11},target);element('circle',{r:4},target);element('path',{d:'M-17 0H-8M8 0H17M0-17V-8M0 8V17'},target);
    }
  }
  function roadLayer(parent){
    const g=element('g',{class:'road-hologram','clip-path':'url(#scope-mask)'},parent);element('path',{d:'M26 64H334',class:'road-horizon'},g);element('path',{d:'M144 206L173 64M216 206L187 64',class:'road-edge'},g);element('path',{d:'M180 206V64',class:'road-center'},g);
    for(let y=78;y<202;y+=24){const width=(y-64)*.09;element('path',{d:`M${180-width} ${y}H${180+width}`,class:'road-dash'},g);}
    for(let y=83;y<202;y+=30)element('path',{d:`M${40+(y-64)*.45} ${y}H${320-(y-64)*.45}`,class:'road-depth'},g);
    element('path',{d:'M174 191L180 178L186 191L180 187Z',class:'self-marker'},g);
  }
  function radarLayer(parent,kind){
    const g=element('g',{class:'radar-hologram','clip-path':'url(#scope-mask)'},parent),bands=preview||testContacts?[{radiusMeters:200,confidence:.35},{radiusMeters:100,confidence:.65},{radiusMeters:40,confidence:.9}]:zones;
    for(const band of [...bands].sort((a,b)=>b.radiusMeters-a.radiusMeters)){const r=158*Math.min(1,band.radiusMeters/rangeMeters);element('ellipse',{cx:180,cy:112,rx:r,ry:r*.5,fill:confidenceColor(band.confidence),'fill-opacity':.035+.1*band.confidence,stroke:confidenceColor(band.confidence),'stroke-opacity':.36,class:'confidence-zone'},g);}
    for(const r of [38,79,120,158])element('ellipse',{cx:180,cy:112,rx:r,ry:r*.5,class:'radar-ring'},g);
    for(const angle of [-60,-30,0,30,60]){const a=angle*Math.PI/180;element('path',{d:`M180 112L${180+Math.sin(a)*158} ${112-Math.cos(a)*79}`,class:'radar-spoke'},g);}
    element('path',{d:'M180 112L292 56A158 79 0 0 1 325 84Z',class:'radar-sweep'},g);element('ellipse',{cx:180,cy:112,rx:158,ry:79,class:'acquisition-ring'},g);
    if(kind==='vehicle')element('path',{d:'M180 96L190 119L180 114L170 119Z',class:'self-marker vehicle'},g);
  }
  function draw(parent,kind,full=false){
    parent.replaceChildren();
    defs(parent);frame(parent,kind);backgroundGrid(parent);
    if(kind==='map')mapLayer(parent,true);else if(kind==='road')roadLayer(parent);else radarLayer(parent,kind);
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
    if(full&&kind!=='road')element('path',{d:'M180 100L188 119L180 115L172 119Z',class:'self-marker'},parent);
  }
  function range(){q('#scanner-range').textContent=rangeMeters+' M';q('#proximity-range').textContent=rangeMeters+' M DISPLAY';q('#scanner-in').disabled=rangeMeters<=MIN_RANGE;q('#scanner-out').disabled=rangeMeters>=MAX_RANGE;q('#scanner-svg').setAttribute('aria-label',`${mode} view, ${rangeMeters} meter display range, ${preview?'simulated contacts':liveContacts.length?'live contacts':'no sensor data'}`);}
  function renderContacts(){
    const source=activeContacts(mode),list=q('#contact-list');list.replaceChildren();
    if(!source.length){list.textContent='No classifications received.';return;}
    for(const c of source.filter(c=>c.distanceMeters<=rangeMeters)){const row=document.createElement('button');row.className='contact-row';row.onclick=()=>{selectedId=c.id;q('#contact-detail').textContent=c.type+' / CONFIDENCE '+(c.confidence==null?'UNAVAILABLE':Math.round(c.confidence*100)+'%');};row.style.setProperty&&row.style.setProperty('--confidence-color',confidenceColor(c.confidence));row.textContent=`${c.type} · ${c.distanceMeters.toFixed(1)} M · ${c.confidence==null?'CONF —':Math.round(c.confidence*100)+'%'}${preview?' · SIM':''}`;list.append(row);}
    if(!list.children.length)list.textContent='No contacts inside selected display range.';
  }
  function render(){
    draw(q('#scanner-world'),mode);draw(q('#proximity-scope'),mode,true);range();renderContacts();q('#expanded-mode').value=mode;q('#scan-mode').value=mode;q('#expanded-road').hidden=mode!=='road';q('#expanded-vehicles').checked=vehicles;q('#expanded-in').disabled=rangeMeters<=5;q('#expanded-out').disabled=rangeMeters>=200;q('#road-overlay').hidden=mode!=='road';
    const hasLive=receivedAt!==null;q('#scanner-source').textContent=testContacts?'SYSTEM TEST / SIMULATED':mode==='map'||mode==='road'?'SCHEMATIC MAP':preview?'SIMULATED CONTACTS':hasLive?'LIVE SENSOR INPUT':'NO SENSOR DATA';
    q('.interactive-scanner .tiny').textContent=(mode==='map'||mode==='road')?'SCHEMATIC LAYER / NATIVE MAP OPENS ON ANDROID':preview?'SIMULATION / NOT OBSTACLE DETECTION':hasLive?'MEASURED SENSOR CONTACTS':'NO SENSOR DATA / NOT AN ALL-CLEAR';
    q('#perception-state').textContent=testContacts?'SYSTEM TEST / SIMULATED':preview?'SIMULATION / NOT LIVE':hasLive?'LIVE INPUT':'NO SENSOR DATA';q('#proximity-message').textContent=(mode==='map'||mode==='road')?'SCHEMATIC ROAD LAYER / Not live navigation. Open native navigation for a real map.':testContacts?'SYSTEM TEST / Synthetic targets. Live measurements remain separate.':preview?'Simulated classifications and motion. Not camera detections.':hasLive?'Only measured contacts inside the selected display range are shown.':'No sensor source connected. An empty display does not mean the area is clear.';q('#proximity-scope').setAttribute('aria-label',preview?'Simulated proximity contacts':hasLive?`${liveContacts.length} received sensor contacts`:'Proximity sensor view, no data');
  }
  q('#scan-mode').onchange=e=>{mode=e.target.value;rangeMeters=MAX_RANGE;render();};q('#scan-vehicles').onchange=e=>{vehicles=e.target.checked;render();};q('#perception-preview').onchange=e=>{preview=e.target.checked;render();};q('#scanner-in').onclick=()=>{rangeMeters=Math.max(MIN_RANGE,rangeMeters-RANGE_STEP);render();};q('#scanner-out').onclick=()=>{rangeMeters=Math.min(MAX_RANGE,rangeMeters+RANGE_STEP);render();};
  q('#expanded-vehicles').onchange=e=>{q('#scan-vehicles').checked=e.target.checked;q('#scan-vehicles').onchange(e);};q('#expanded-mode').onchange=e=>{q('#scan-mode').value=e.target.value;q('#scan-mode').onchange(e);};q('#expanded-in').onclick=()=>q('#scanner-in').onclick();q('#expanded-out').onclick=()=>q('#scanner-out').onclick();
globalThis.SurfacePerception={contacts(){return liveContacts.map(c=>({...c}));},renderParking(parent){const old=rangeMeters;rangeMeters=5;draw(parent,'proximity',true);rangeMeters=old;},ingestContacts(items,coverage=[]){if(!Array.isArray(items))return 0;const valid=items.map(normalizeContact).filter(Boolean);if(items.length&&!valid.length)return 0;zones=Array.isArray(coverage)?coverage.filter(z=>Number.isFinite(z.radiusMeters)&&z.radiusMeters>0&&Number.isFinite(z.confidence)&&z.confidence>=0&&z.confidence<=1):[];receivedAt=Date.now();tracker?.update(valid,receivedAt);globalThis.SurfaceAlerts?.update('perception',true,'warning','Proximity feed');liveContacts=valid;preview=false;if(q('#perception-preview'))q('#perception-preview').checked=false;render();return liveContacts.length;},clear(){receivedAt=null;liveContacts=[];zones=[];tracker?.reset();globalThis.SurfaceAlerts?.update('perception',false,'warning','Proximity feed');render();},test(items,testMode){if(items!==null&&testContacts===null){savedTestRange=rangeMeters;savedMode=mode;rangeMeters=200;}if(items===null&&savedTestRange!==null){rangeMeters=savedTestRange;mode=savedMode;savedMode=null;savedTestRange=null;}testContacts=items;if(testMode)mode=testMode;render();},selectTest(index){const c=testContacts?.[index];if(c)q('#contact-detail').textContent='TEST / '+c.type+' / '+Math.round(c.confidence*100)+'%';},state(){return {rangeMeters,mode,preview,contactCount:liveContacts.length};},confidenceColor};
  render();setInterval(()=>{if(receivedAt!==null)tracker?.update(liveContacts);if(selectedId!==null&&!liveContacts.some(c=>c.id===selectedId)&&!preview&&!testContacts){q('#contact-detail').textContent='TARGET NO LONGER TRACKED';selectedId=null;}if(receivedAt!==null&&Date.now()-receivedAt>3000){receivedAt=null;liveContacts=[];zones=[];tracker?.reset();globalThis.SurfaceAlerts?.update('perception',false,'warning','Proximity feed');render();}if(document.hidden||!preview||q('#animations').checked===false||matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(!q('#cockpit').classList.contains('active')&&!section.classList.contains('active'))return;phase+=.12;draw(q('#scanner-world'),mode);draw(q('#proximity-scope'),mode,true);renderContacts();},250);if(location.hash==='#proximity')showView('proximity');
})();
