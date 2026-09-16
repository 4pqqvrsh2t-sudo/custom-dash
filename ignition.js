'use strict';
(() => {
  const q=s=>document.querySelector(s),shell=q('.shell');
  const overlay=document.createElement('div');overlay.id='ship-startup';overlay.tabIndex=-1;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','System startup sequence');
  overlay.innerHTML=`<div class="ignition-console"><div class="ignition-top"><span>SURFACE COMMAND / COLD START</span><strong>SYSTEM CHECK</strong></div><div class="ignition-reactor" aria-hidden="true"><svg viewBox="0 0 240 180"><g class="reactor-outer"><circle cx="120" cy="90" r="76"/><path d="M120 8V23 M120 157V172 M38 90H53 M187 90H202"/></g><g class="reactor-inner"><circle cx="120" cy="90" r="56"/><path d="M120 30L172 120H68Z"/></g><circle class="reactor-heart" cx="120" cy="90" r="25"/><path d="M0 90H35 M205 90H240"/></svg><div><small>IGNITION SEQUENCE</small><h1 id="boot-phase">CORE ENERGIZING</h1><p id="boot-sound-status">AUDIO / STARTING</p></div></div><div class="boot-energy" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div id="boot-modules"></div><progress id="boot-progress" max="12" value="0" aria-label="Startup modules completed"></progress><p id="boot-status" role="status">SYSTEM CHECK ACTIVE</p></div>`;
  document.body.append(overlay);
  const available=(yes,ready='ONLINE',missing='UNAVAILABLE')=>()=>yes()?ready:missing;
  const stages=[
    {name:'POWER DISTRIBUTION',wait:420,check:()=> 'STABLE'},
    {name:'DISPLAY PROJECTORS',wait:680,check:()=>document.visibilityState==='prerender'?'STANDBY':'ONLINE'},
    {name:'CONTROL BUS',wait:1050,check:available(()=>typeof globalThis.SurfaceTelemetry?.ingest==='function','BRIDGE READY','BRIDGE UNAVAILABLE')},
    {name:'NAVIGATION RECEIVER',wait:760,check:available(()=>!!navigator.geolocation,'RECEIVER AVAILABLE','HARDWARE UNAVAILABLE')},
    {name:'AUDIO PROCESSOR',wait:1380,check:available(()=>!!(globalThis.AudioContext||globalThis.webkitAudioContext),'AVAILABLE','UNAVAILABLE')},
    {name:'BACKUP RADIO',wait:510,check:available(()=>!!q('#audio-file'),'FILE BANK READY')},
    {name:'ANTENNA TUNER',wait:1660,check:()=> 'HARDWARE UNAVAILABLE'},
    {name:'ESP32 SENSOR LINK',wait:1920,check:()=>q('#port-state')?.textContent==='DEVICE ONLINE'?'DEVICE ONLINE':'NOT CONNECTED'},
    {name:'CAMERA ARRAY',wait:870,check:available(()=>!!navigator.mediaDevices?.getUserMedia,'INTERFACE AVAILABLE','HARDWARE UNAVAILABLE')},
    {name:'ULTRASONIC ARRAY',wait:1240,check:()=> 'NOT CONNECTED'},
    {name:'ENGINE / OBD',wait:1540,check:()=>q('#telemetry-source')?.textContent!=='NO LIVE SOURCE'?'LINK ACTIVE':'NOT CONNECTED'},
    {name:'COMMAND INTERFACE',wait:460,check:()=> 'READY'}
  ];
  let timer=null,closed=true,hum=null,humGain=null,states=[];
  function stopHum(){globalThis.CustomSounds?.stop('boot-hum');if(hum){try{hum.stop();hum.disconnect();humGain.disconnect()}catch{}hum=null;humGain=null}}
  function startHum(c){if(closed||document.hidden||c.state!=='running'||hum)return;if(globalThis.CustomSounds?.play('boot-hum',{loop:true,volume:.3}))return;hum=c.createOscillator();humGain=c.createGain();hum.type='sine';hum.frequency.setValueAtTime(42,c.currentTime);hum.frequency.linearRampToValueAtTime(67,c.currentTime+8);humGain.gain.setValueAtTime(.035*prefs.volume/100,c.currentTime);hum.connect(humGain).connect(c.destination);hum.start();}
  function unlock(){if(closed)return;try{const c=audioContext();q('#boot-sound-status').textContent=c.state==='running'?'AUDIO / ONLINE':'AUDIO / LOCKED';startHum(c);c.resume().then(()=>{if(!closed){q('#boot-sound-status').textContent=c.state==='running'?'AUDIO / ONLINE':'AUDIO / UNAVAILABLE';startHum(c)}}).catch(()=>{if(!closed)q('#boot-sound-status').textContent='AUDIO / UNAVAILABLE'});}catch{q('#boot-sound-status').textContent='AUDIO / UNAVAILABLE'}}
  function cue(stage){if(globalThis.CustomSounds?.play(stage===11?'boot-ready':'boot-module'))return;try{const c=audioContext();if(c.state!=='running'||document.hidden)return;[0,.09].forEach((delay,i)=>{const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=i?'sine':'triangle';o.frequency.setValueAtTime((stage>=6&&stage<=10?85:125)+stage*8,t);o.frequency.exponentialRampToValueAtTime(i?55:90,t+.3);g.gain.setValueAtTime(.09*prefs.volume/100,t);g.gain.exponentialRampToValueAtTime(.0001,t+.4);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.42);o.onended=()=>{o.disconnect();g.disconnect()};});}catch{}}
  function render(current){q('#boot-modules').replaceChildren();stages.forEach((stage,index)=>{const row=document.createElement('div');row.className='boot-module '+(index===current?'module-current':states[index]?'module-complete':'module-pending');const label=document.createElement('span'),value=document.createElement('b');label.textContent=stage.name;value.textContent=states[index]||(index===current?'CHECKING':'STANDBY');if(/UNAVAILABLE|NOT CONNECTED/.test(value.textContent))row.classList.add('module-unavailable');row.append(label,value);q('#boot-modules').append(row)});}
  function finish(){globalThis.CustomSounds?.stop('boot-hum');closed=true;clearTimeout(timer);stopHum();overlay.hidden=true;shell.inert=false;document.body.classList.remove('booting');document.dispatchEvent(new Event('surface-startup-complete'));q('nav button[aria-current]')?.focus({preventScroll:true});}
  function runStage(index){if(closed)return;if(index>=stages.length){q('#boot-status').textContent='SYSTEM CHECK COMPLETE';timer=setTimeout(finish,650);return}const stage=stages[index];q('#boot-phase').textContent=stage.name;q('#boot-status').textContent='VALIDATING '+stage.name;render(index);timer=setTimeout(()=>{if(closed)return;try{states[index]=stage.check()}catch{states[index]='CHECK FAILED'}q('#boot-progress').value=index+1;cue(index);render(index+1);runStage(index+1);},stage.wait);}
  function start(){clearTimeout(timer);stopHum();closed=false;states=[];q('#boot-progress').value=0;overlay.hidden=false;shell.inert=true;document.body.classList.add('booting');overlay.focus({preventScroll:true});unlock();runStage(0);}
  overlay.addEventListener('pointerdown',unlock);overlay.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();overlay.focus({preventScroll:true})}unlock()});
  document.addEventListener('visibilitychange',()=>{if(closed)return;if(document.hidden)stopHum();else unlock()});
  const replay=document.createElement('button');replay.textContent='RUN SYSTEM CHECK';replay.onclick=start;q('#systems .systems-layout').after(replay);start();
})();
