'use strict';
(() => {
  const q=s=>document.querySelector(s), ns='http://www.w3.org/2000/svg';
  let mode='map', preview=false, vehicles=false, zoom=1, phase=0;
  const title=q('.cockpit-scanner .flight-top');
  title.innerHTML='<span>LOCAL SCANNER</span><span class="cyan" id="scanner-source">SCHEMATIC / DEMO</span>';
  const controls=document.createElement('div'); controls.className='scanner-mode-controls';
  controls.innerHTML='<label>SCAN MODE<select id="scan-mode"><option value="map">MAP</option><option value="vehicle">VEHICLE</option><option value="road">ROAD</option><option value="proximity">PROXIMITY</option></select></label><label id="road-overlay" hidden><input id="scan-vehicles" type="checkbox"> VEHICLES</label>';
  title.after(controls);
  const section=document.createElement('section');section.id='proximity';section.className='view';section.setAttribute('aria-label','Proximity');
  section.innerHTML='<div class="section-heading"><div><small>PERCEPTION / SENSOR FUSION</small><h1>PROXIMITY</h1></div><span class="cyan" id="perception-state">NO SENSOR DATA</span></div><div class="proximity-layout"><article class="panel"><div class="panel-title">LOCAL CONTACT FIELD <span>20 M RANGE</span></div><svg id="proximity-scope" viewBox="0 0 360 220" role="img" aria-label="Proximity sensor view, no data"></svg><p id="proximity-message" role="status">No sensor source connected. An empty display does not mean the area is clear.</p><label class="setting">Preview simulated contacts<input id="perception-preview" type="checkbox"></label></article><article class="panel"><div class="panel-title">CONTACT CLASSIFICATION</div><div id="contact-list"></div><div class="panel-title">SENSOR SOURCES</div><p>ULTRASONIC / NOT CONNECTED<br>CAMERA / NOT CONNECTED<br>OBJECT DETECTOR / NOT CONNECTED</p><p>Ultrasonic returns are unclassified obstacles. Cars, people and animals require a camera detector; accurate positions also require calibrated depth or range measurements.</p><p class="tiny">Prototype only—not collision avoidance. No footage is uploaded. Camera capture, detector inference and live sensor fusion are not installed in this build.</p></article></div>';
  q('main').append(section);
  const button=document.createElement('button');button.dataset.view='proximity';button.innerHTML='<span>◎</span>PROXIMITY';button.onclick=()=>showView('proximity');q('nav').insertBefore(button,q('nav [data-view="port"]'));
  function element(tag,attrs,parent){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;}
  function draw(parent,kind,full=false){
    parent.replaceChildren();
    if(kind==='map'||kind==='road'){
      element('path',{d:'M35 80H325 M35 140H325 M115 25V195 M240 25V195',fill:'none',stroke:'#d07632','stroke-width':3},parent);
      if(kind==='map')for(const [x,y,w,h] of [[45,30,55,35],[130,30,90,35],[260,30,50,35],[45,95,55,28],[130,95,90,28],[260,95,50,28],[45,156,55,30],[130,156,90,30]])element('rect',{x,y,width:w,height:h,fill:'#ae5d2524',stroke:'#ae6b37'},parent);
    }else{
      for(const r of [40,80,125,164])element('ellipse',{cx:180,cy:110,rx:r,ry:r*.52,fill:'none',stroke:'#945225','stroke-opacity':.55},parent);
      element('path',{d:'M16 110H344 M180 25V195',stroke:'#57371e'},parent);
      element('ellipse',{cx:180,cy:110,rx:164,ry:85,fill:'none',stroke:'#ffc98e',class:'acquisition-ring'},parent);
    }
    const show=preview&&(kind==='vehicle'||kind==='proximity'||(kind==='road'&&vehicles));
    if(show){
      const contacts=[['CAR',110+Math.sin(phase)*8,70,'#ffbc72'],['PERSON',235,125+Math.sin(phase)*6,'#79d9df'],['ANIMAL',145,157,'#a9d49e'],['UNKNOWN',280,65,'#c9aee3']];
      for(const [label,x,y,color] of contacts.filter(c=>kind==='proximity'||c[0]==='CAR')){
        element('rect',{x:x-5,y:y-5,width:10,height:10,fill:'none',stroke:color,class:'contact-lock'},parent);
        if(full){const t=element('text',{x:x+9,y:y+3,fill:color,'font-size':7},parent);t.textContent=label;}
      }
    }
    if(full)element('path',{d:'M180 99L188 118L180 114L172 118Z',fill:'#93efff'},parent);
  }
  function range(){
    const meters=(mode==='map'||mode==='road'?200:20)/zoom;
    q('#scanner-range').textContent=meters.toFixed(0)+' M';q('#scanner-reset').textContent=zoom.toFixed(1)+'× RANGE';
    q('#scanner-world').style.transform=`translate(${180-180*zoom}px,${110-110*zoom}px) scale(${zoom})`;
    q('#scanner-in').disabled=zoom>=4;q('#scanner-out').disabled=zoom<=.5;
    q('#scanner-svg').setAttribute('aria-label',`${mode} view, ${meters.toFixed(0)} meter range, ${preview?'simulated contacts':'no live sensor data'}`);
  }
  function render(){
    draw(q('#scanner-world'),mode);draw(q('#proximity-scope'),'proximity',true);range();
    q('#road-overlay').hidden=mode!=='road';
    q('#scanner-source').textContent=mode==='map'||mode==='road'?'SCHEMATIC / DEMO':preview?'SIMULATED CONTACTS':'NO SENSOR DATA';
    q('.interactive-scanner .tiny').textContent=(mode==='map'||mode==='road')?'FICTIONAL MAP / NOT LIVE GEOGRAPHY':preview?'SIMULATION / NOT OBSTACLE DETECTION':'NO SENSOR DATA / NOT AN ALL-CLEAR';
    q('#perception-state').textContent=preview?'SIMULATION / NOT LIVE':'NO SENSOR DATA';
    q('#proximity-message').textContent=preview?'Simulated classifications and motion. Not camera detections.':'No sensor source connected. An empty display does not mean the area is clear.';
    q('#proximity-scope').setAttribute('aria-label',preview?'Simulated car, person, animal and unknown contacts':'Proximity sensor view, no data');
    q('#contact-list').textContent=preview?'CAR / SIMULATED · PERSON / SIMULATED · ANIMAL / SIMULATED · UNKNOWN / SIMULATED':'No classifications received.';
  }
  q('#scan-mode').onchange=e=>{mode=e.target.value;zoom=1;render();};
  q('#scan-vehicles').onchange=e=>{vehicles=e.target.checked;render();};
  q('#perception-preview').onchange=e=>{preview=e.target.checked;render();};
  q('#scanner-in').onclick=()=>{zoom=Math.min(4,zoom+.5);range();};q('#scanner-out').onclick=()=>{zoom=Math.max(.5,zoom-.5);range();};q('#scanner-reset').onclick=()=>{zoom=1;range();};
  render();
  setInterval(()=>{if(document.hidden||!preview||q('#animations').checked===false||matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(!q('#cockpit').classList.contains('active')&&!section.classList.contains('active'))return;phase+=.12;draw(q('#scanner-world'),mode);draw(q('#proximity-scope'),'proximity',true);},250);
  if(location.hash==='#proximity')showView('proximity');
})();
