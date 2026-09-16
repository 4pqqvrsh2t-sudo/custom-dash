'use strict';
(()=>{
 const q=s=>document.querySelector(s),button=document.createElement('button');button.id='system-stress-test';button.textContent='RUN SYSTEM STRESS TEST / PARKED';q('#systems .systems-layout').after(button);
 const panel=document.createElement('aside');panel.className='system-test-panel';panel.hidden=true;panel.setAttribute('role','status');panel.innerHTML='<b>SYSTEM TEST / SIMULATED INPUTS ONLY</b><p id="test-step"></p><div id="test-fixture"></div><button id="stop-system-test">STOP TEST</button>';q('main').prepend(panel);
 let timer=null,index=0,previousView='',previousPins=false;
 const targets=[{id:'t-car',type:'CAR',headingDegrees:40,confidence:.94},{id:'t-unoriented',type:'CAR',confidence:.8},{id:'t-person',type:'PERSON',confidence:.87},{id:'t-animal',type:'ANIMAL',confidence:.64},{id:'t-misc',type:'MISC',confidence:.4}].map((c,i)=>({...c,distanceMeters:30+i*30,bearingDegrees:-70+i*35}));
 const steps=[
 ...targets.map((c,i)=>({view:'proximity',label:'RADAR / '+c.type+(c.headingDegrees!=null?' / HEADING REPORTED':''),run(){SurfacePerception.test([c]);SurfacePerception.selectTest(0);window.radarTone?.('arrival',true);}})),
 {view:'proximity',label:'RADAR / TARGET DEPARTURE',run(){SurfacePerception.test([]);window.radarTone?.('departure',true);}},
 {view:'proximity',label:'RADAR / 200 SYNTHETIC TARGETS · BATCH RENDER',run(){SurfacePerception.test(Array.from({length:200},(_,i)=>({...targets[i%5],id:'load-'+i,distanceMeters:10+(i*13)%185,bearingDegrees:i*137.5})));}},
 {view:'data',label:'SPEED CONVERSION / TEST FIXTURE · LIVE GAUGES UNCHANGED',run(){const m=SpeedGauge.model(60,'km/h');q('#test-fixture').textContent='60 MPH = '+m.secondary.toFixed(5)+' km/h';}},
 {view:'data',label:'CHART LOAD / 600 TEST SAMPLES',run(){const session=new TelemetrySession();for(let i=0;i<600;i++)session.record({rpm:1500+Math.sin(i/17)*700},.02);const points=session.history.map((r,i)=>`${i/2},${80-r.rpm/40}`).join(' ');q('#test-fixture').innerHTML='<svg viewBox="0 0 300 80" aria-label="Synthetic chart load test"><polyline fill="none" stroke="#fca34f" points="'+points+'"/></svg>';}},
 {view:'port',label:'ESP32 / EXAMPLE PIN INDICATORS',run(){q('#pin-preview').checked=true;q('#pin-preview').dispatchEvent(new Event('change'));}},
 ...['info','warning','critical'].map(severity=>({view:'systems',label:'DISCONNECT SOUND / '+severity.toUpperCase(),run(){window.SurfaceAlerts?.testTone?.(severity);}})),
 ...['navigation','radio','spotify','cargo','cockpit'].map(view=>({view,label:view.toUpperCase()+' / DISPLAY CHECK · HARDWARE NOT EXERCISED',run(){}}))
 ];
 function restore(){if(timer)clearTimeout(timer);timer=null;SurfacePerception.test(null);q('#pin-preview').checked=previousPins;q('#pin-preview').dispatchEvent(new Event('change'));button.disabled=false;showView(previousView);}
 function next(){if(index>=steps.length){restore();q('#test-step').textContent='SEQUENCE COMPLETE / Hardware, camera identification and road performance still require physical testing.';q('#test-fixture').replaceChildren();q('#stop-system-test').textContent='CLOSE';return;}const step=steps[index++];showView(step.view);q('#test-step').textContent=index+' / '+steps.length+' — '+step.label;q('#test-fixture').replaceChildren();step.run();timer=setTimeout(next,1800);}
 button.onclick=async()=>{if(button.disabled)return;if((window.SurfaceTelemetry?.current().speed??0)>0){toast('Stop the vehicle before running the system test');return;}button.disabled=true;previousView=location.hash.slice(1)||'systems';previousPins=q('#pin-preview').checked;panel.hidden=false;q('#stop-system-test').textContent='STOP TEST';index=0;try{await audioContext().resume();}catch{}next();};
 q('#stop-system-test').onclick=()=>{if(button.disabled)restore();panel.hidden=true;};
 window.addEventListener('surface-telemetry',e=>{if(button.disabled&&Number.isFinite(e.detail.speed)&&e.detail.speed>0){restore();q('#test-step').textContent='TEST STOPPED / VEHICLE MOVING';}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&button.disabled){restore();panel.hidden=true;}});
})();
