'use strict';
/* New application composition; existing IDs retain their measured-data controllers. */
(()=>{
 const q=s=>document.querySelector(s),el=(tag,cls,html='')=>{const n=document.createElement(tag);n.className=cls;n.innerHTML=html;return n;};
 const button=(label,view,cls='')=>{const b=el('button',cls,label);b.type='button';b.onclick=()=>showView(view);return b;};
 document.body.classList.add('field-layout');
 const shell=q('.shell'),header=q('header');
 header.replaceChildren(el('div','vehicle-name','<b>FRONTIER<span> / 16</span></b><small>VEHICLE INTERFACE</small>'),el('div','page-name','<span id="field-section">DRIVE</span><small id="field-context">Driving overview</small>'),q('#clock'));
 q('.location').remove();q('footer').remove();
 const nav=q('nav');nav.replaceChildren();
 const destinations=[['cockpit','Drive','01'],['navigation','Navigate','02'],['proximity','Surround','03'],['cargo','Cargo','04'],['systems','Tools','05']];
 destinations.forEach(([view,label,num])=>{const b=button(`<span>${num}</span><b>${label}</b>`,view);b.dataset.view=view;nav.append(b);});
 const contexts={cockpit:['DRIVE','Driving overview'],navigation:['NAVIGATE','Map and route guidance'],proximity:['SURROUND','Measured contacts'],parking:['SURROUND','Parking cameras'],cargo:['CARGO','Scan · review · store'],systems:['TOOLS','Connections and preferences'],data:['TOOLS','Vehicle measurements'],port:['TOOLS','ESP32 hardware'],radio:['TOOLS','Audio sources'],spotify:['TOOLS','Spotify']};
 const parent={parking:'proximity',data:'systems',port:'systems',radio:'systems',spotify:'systems'};
 const originalShow=showView;
 showView=function(view){originalShow(view);const current=location.hash.slice(1),group=parent[current]||current;nav.querySelectorAll('button').forEach(b=>{if(b.dataset.view===group)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});const info=contexts[current]||contexts.cockpit;q('#field-section').textContent=info[0];q('#field-context').textContent=info[1];document.body.dataset.screen=current;document.querySelectorAll('.field-subnav button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.target===current)));};
 // Recompose home around measured speed, a compact surrounding view and direct actions.
 const home=q('#cockpit'),scanner=q('.cockpit-scanner'),limit=q('.speed-limit-card'),music=q('#cockpit-now-playing');
 const drive=el('div','drive-workspace');
 const speed=el('article','drive-speed','<div class="eyebrow">VEHICLE SPEED</div><div class="drive-number"><strong class="live-speed">—</strong><span>MPH</span></div><div class="drive-secondary"><b id="drive-kmh">—</b><span>km/h</span></div><div class="rpm-meter"><div><span>ENGINE</span><b><span class="live-rpm">—</span> RPM</b></div><div class="meter-track"><i id="drive-rpm-fill"></i></div><div class="meter-labels"><span>0</span><span>DISPLAY SCALE · 8,000 RPM</span></div></div><p id="drive-source">Waiting for a measured speed source</p>');
 const side=el('aside','drive-actions');side.append(limit,button('Parking cameras <span>↗</span>','parking','action-tile'),button('Cargo scanner <span>↗</span>','cargo','action-tile'),button('Vehicle data <span>↗</span>','data','action-tile'));
 const sensorTitle=scanner.querySelector('.flight-top');sensorTitle.firstElementChild.textContent='SURROUNDINGS';
 scanner.append(button('Open Surround <span>→</span>','proximity','text-action'));
 drive.append(speed,scanner,side);home.replaceChildren(drive,music);
 // Contextual navigation is rebuilt, rather than inheriting six separate tab rails.
 document.querySelectorAll('.subtabs').forEach(n=>n.remove());
 function subnav(view,items){const bar=el('div','field-subnav');for(const [target,label] of items){const b=button(label,target);b.dataset.target=target;bar.append(b);}q('#'+view).prepend(bar);}
 for(const view of ['proximity','parking'])subnav(view,[['proximity','Contact view'],['parking','Parking cameras']]);
 for(const view of ['systems','data','port','radio','spotify'])subnav(view,[['systems','Overview'],['data','Vehicle data'],['port','ESP32'],['radio','Audio']]);
 // Replace drop-down-only scanner navigation with direct mode controls.
 for(const [selector,id] of [['#scan-mode','drive-mode-buttons'],['#expanded-mode','surround-mode-buttons']]){
  const select=q(selector),bar=el('div','mode-buttons');bar.id=id;select.parentElement.before(bar);
  for(const [value,label] of [['proximity','All'],['vehicle','Vehicles'],['road','Road'],['map','Map']]){const b=el('button','',label);b.dataset.mode=value;b.onclick=()=>{select.value=value;select.dispatchEvent(new Event('change'));syncModes();};bar.append(b);}
  if(selector==='#scan-mode')select.closest('label').hidden=true;else select.hidden=true;
 }
 function syncModes(){document.querySelectorAll('.mode-buttons button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===SurfacePerception.state().mode)));}
 document.querySelectorAll('#scan-mode,#expanded-mode').forEach(n=>n.addEventListener('change',syncModes));
 q('#scanner-svg').setAttribute('viewBox','0 0 360 360');q('#proximity-scope').setAttribute('viewBox','0 0 360 360');q('#parking-scope').setAttribute('viewBox','0 0 360 360');
 q('#scanner-svg').removeAttribute('role');q('#proximity-scope').removeAttribute('role');
 // A concise legend, with technical source details available on demand.
 const contacts=q('#contact-list').closest('article');contacts.classList.add('contact-console');
 const explanation=el('details','source-details','<summary>Sensor coverage & symbols</summary>');const sources=q('.sensor-source-list');let tail=sources.nextElementSibling;
 explanation.append(sources);while(tail){const next=tail.nextElementSibling;explanation.append(tail);tail=next;}contacts.append(explanation);
 const scopePanel=q('#proximity-scope').closest('article');scopePanel.classList.add('surround-field');
 scopePanel.append(el('div','target-legend','<span>↑ Vehicle</span><span>△ Person</span><span>□ Animal</span><span>◌ Other</span>'));
 const preview=q('#perception-preview').closest('label'),previewDetails=el('details','preview-details','<summary>Display preview</summary>');previewDetails.append(preview);scopePanel.append(previewDetails);
 q('#proximity .section-heading').querySelector('button')?.remove();
 // Navigation opens the actual native provider; the fictional road demo is secondary.
 const navView=q('#navigation'),oldMap=q('.nav-layout'),mapDetails=el('details','route-preview','<summary>Route display preview · simulated</summary>');mapDetails.append(oldMap);
 const navLanding=el('div','navigation-workspace','<article class="navigation-launch"><div class="eyebrow">MAPBOX / NATIVE NAVIGATION</div><h2>Where to?</h2><p>The live map runs in the Android dashboard app.</p><div id="native-map-slot"></div></article><article class="navigation-status"><small>MEASURED SPEED</small><strong class="live-speed">—</strong><span>MPH</span><p>Posted limits remain blank when road data is unavailable.</p></article>');
 navView.append(navLanding,mapDetails);q('#native-map-slot').append(q('#open-native-map'),q('#native-map-status'));q('#navigation .section-heading').append(q('#route-toggle'));q('#route-toggle').hidden=true;oldMap.prepend(q('#route-toggle'));q('#route-toggle').hidden=false;
 // Cargo becomes a dedicated camera/review workspace with a separate inventory view.
 const cargo=q('#cargo'),cargoLayout=q('.cargo-layout'),camera=q('.cargo-camera-panel'),manifest=q('#cargo-list').closest('article');
 cargoLayout.className='cargo-workspace';camera.classList.add('cargo-scan');manifest.classList.add('cargo-manifest');
 const cargoTabs=el('div','cargo-tabs');for(const [key,label] of [['scan','Scan cargo'],['manifest','Inventory']]){const b=el('button','',label);b.dataset.pane=key;b.onclick=()=>{cargo.dataset.pane=key;cargoTabs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(key==='manifest')q('#stop-camera').click();};cargoTabs.append(b);}cargoTabs.firstElementChild.setAttribute('aria-pressed','true');cargo.dataset.pane='scan';cargoLayout.before(cargoTabs);
 const review=el('div','cargo-review','<div class="eyebrow">02 / REVIEW & CONFIRM</div>');review.append(q('#cargo-form'));camera.append(review);q('#manual-cargo').addEventListener('click',()=>{cargoTabs.firstElementChild.click();q('#cargo-label').focus();});
 q('.cargo-viewport').prepend(el('span','camera-badge','01 / CARGO CAMERA'));q('.cargo-manifest .panel-title').firstChild.textContent='STORED INVENTORY ';q('.cargo-note').textContent='Automatic suggestions require a connected vision provider. Confirm each item before saving.';
 // Tools overview uses direct destinations rather than inert decorative sub-tabs.
 document.querySelectorAll('.ed-tabs').forEach(n=>n.remove());const toolsHome=el('div','tools-destinations');for(const [label,view] of [['Vehicle data','data'],['ESP32 connections','port'],['Radio & local audio','radio'],['Spotify','spotify']])toolsHome.append(button(label+' <span>↗</span>',view,'action-tile'));q('#systems .systems-layout').before(toolsHome);
 const radioSwitch=el('div','field-subnav');radioSwitch.append(button('Radio / local files','radio'),button('Spotify','spotify'));q('#radio').prepend(radioSwitch);const spotifySwitch=radioSwitch.cloneNode(false);spotifySwitch.append(button('Radio / local files','radio'),button('Spotify','spotify'));q('#spotify').prepend(spotifySwitch);
 q('#radio .album').remove();q('#radio .media-layout').classList.add('audio-workspace');
 const data=q('.data-instrument');data.classList.add('digital-instrument');q('.speed .eyebrow').textContent='VEHICLE SPEED';
 // Updates follow existing telemetry events, including the existing isolated test renderer.
 function refresh(){const reading=testTelemetry||SurfaceTelemetry.current();q('#drive-kmh').textContent=Number.isFinite(reading.speed)?(reading.speed*1.609344).toFixed(1):'—';const rpm=Number(q('#rpm').textContent.replaceAll(',',''));q('#drive-rpm-fill').style.width=(Number.isFinite(rpm)?Math.min(100,rpm/8000*100):0)+'%';q('#drive-source').textContent=q('#telemetry-source').textContent;syncModes();}
 const telemetryObserver=new MutationObserver(refresh);telemetryObserver.observe(q('#speed'),{childList:true});telemetryObserver.observe(q('#rpm'),{childList:true});
 const testOverlay=q('#commissioning');new MutationObserver(()=>{document.body.classList.toggle('display-testing',!testOverlay.hidden);mapDetails.open=!testOverlay.hidden;}).observe(testOverlay,{attributes:true,attributeFilter:['hidden']});
 showView(location.hash.slice(1)||'cockpit');refresh();
})();
