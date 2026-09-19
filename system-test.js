'use strict';
(()=>{
 const q=s=>document.querySelector(s),button=document.createElement('button');button.id='system-stress-test';button.textContent='RUN SYSTEM STRESS TEST / PARKED';q('#systems .systems-layout').after(button);
 const panel=document.createElement('aside');panel.className='system-test-panel';panel.hidden=true;panel.setAttribute('role','status');panel.innerHTML='<b>TEST</b><span id="test-step"></span><button id="stop-system-test">STOP TEST</button>';q('main').prepend(panel);
 let runVersion=0,timer=null,animation=null,index=0,previousView='',previousPins=false,savedLimit=null;
 const targets=[{id:'t-car',type:'CAR',headingDegrees:40,confidence:.94},{id:'t-unoriented',type:'CAR',confidence:.8},{id:'t-person',type:'PERSON',confidence:.87},{id:'t-animal',type:'ANIMAL',confidence:.64},{id:'t-misc',type:'MISC',confidence:.4}].map((c,i)=>({...c,distanceMeters:30+i*30,bearingDegrees:-70+i*35}));
 function animate(duration,frame){let elapsed=0;const tick=()=>{frame(Math.min(1,elapsed/duration));elapsed+=50;if(elapsed<=duration)animation=setTimeout(tick,50);};tick();}
 function sweep(view){showView(view);animate(2000,p=>{const wave=p<=.5?p*2:(1-p)*2;window.SurfaceDisplayTest.frame({speed:150*wave,rpm:7500*wave,coolant:160+55*wave,voltage:12+2.5*wave,load:wave*100,throttle:wave*100});const limit=q('#speed-limit');limit.textContent=String([15,25,35,45,55,65,70][Math.min(6,Math.floor(p*7))]);q('.speed-limit-card small').textContent='TEST LIMIT / SIMULATED';});}
 const steps=[
 ...['map','road','vehicle'].map(mode=>({view:'proximity',label:mode.toUpperCase()+' SCANNER',duration:600,run(){SurfacePerception.test(targets,mode);}})),
 {view:'proximity',label:'MULTIPLE TARGETS',duration:2400,run(){SurfacePerception.test([],'proximity');animate(2200,p=>{SurfacePerception.test(Array.from({length:25},(_,i)=>({...targets[i%5],id:'moving-'+i,distanceMeters:20+(i*17+p*80)%170,bearingDegrees:i*137.5+p*40,headingDegrees:i%5===0?(i*45+p*90)%360:undefined})));});window.radarTone?.('arrival',true);}},
 {view:'proximity',label:'TARGETS DEPARTING',duration:700,run(){SurfacePerception.test(targets);window.radarTone?.('departure',true);}},
 {view:'proximity',label:'200 TARGET LOAD',duration:800,run(){SurfacePerception.test(Array.from({length:200},(_,i)=>({...targets[i%5],id:'load-'+i,distanceMeters:10+(i*13)%185,bearingDegrees:i*137.5})));}},
 {view:'data',label:'SPEED / RPM / LIVE CHART SWEEP',duration:2100,run(){sweep('data');}},
 {view:'navigation',label:'NAVIGATION SPEED SWEEP',duration:2100,run(){sweep('navigation');}},
 {view:'cockpit',label:'SPEED LIMIT DISPLAY',duration:2100,run(){sweep('cockpit');}},
 {view:'port',label:'EXAMPLE PINS',run(){window.SurfaceDisplayTest.stop();q('#pin-preview').checked=true;q('#pin-preview').dispatchEvent(new Event('change'));}},
 ...['info','warning','critical'].map(severity=>({view:'systems',label:'SOUND / '+severity.toUpperCase(),run(){window.SurfaceAlerts?.testTone?.(severity);}})),
 ...['radio','spotify','cargo'].map(view=>({view,label:view.toUpperCase()+' DISPLAY',run(){}}))
 ];
 function restore(){runVersion++;button.disabled=false;if(timer)clearTimeout(timer);if(animation)clearTimeout(animation);timer=animation=null;window.SurfaceDisplayTest.stop();if(savedLimit){q('#speed-limit').textContent=savedLimit.value;q('.speed-limit-card small').textContent=savedLimit.label;}SurfacePerception.test(null);q('#pin-preview').checked=previousPins;q('#pin-preview').dispatchEvent(new Event('change'));button.disabled=false;showView(previousView);}
 function next(){if(index>=steps.length){restore();q('#test-step').textContent='COMPLETE';q('#stop-system-test').textContent='CLOSE';return;}const step=steps[index++];showView(step.view);q('#test-step').textContent=index+' / '+steps.length+' — '+step.label;step.run();timer=setTimeout(next,step.duration||500);}
 button.onclick=async()=>{if(button.disabled)return;if((window.SurfaceTelemetry?.current().speed??0)>0){toast('Stop the vehicle before running the system test');return;}button.disabled=true;const version=++runVersion;previousView=location.hash.slice(1)||'systems';previousPins=q('#pin-preview').checked;savedLimit={value:q('#speed-limit').textContent,label:q('.speed-limit-card small').textContent};panel.hidden=false;q('#stop-system-test').textContent='STOP TEST';index=0;try{await audioContext().resume();}catch{}if(version===runVersion&&button.disabled)next();};
 q('#stop-system-test').onclick=()=>{if(button.disabled)restore();panel.hidden=true;};
 window.addEventListener('surface-telemetry',e=>{if(button.disabled&&Number.isFinite(e.detail.speed)&&e.detail.speed>0){restore();q('#test-step').textContent='STOPPED / MOVING';}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&button.disabled){restore();panel.hidden=true;}});
})();
