'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const tracks=[['DEEP SPACE SIGNAL',110,88.3],['AFTER THE ORBIT',146.83,94.7],['DISTANT HORIZONS',130.81,101.9]];
let ctx,ambient=[],gain,idleNodes=[],idleGain=null,playing=false,playPending=false,track=0,position=0,localURL=null,localName='',source='radio',toastTimer,scanTimer,scanToken=0,scanning=false,scanTarget=0,playToken=0,scanResume=false;
let prefs={glow:true,sounds:false,intensity:100,volume:25};
try{const saved=JSON.parse(localStorage.getItem('frontier-prefs')||'{}');for(const k of ['glow','sounds'])if(typeof saved[k]==='boolean')prefs[k]=saved[k];for(const k of ['intensity','volume'])if(Number.isFinite(saved[k]))prefs[k]=Math.min(100,Math.max(k==='intensity'?50:0,saved[k]));}catch{}
for(const key of ['glow','sounds'])$('#'+key).checked=prefs[key];$('#intensity').value=prefs.intensity;$('#volume').value=prefs.volume;
function applyPrefs(){document.body.classList.toggle('no-glow',!prefs.glow);document.documentElement.style.setProperty('--intensity',prefs.intensity/100);try{localStorage.setItem('frontier-prefs',JSON.stringify(prefs))}catch{}}
applyPrefs();
function audioContext(){try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}if(!ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');ctx=new Audio();}return ctx;}
function stopIdleBed(){window.CustomSounds?.stop('idle-hum');idleNodes.forEach(n=>{try{n.stop?.();n.disconnect()}catch{}});idleNodes=[];if(idleGain){try{idleGain.disconnect()}catch{}idleGain=null;}}
function musicChannelActive(){return playing||playPending||scanning||source==='spotify';}
function syncIdleBed(){
  if(document.hidden||document.body.classList.contains('booting')||musicChannelActive()){stopIdleBed();return}
  try{
    const c=audioContext();if(c.state!=='running'||idleNodes.length)return;if(window.CustomSounds?.has('idle-hum')){window.CustomSounds.play('idle-hum',{loop:true,volume:.12});return;}
    idleGain=c.createGain();idleGain.gain.value=.018*prefs.volume/100;idleGain.connect(c.destination);
    const hum=c.createOscillator(),harmonic=c.createOscillator(),harmonicGain=c.createGain(),lfo=c.createOscillator(),lfoGain=c.createGain();
    hum.type='sine';hum.frequency.value=47;harmonic.type='triangle';harmonic.frequency.value=94.3;harmonicGain.gain.value=.18;
    lfo.frequency.value=.13;lfoGain.gain.value=.0035*prefs.volume/100;lfo.connect(lfoGain).connect(idleGain.gain);
    hum.connect(idleGain);harmonic.connect(harmonicGain).connect(idleGain);hum.start();harmonic.start();lfo.start();idleNodes.push(hum,harmonic,lfo,harmonicGain,lfoGain);
    const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*.12;
    const noise=c.createBufferSource(),filter=c.createBiquadFilter(),noiseGain=c.createGain();noise.buffer=buffer;noise.loop=true;filter.type='lowpass';filter.frequency.value=520;noiseGain.gain.value=.2;noise.connect(filter).connect(noiseGain).connect(idleGain);noise.start();idleNodes.push(noise,filter,noiseGain);
  }catch{}
}
window.SurfaceAudio={syncIdleBed,stopIdleBed};
function clickSound(){} // Centralized feedback lives in enhancements.js.
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400);}
function installNavigationGroups(){
  const top=$('nav[aria-label="Main navigation"]');
  top.querySelector('[data-view="spotify"]')?.remove();top.querySelector('[data-view="port"]')?.remove();
  const media=top.querySelector('[data-view="radio"]');if(media)media.innerHTML='<span>◉</span>MEDIA';
  const groups={navigation:[['navigation','ROUTE'],['proximity','PROXIMITY']],radio:[['radio','RADIO'],['spotify','SPOTIFY']],spotify:[['radio','RADIO'],['spotify','SPOTIFY']],systems:[['systems','SYSTEMS'],['port','PORTS']],port:[['systems','SYSTEMS'],['port','PORTS']]};
  for(const [sectionId,tabs] of Object.entries(groups)){const section=$('#'+sectionId);if(!section)continue;const bar=document.createElement('div');bar.className='subtabs';bar.setAttribute('aria-label',sectionId+' sections');for(const [view,label] of tabs){const button=document.createElement('button');button.dataset.view=view;button.textContent=label;bar.append(button)}section.querySelector('.section-heading').after(bar)}
}
installNavigationGroups();
function installNativeMapControl(){
  const panel=$('#navigation .nav-info');if(!panel)return;
  const button=document.createElement('button');button.id='open-native-map';button.className='primary';button.textContent='OPEN LIVE MAP';
  const status=document.createElement('p');status.id='native-map-status';status.className='tiny';status.textContent='MAPBOX NAVIGATION / ANDROID BUILD';
  button.onclick=()=>{try{if(window.SurfaceNative&&typeof window.SurfaceNative.openNavigation==='function'){window.SurfaceNative.openNavigation();status.textContent='OPENING NATIVE MAPBOX MAP';return;}}catch{}status.textContent='NATIVE MAP REQUIRES THE ANDROID DASH APP';toast('Live Mapbox opens from the Android dashboard app.');};
  panel.append(button,status);
}
installNativeMapControl();
function showView(view){if(view==='media')view='radio';if(!['cockpit','navigation','data','radio','spotify','systems','port','proximity','parking','cargo'].includes(view))view='cockpit';const parent={proximity:'navigation',parking:'navigation',spotify:'radio',port:'systems'}[view]||view;$$('.view').forEach(e=>e.classList.toggle('active',e.id===view));$$('nav button').forEach(b=>{if(b.dataset.view===parent)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});$$('.subtabs [data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});history.replaceState(null,'','#'+view);window.dispatchEvent(new CustomEvent('surface-view',{detail:{view}}));$('#main').scrollTop=0;if(view==='data')renderData();}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>{clickSound();showView(b.dataset.view);}));window.addEventListener('hashchange',()=>showView(location.hash.slice(1)));
function updatePlay(){
  $$('.play').forEach(b=>{const external=source==='spotify'&&!b.closest('#radio');b.textContent=external?'↗':scanning?'■':playing?'Ⅱ':'▶';b.setAttribute('aria-label',external?'Open Spotify player':scanning?'Cancel station scan':playing?'Pause audio':'Play audio');b.setAttribute('aria-pressed',String(!external&&playing));b.disabled=playPending;});
  document.body.classList.toggle('radio-playing',playing&&!scanning&&source==='radio');
  $('#cockpit-now-playing').hidden=!(playing&&!scanning);
  syncIdleBed();
}
function updateNames(){
  const name=localURL?localName:tracks[track][0];$$('.track-name').forEach(e=>e.textContent=source==='spotify'&&!e.closest('#radio')?'SPOTIFY / PLAYER LOADED':name);
  $('#artist').textContent=localURL?'AUXILIARY / LOCAL FILE':'DEEP SPACE RADIO / AMBIENT DEMO';
  $('#cockpit-source').textContent=localURL?'AUXILIARY AUDIO':'DEEP SPACE RADIO';
  $$('.playlist button').forEach((b,i)=>{b.classList.toggle('active',!localURL&&i===track);b.setAttribute('aria-pressed',String(!localURL&&i===track));});
}
function stopAmbient(){window.CustomSounds?.stop('radio-scan');ambient.forEach(o=>{try{o.stop();o.disconnect();}catch{}});ambient=[];if(gain){gain.disconnect();gain=null;}}
function stopPlayback(){playToken++;playPending=false;$('#audio').pause();stopAmbient();playing=false;updatePlay();}
function startAmbient(){stopAmbient();const c=audioContext();gain=c.createGain();gain.gain.value=prefs.volume/100*.07;gain.connect(c.destination);[1,1.5,2.003].forEach(m=>{const o=c.createOscillator();o.type='sine';o.frequency.value=tracks[track][1]*m;o.connect(gain);o.start();ambient.push(o);});}
function scanNoise(){if(window.CustomSounds?.play('radio-scan',{loop:true,volume:.25}))return;try{const c=audioContext(),buffer=c.createBuffer(1,c.sampleRate*.25,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.2;const node=c.createBufferSource();node.buffer=buffer;node.loop=true;gain=c.createGain();gain.gain.value=prefs.volume/100*.07;node.connect(gain).connect(c.destination);node.start();ambient.push(node);}catch{}}
function releaseLocal(){if(localURL)URL.revokeObjectURL(localURL);localURL=null;localName='';$('#audio').removeAttribute('src');$('#audio-file').value='';$('#seek').max=180;$('#duration').textContent='3:00';}
function displayFrequency(value){$('#frequency').textContent=value.toFixed(1);$('#tuning-needle').style.left=Math.max(0,Math.min(100,(value-88)/20*100))+'%';}
function cancelScan(){clearInterval(scanTimer);scanToken++;scanning=false;$('#radio').classList.remove('scanning');stopAmbient();displayFrequency(tracks[track][2]);$('#tuner-state').textContent=localURL?'AUXILIARY INPUT':'SIGNAL LOCKED';$('#station-id').textContent=localURL?'LOCAL FILE':'CH 0'+(track+1)+' / '+tracks[track][0];updatePlay();}
function disconnectSpotify(announce=false){const frame=$('#spotify-player iframe');if(frame)frame.remove();$('#spotify-player').innerHTML=spotifyPlaceholder;$('#spotify-status').textContent='No Spotify player loaded.';$('#disconnect-spotify').disabled=true;source='radio';updateNames();updatePlay();if(announce)toast('Spotify player unloaded');}
async function togglePlay(){
  if(scanning){cancelScan();playing=false;updatePlay();return;}
  if(playing||playPending){stopPlayback();return;}
  if(source==='spotify')disconnectSpotify();
  const token=++playToken;playPending=true;updatePlay();
  try{if(localURL){if($('#audio').ended)$('#audio').currentTime=0;await $('#audio').play();}else{await audioContext().resume();if(token!==playToken)return;startAmbient();}if(token!==playToken)return;playing=true;}
  catch{if(token===playToken){playing=false;toast('Audio could not play. Try another file or tap Play again.');}}
  finally{if(token===playToken){playPending=false;updatePlay();}}
}
function chooseTrack(index){
  const resume=playing||(scanning&&scanResume);scanResume=resume;cancelScan();stopPlayback();if(source==='spotify')disconnectSpotify();releaseLocal();position=0;scanTarget=(index+tracks.length)%tracks.length;
  scanning=true;const token=++scanToken,target=scanTarget,start=tracks[track][2],finish=tracks[target][2];$('#radio').classList.add('scanning');$('#tuner-state').textContent='SCANNING BAND';$('#station-id').textContent='SEEK / SEARCHING CHANNELS';updatePlay();if(resume&&!document.hidden)scanNoise();
  let step=0;const total=10;scanTimer=setInterval(()=>{if(token!==scanToken)return;step++;displayFrequency(start+(finish-start)*step/total);$('#station-id').textContent='SEEK / '+(start+(finish-start)*step/total).toFixed(1)+' MHz';if(step>=total){clearInterval(scanTimer);track=target;scanning=false;$('#radio').classList.remove('scanning');stopAmbient();displayFrequency(finish);$('#tuner-state').textContent='SIGNAL LOCKED';$('#station-id').textContent='CH 0'+(track+1)+' / '+tracks[track][0];updateNames();updateProgress();updatePlay();if(resume&&!document.hidden)togglePlay();}},120);
}
$$('[data-action]').forEach(b=>b.addEventListener('click',()=>{clickSound();if(source==='spotify'&&!b.closest('#radio')){showView('spotify');return;}if(b.dataset.action==='play')togglePlay();else chooseTrack((scanning?scanTarget:track)+(b.dataset.action==='next'?1:-1));}));
$('#playlist').innerHTML=tracks.map((t,i)=>`<button data-track="${i}">0${i+1} / ${t[2]} MHz<br>${t[0]}</button>`).join('');$$('[data-track]').forEach(b=>b.onclick=()=>chooseTrack(Number(b.dataset.track)));
$('#waveform').innerHTML=Array.from({length:55},(_,i)=>`<i style="height:${15+Math.abs(Math.sin(i*1.7)*Math.cos(i*.31))*85}%"></i>`).join('');
function formatTime(n){if(!Number.isFinite(n))return '0:00';return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;}
function updateProgress(){const p=localURL?$('#audio').currentTime:position;$('#seek').value=p;$('#elapsed').textContent=formatTime(p);}
$('#seek').oninput=e=>{if(localURL&&Number.isFinite($('#audio').duration))$('#audio').currentTime=Number(e.target.value);else position=Number(e.target.value);updateProgress();};
$('#volume').oninput=e=>{prefs.volume=Number(e.target.value);window.CustomSounds?.setVolume();$('#audio').volume=prefs.volume/100;if(gain)gain.gain.value=prefs.volume/100*.07;if(idleGain)idleGain.gain.value=.018*prefs.volume/100;applyPrefs();};$('#audio').volume=prefs.volume/100;
$('#audio-file').onchange=e=>{const f=e.target.files[0];if(!f)return;cancelScan();stopPlayback();if(source==='spotify')disconnectSpotify();releaseLocal();localURL=URL.createObjectURL(f);localName=f.name.replace(/\.[^.]+$/,'');$('#audio').src=localURL;position=0;$('#seek').max=0;$('#duration').textContent='0:00';$('#tuner-state').textContent='AUXILIARY INPUT';$('#station-id').textContent='LOCAL FILE / NO BROADCAST';updateNames();updatePlay();updateProgress();toast('Audio loaded. Press play.');};
$('#audio').addEventListener('loadedmetadata',()=>{if(localURL&&Number.isFinite($('#audio').duration)){$('#seek').max=$('#audio').duration;$('#duration').textContent=formatTime($('#audio').duration);}});
$('#audio').addEventListener('timeupdate',updateProgress);
$('#audio').addEventListener('ended',()=>{playing=false;updatePlay();});
$('#audio').addEventListener('pause',()=>{if(localURL){playing=false;updatePlay();}});
$('#audio').addEventListener('error',()=>{if(localURL){stopPlayback();toast('This audio format could not be opened.');}});
for(const key of ['glow','sounds','intensity'])$('#'+key).addEventListener('input',e=>{prefs[key]=key==='intensity'?Number(e.target.value):e.target.checked;applyPrefs();});
const spotifyPlaceholder=$('#spotify-player').innerHTML;
try{$('#spotify-url').value=localStorage.getItem('frontier-spotify-url')||'';}catch{}
$('#spotify-form').onsubmit=e=>{e.preventDefault();let u;try{u=new URL($('#spotify-url').value.trim());}catch{u=null;}
  const match=u&&u.protocol==='https:'&&u.hostname==='open.spotify.com'&&!u.username&&!u.password&&u.pathname.match(/^\/(?:intl-[a-z-]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]{22})\/?$/);
  if(!match){$('#spotify-status').textContent='Use an open.spotify.com track, album, or playlist share link.';return;}
  cancelScan();stopPlayback();source='spotify';const frame=document.createElement('iframe');frame.title='Spotify music player';frame.allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';frame.src='https://open.spotify.com/embed/'+match[1]+'/'+match[2]+'?theme=0';$('#spotify-player').replaceChildren(frame);$('#disconnect-spotify').disabled=false;$('#spotify-status').textContent='Spotify player requested. Use its playback controls; availability depends on Spotify.';try{localStorage.setItem('frontier-spotify-url',u.origin+u.pathname);}catch{}updateNames();updatePlay();};
$('#disconnect-spotify').onclick=()=>disconnectSpotify(true);
let routeRunning=false,routeProgress=0,zoom=1;const distances=[4.2,7.8,2.6];
function resetRoute(){routeProgress=0;routeRunning=false;$('#route-toggle').textContent='START ROUTE';$('#route-state').textContent='ROUTE READY';renderRoute()}
function renderRoute(){const selected=Number($('#destination').value),d=distances[selected];$('#remaining').textContent=(d*(1-routeProgress)).toFixed(1);$('#eta').textContent=Math.ceil(d*2.85*(1-routeProgress));const line=$('#route-geometry'),p=line.getPointAtLength(line.getTotalLength()*routeProgress);$('#route-line').setAttribute('d',SurfaceProtocol.remainingRoute(routeProgress));$('#position').setAttribute('transform',`translate(${p.x} ${p.y})`);$('#turn-distance').textContent=routeProgress>=1?'ARRIVED':(Math.max(.1,.4*(1-(routeProgress*3)%1))).toFixed(1)+' MI';$('#turn-street').textContent=routeProgress>=1?'DESTINATION REACHED':routeProgress<.3?'EAST ON KENNEDY ST':routeProgress<.7?'NORTH TOWARD MAIN ST':'EAST ON MAIN ST';$('#turn-arrow').textContent=routeProgress>=1?'◈':routeProgress<.3?'↱':routeProgress<.7?'↰':'↱'}
$('#destination').onchange=resetRoute;
$('#route-toggle').onclick=()=>{clickSound();if(routeProgress>=1)routeProgress=0;routeRunning=!routeRunning;$('#route-toggle').textContent=routeRunning?'PAUSE ROUTE':'RESUME ROUTE';$('#route-state').textContent=routeRunning?'ROUTE ENGAGED / SIMULATION':'ROUTE PAUSED';if(routeRunning)toast('Route simulation engaged');renderRoute()};
function renderZoom(){$('.map-scale span').textContent=(.5/zoom).toFixed(2)+' MI / DEMO';$('#map-world').setAttribute('transform',`translate(${300-300*zoom} ${250-250*zoom}) scale(${zoom})`)}$('#zoom-in').onclick=()=>{zoom=Math.min(2.5,zoom+.25);renderZoom()};$('#zoom-out').onclick=()=>{zoom=Math.max(.75,zoom-.25);renderZoom()};$('#recenter').onclick=()=>{zoom=1;renderZoom()};
const telemetry=new TelemetrySession();let frozenSnapshot=null,testTelemetry=null,testSession=null;
const metrics=[{key:'speed',label:'GROUND SPEED',unit:'MPH',min:0,max:160,digits:0},{key:'rpm',label:'ENGINE SPEED',unit:'RPM',min:0,max:8000,digits:0},{key:'coolant',label:'COOLANT TEMP',unit:'°F',min:160,max:220,digits:1},{key:'voltage',label:'SYSTEM VOLTAGE',unit:'V',min:12,max:15,digits:2}];
$('#chart-grid').innerHTML=metrics.map(m=>`<article class="panel chart-panel"><div class="chart-top"><h2>${m.label}</h2><div class="chart-reading"><span id="value-${m.key}">—</span><small>${m.unit}</small></div></div><svg class="chart" id="chart-${m.key}" viewBox="0 0 360 150" role="img" aria-label="${m.label} data unavailable"><g>${[0,.5,1].map(f=>`<path class="grid-line" d="M35 ${12+112*f}H350"/><text x="0" y="${15+112*f}">${m.max-(m.max-m.min)*f}</text>`).join('')}</g><path class="area"/><path class="trace"/><circle class="point" r="2.5" cx="350" cy="124"/><text x="35" y="147" class="start-label">−60s</text><text x="327" y="147">NOW</text></svg><div class="chart-stats"><span>MIN<b id="min-${m.key}">—</b></span><span>AVG<b id="avg-${m.key}">—</b></span><span>MAX<b id="max-${m.key}">—</b></span></div></article>`).join('');
function renderData(){const snap=testSession?testSession.snapshot():frozenSnapshot||telemetry.snapshot(),rows=snap.history,win=Math.max(.001,snap.elapsed-(rows[0]?.t??snap.elapsed));$('#session-time').textContent=snap.count?formatTime(snap.elapsed):'—';$('#session-distance').textContent=snap.speedCount===0?'—':snap.distance.toFixed(2);$('#session-average').textContent=snap.average===null?'—':snap.average.toFixed(1);$('#session-peak').textContent=snap.peak===null?'—':snap.peak.toLocaleString();$('#sample-count').textContent=snap.count?snap.count+(testSession?' TEST SAMPLES':' REAL SAMPLES'):'NO SENSOR SAMPLES';$('#history-status').textContent=testSession?'SIMULATED DISPLAY TEST':frozenSnapshot?'VIEW HELD':'LIVE / EVERY RECEIVED SAMPLE';
  for(const m of metrics){const measured=rows.filter(r=>Number.isFinite(r[m.key])),vals=measured.map(r=>r[m.key]),last=vals.at(-1);$('#value-'+m.key).textContent=last===undefined||(!frozenSnapshot&&!Number.isFinite((testTelemetry||liveTelemetry)[m.key]))?'—':last.toFixed(m.digits);for(const k of ['min','avg','max'])$('#'+k+'-'+m.key).textContent=vals.length?(k==='min'?Math.min(...vals):k==='max'?Math.max(...vals):vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(m.digits):'—';
    const points=measured.map(r=>[35+315*(1-(snap.elapsed-r.t)/win),124-112*Math.max(0,Math.min(1,(r[m.key]-m.min)/(m.max-m.min)))]),chart=$('#chart-'+m.key),path=points.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(2)).join(' ')).join(' ');chart.querySelector('.trace').setAttribute('d',path);chart.querySelector('.area').setAttribute('d',points.length?path+' L'+points.at(-1)[0]+' 124 L'+points[0][0]+' 124 Z':'');const dot=chart.querySelector('.point');dot.style.display=points.length?'':'none';if(points.length){dot.setAttribute('cx',points.at(-1)[0]);dot.setAttribute('cy',points.at(-1)[1]);}chart.querySelector('.start-label').textContent='−'+win.toFixed(1)+'s';chart.setAttribute('aria-label',m.label+': '+(last===undefined?'data unavailable':last.toFixed(m.digits)+' '+m.unit)+', '+measured.length+' measured samples');}
}
const liveTelemetry={speed:null,rpm:null,coolant:null,voltage:null,fuel:null,load:null,throttle:null,intake:null},telemetrySeen={};let telemetrySource='NONE',lastTelemetryAt=null;
const telemetryRanges={speed:[0,200],rpm:[0,10000],coolant:[-40,300],voltage:[0,30],fuel:[0,100],load:[0,100],throttle:[0,100],intake:[-100,300]};
function formatReading(value,digits=0){return Number.isFinite(value)?value.toFixed(digits):'—'}
function updateTelemetry(){const display=testTelemetry||liveTelemetry;SpeedGauge.render(display.speed);$('#speed').textContent=formatReading(display.speed);$('#rpm').textContent=Number.isFinite(display.rpm)?Math.round(display.rpm).toLocaleString():'—';$$('.live-speed').forEach(e=>e.textContent=formatReading(display.speed));$$('.live-rpm').forEach(e=>e.textContent=Number.isFinite(display.rpm)?Math.round(display.rpm).toLocaleString():'—');$$('.live-coolant').forEach(e=>e.textContent=formatReading(display.coolant));$$('.live-voltage').forEach(e=>e.textContent=formatReading(display.voltage,1));$$('.live-fuel').forEach(e=>e.textContent=formatReading(display.fuel));$$('.live-load').forEach(e=>e.textContent=formatReading(display.load));$$('.live-throttle').forEach(e=>e.textContent=formatReading(display.throttle));$$('.live-intake').forEach(e=>e.textContent=formatReading(display.intake));$('#telemetry-source').textContent=testTelemetry?'SIMULATED DISPLAY TEST':telemetrySource==='NONE'?'NO LIVE SOURCE':telemetrySource+' / LIVE';if(!frozenSnapshot)$('#capture-status').textContent=testTelemetry?'SIMULATED DISPLAY TEST':telemetrySource==='NONE'?'NO LIVE SOURCE':telemetrySource+' / LIVE';if($('#data').classList.contains('active'))renderData();window.dispatchEvent(new CustomEvent('surface-telemetry',{detail:{...liveTelemetry,source:telemetrySource}}));}
function ingestTelemetry(values,source='EXTERNAL'){
  const clean={};for(const [key,range] of Object.entries(telemetryRanges)){const value=values?.[key];if(Number.isFinite(value)&&value>=range[0]&&value<=range[1])clean[key]=value;}
  if(!Object.keys(clean).length)return false;const now=Date.now(),dt=lastTelemetryAt?Math.min(5,Math.max(0,(now-lastTelemetryAt)/1000)):0;lastTelemetryAt=now;Object.assign(liveTelemetry,clean);for(const key of Object.keys(clean)){telemetrySeen[key]=now;window.SurfaceAlerts?.update('telemetry:'+key,true,key==='speed'||key==='coolant'?'critical':'warning',key+' input');}telemetrySource=String(source).slice(0,24).toUpperCase();telemetry.record(clean,dt);updateTelemetry();return true;
}
window.SurfaceTelemetry={ingest:ingestTelemetry,current:()=>({...liveTelemetry,source:telemetrySource})};
window.SurfaceDisplayTest={frame(values){if(!testSession)testSession=new TelemetrySession();testTelemetry={...values};testSession.record(values,.05);updateTelemetry();},stop(){testTelemetry=null;testSession=null;updateTelemetry();}};

function clearStaleTelemetry(forceSpeed=false){const now=Date.now();let changed=false;for(const key of Object.keys(liveTelemetry))if(Number.isFinite(liveTelemetry[key])&&(forceSpeed&&key==='speed'||now-(telemetrySeen[key]||0)>10000)){liveTelemetry[key]=null;window.SurfaceAlerts?.update('telemetry:'+key,false,key==='speed'||key==='coolant'?'critical':'warning',key+' input');changed=true}if(changed){if(!Object.values(liveTelemetry).some(Number.isFinite))telemetrySource='NONE';updateTelemetry()}}
let gpsWatch=null;$('#enable-gps').onclick=()=>{if(!navigator.geolocation){$('#gps-status').textContent='GPS UNAVAILABLE IN THIS BROWSER';return}if(gpsWatch!==null){navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null;clearStaleTelemetry(true);$('#enable-gps').textContent='ENABLE GPS SPEED';$('#gps-status').textContent='GPS STOPPED / SPEED UNAVAILABLE';return}$('#gps-status').textContent='REQUESTING LOCATION PERMISSION';gpsWatch=navigator.geolocation.watchPosition(position=>{const mps=position.coords.speed;if(!Number.isFinite(mps)){clearStaleTelemetry(true);$('#gps-status').textContent='GPS FIX / SPEED UNAVAILABLE';return}const mph=Math.max(0,SpeedGauge.metersPerSecondToMph(mps));ingestTelemetry({speed:mph<.5?0:mph},'GPS');$('#gps-status').textContent=`GPS SPEED / POSITION ±${Math.round(position.coords.accuracy||0)} M`;$('#enable-gps').textContent='STOP GPS SPEED';},error=>{clearStaleTelemetry(true);$('#gps-status').textContent='GPS ERROR / '+error.message.toUpperCase();if(error.code===1){gpsWatch=null;$('#enable-gps').textContent='ENABLE GPS SPEED'}},{enableHighAccuracy:true,maximumAge:1000,timeout:10000});};

$('#freeze-data').onclick=()=>{if(testSession)return;frozenSnapshot=frozenSnapshot?null:telemetry.snapshot();$('#freeze-data').textContent=frozenSnapshot?'RESUME GRAPHS':'FREEZE GRAPHS';$('#capture-status').textContent=frozenSnapshot?'Ⅱ FROZEN VIEW':telemetrySource==='NONE'?'NO LIVE SOURCE':telemetrySource+' / LIVE';$('#capture-status').classList.toggle('frozen',!!frozenSnapshot);renderData();};
$('#reset-data').onclick=()=>{if(testSession)return;telemetry.reset();frozenSnapshot=null;$('#freeze-data').textContent='FREEZE GRAPHS';$('#capture-status').textContent=telemetrySource==='NONE'?'NO LIVE SOURCE':telemetrySource+' / LIVE';$('#capture-status').classList.remove('frozen');renderData();toast('Telemetry session reset');};
function tick(){if(document.hidden)return;$('#clock').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});clearStaleTelemetry();if(playing&&!localURL&&!scanning){position++;if(position>=180)position=0;updateProgress();}if(routeRunning){routeProgress=Math.min(1,routeProgress+1/90);if(routeProgress>=1){routeRunning=false;$('#route-toggle').textContent='REPLAY ROUTE';$('#route-state').textContent='DESTINATION REACHED';toast('Destination reached');}renderRoute();}}
updateNames();updatePlay();displayFrequency(tracks[track][2]);renderRoute();updateTelemetry();renderData();showView(location.hash.slice(1));tick();setInterval(tick,1000);
document.addEventListener('surface-startup-complete',syncIdleBed);
document.addEventListener('pointerdown',()=>{if(!document.body.classList.contains('booting')){try{audioContext().resume().then(syncIdleBed).catch(()=>{})}catch{}}},{once:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopIdleBed();if(scanning){cancelScan();playing=false;}if(playing&&!localURL)stopPlayback();updatePlay();}else if(ctx&&ctx.state==='suspended'&&playing&&!localURL){stopPlayback();}else syncIdleBed();});
