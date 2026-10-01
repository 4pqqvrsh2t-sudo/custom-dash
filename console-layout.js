'use strict';
// Center-console composition. Existing controllers keep ownership of their data and devices.
(() => {
  const q = s => document.querySelector(s);
  const make = (tag, cls, html = '') => { const n = document.createElement(tag); n.className = cls; n.innerHTML = html; return n; };
  const paths = {
    home:'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',
    map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16',
    music:'M9 18V5l11-2v13M9 8l11-2M9 18c0 2-6 4-6 1s6-4 6-1Zm11-2c0 2-6 4-6 1s6-4 6-1Z',
    surround:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M9 7h6v11H9ZM9 10h6',
    cargo:'m3 7 9-4 9 4v11l-9 4-9-4Zm0 0 9 4 9-4m-9 4v11M7 5l9 4',
    truck:'M2 7h12v10H2Zm12 4h5l3 4v2h-8M5 17a2 2 0 1 0 4 0m7 0a2 2 0 1 0 4 0',
    camera:'M3 7h5l2-3h4l2 3h5v14H3Zm13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    chip:'M6 6h12v12H6ZM9 9h6v6H9ZM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4',
    arrow:'M4 12h16m-6-6 6 6-6 6',
    settings:'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6',
    pause:'M8 5v14M16 5v14', play:'m8 4 12 8-12 8Z'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ? `<path d="${paths[name]}"/>` : ''}</svg>`;
  const button = (html, view, cls = '') => { const b = make('button', cls, html); b.type = 'button'; b.onclick = () => showView(view); return b; };
  const shell = q('.shell'), home = q('#cockpit'), header = q('header'), nav = q('nav');
  document.body.classList.add('center-console');
  document.title = 'Frontier / Center Console';
  q('.location').remove(); q('footer').remove();
  header.replaceChildren(make('div','console-brand','<b>FRONTIER</b><span>CENTER CONSOLE</span>'), make('span','console-page','Home'), q('#clock'), button(icon('settings'),'systems','console-settings'));
  q('.console-settings').setAttribute('aria-label','Console settings');
  const destinations = [['cockpit','Home','home'],['navigation','Map','map'],['radio','Audio','music'],['proximity','Surround','surround'],['cargo','Cargo','cargo'],['data','Vehicle','truck']];
  nav.replaceChildren();
  destinations.forEach(([view,label,glyph]) => { const b = button(`${icon(glyph)}<span>${label}</span>`,view); b.dataset.view = view; nav.append(b); });
  const groups = { parking:'proximity', spotify:'radio', port:'data', systems:'data' };
  const titles = {cockpit:'Home',navigation:'Navigation',radio:'Audio',spotify:'Spotify',proximity:'Surround',parking:'Cameras',cargo:'Cargo',data:'Vehicle',port:'ESP32',systems:'Settings'};
  const originalShow = showView;
  showView = function(view) {
    originalShow(view);
    const current = location.hash.slice(1), group = groups[current] || current;
    nav.querySelectorAll('button').forEach(b => { if(b.dataset.view === group) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
    q('.console-page').textContent = titles[current] || 'Home';
    document.body.dataset.screen = current;
    document.querySelectorAll('.console-tabs button').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.target === current)));
  };

  // The home screen is a launcher and media surface, not a second instrument cluster.
  const scanner = q('.cockpit-scanner'), nowPlaying = q('#cockpit-now-playing'), limit = q('.speed-limit-card');
  const homeGrid = make('div','console-home');
  const media = make('article','home-audio',`<div class="home-card-top"><span>${icon('music')} AUDIO</span><span id="home-audio-state">NOT PLAYING</span></div><div class="home-audio-body"><div class="disc-mark" aria-hidden="true"><span></span></div><div><small id="home-audio-source">RADIO · LOCAL FILES · SPOTIFY</small><h1 id="home-audio-title">Your music.<br>Your drive.</h1><p id="home-audio-description">Choose something to listen to.</p></div></div><div class="home-audio-actions"></div>`);
  media.querySelector('.home-audio-actions').append(button('Radio & files','radio'),button('Spotify','spotify'));
  const mapLaunch = button(`<span class="launch-icon">${icon('map')}</span><span><small>NAVIGATION</small><b>Where to?</b></span>${icon('arrow')}`,'navigation','home-map');
  const vehicle = make('article','home-vehicle',`<div class="home-card-top"><span>YOUR TRUCK</span><span>2016 / V6</span></div><h2>Frontier</h2><div class="truck-stage"><svg viewBox="0 0 620 235" role="img" aria-label="Pickup truck illustration"><ellipse cx="310" cy="202" rx="251" ry="10" fill="currentColor" opacity=".06"/><path d="M58 113h196l34-59h126l50 68 73 13 22 30v24h-37c-3-54-75-54-80 0H199c-5-54-78-54-82 0H62l-10-31Z" fill="#718579" stroke="#b8c9bd" stroke-width="2"/><path d="M271 114l26-48h42v48Zm80-48h56l35 48h-91Z" fill="#16221d" stroke="#91a79a" stroke-width="2"/><path d="M256 119v61m91-58v62m107-55 11 31M62 120h183M66 141h179m-173 14h57m72 26h243M366 129h17m-83 0h17" stroke="#b4c4b7" stroke-width="2" fill="none"/><path d="M527 141h17l8 12h-23Z" fill="#d4ddca"/><path d="M59 140h11v22H55" fill="#bd907c"/><path d="M458 119h-16v-10h17Z" fill="#8a9f92"/><g fill="#111915" stroke="#80968a" stroke-width="2"><circle cx="157" cy="186" r="34"/><circle cx="482" cy="186" r="34"/></g><g fill="#80968a" stroke="#b7c8bd" stroke-width="2"><circle cx="157" cy="186" r="17"/><circle cx="482" cy="186" r="17"/></g><g fill="#26362d"><circle cx="157" cy="186" r="8"/><circle cx="482" cy="186" r="8"/></g></svg></div><div class="vehicle-shortcuts"></div>`);
  vehicle.querySelector('.vehicle-shortcuts').append(button(`${icon('surround')}<span>Surround</span>`,'proximity'),button(`${icon('camera')}<span>Cameras</span>`,'parking'));
  const utilities = make('div','home-utilities');
  utilities.append(button(`${icon('cargo')}<span><b>Cargo</b><small id="console-cargo-count">Inventory & scanner</small></span>${icon('arrow')}`,'cargo'),button(`${icon('chip')}<span><b>ESP32</b><small>Connections & pins</small></span>${icon('arrow')}`,'port'));
  homeGrid.append(media,vehicle,mapLaunch,utilities);
  home.replaceChildren(homeGrid);
  home.setAttribute('aria-label','Console home');
  // Retain controller-owned elements, with the compact scanner available as a vehicle detail.
  const compact = make('details','compact-surround','<summary>Compact surround display</summary>');compact.append(scanner);q('#data').append(compact);
  nowPlaying.classList.add('controller-now-playing');shell.append(nowPlaying);

  // Always-reachable media strip. Transport delegates to the existing playback controller.
  const controls = make('div','console-controls',`<button class="console-media-link" aria-label="Open audio"><span class="media-glyph">${icon('music')}</span><span><b id="console-track">Nothing playing</b><small id="console-source">Choose an audio source</small></span></button><button class="console-play" aria-label="Choose audio">${icon('play')}</button><label class="console-volume">VOL<input type="range" min="0" max="100" aria-label="Console volume"></label><div class="console-speed"><strong class="live-speed">—</strong><span>MPH</span></div>`);
  controls.querySelector('.console-media-link').onclick = () => showView(source === 'spotify' ? 'spotify' : 'radio');
  let audioSelected = Boolean(localURL) || playing || scanning;
  controls.querySelector('.console-play').onclick = () => { if(source === 'spotify') showView('spotify'); else if(!audioSelected) showView('radio'); else q('#radio [data-action="play"]').click(); };
  controls.querySelector('input').value = q('#volume').value;
  controls.querySelector('input').oninput = e => { q('#volume').value = e.target.value; q('#volume').dispatchEvent(new Event('input')); };
  q('#volume').addEventListener('input',() => { controls.querySelector('input').value = q('#volume').value; });
  controls.append(limit);nav.before(controls);
  function refreshMedia() {
    const active = playing && !scanning;
    audioSelected = audioSelected || active || scanning || Boolean(localURL);
    q('#console-track').textContent = source === 'spotify' ? 'Spotify player' : audioSelected ? q('#radio .track-name').textContent : 'Nothing playing';
    q('#console-source').textContent = source === 'spotify' ? 'Open player to control playback' : scanning ? 'Scanning demo stations…' : localURL ? (active ? 'Local audio · playing' : 'Local audio · paused') : audioSelected ? (active ? 'Synthetic radio · demo' : 'Demo radio · paused') : 'Choose an audio source';
    q('.console-play').innerHTML = icon(active && source !== 'spotify' ? 'pause' : 'play');
    q('.console-play').setAttribute('aria-label',source === 'spotify' ? 'Open Spotify player' : active ? 'Pause audio' : audioSelected ? 'Play audio' : 'Choose audio');
    q('#home-audio-state').textContent = active ? 'PLAYING' : source === 'spotify' ? 'PLAYER LOADED' : audioSelected ? 'PAUSED' : 'NOT PLAYING';
    q('#home-audio-title').textContent = audioSelected || source === 'spotify' ? q('#console-track').textContent : 'Your music. Your drive.';
    q('#home-audio-source').textContent = source === 'spotify' ? 'SPOTIFY' : audioSelected ? (localURL ? 'LOCAL AUDIO' : 'DEMO RADIO') : 'RADIO · LOCAL FILES · SPOTIFY';
    q('#home-audio-description').textContent = audioSelected || source === 'spotify' ? q('#console-source').textContent : 'Choose something to listen to.';
    media.classList.toggle('is-playing',active);
  }
  const mediaObserver = new MutationObserver(refreshMedia);
  mediaObserver.observe(nowPlaying,{attributes:true,childList:true,subtree:true});
  mediaObserver.observe(q('#radio .track-name'),{childList:true});
  mediaObserver.observe(q('#radio [data-action="play"]'),{attributes:true,childList:true});
  const refreshCargoCount = () => { q('#console-cargo-count').textContent = q('#cargo-count').textContent.toLowerCase() + ' in inventory'; };
  new MutationObserver(refreshCargoCount).observe(q('#cargo-count'),{childList:true});refreshCargoCount();

  // Page-level controls, with no duplicate side rails or decorative tabs.
  document.querySelectorAll('.subtabs,.ed-tabs').forEach(n => n.remove());
  function tabs(view,items) { const bar=make('div','console-tabs');items.forEach(([target,label])=>{const b=button(label,target);b.dataset.target=target;bar.append(b);});q('#'+view).prepend(bar); }
  ['proximity','parking'].forEach(v=>tabs(v,[['proximity','Surround'],['parking','Cameras']]));
  ['radio','spotify'].forEach(v=>tabs(v,[['radio','Radio & files'],['spotify','Spotify']]));
  ['data','port','systems'].forEach(v=>tabs(v,[['data','Measurements'],['port','ESP32'],['systems','Settings']]));
  document.querySelectorAll('.section-heading small').forEach(n=>n.remove());
  Object.entries({navigation:'Navigation',radio:'Radio & local audio',spotify:'Spotify',data:'Vehicle measurements',proximity:'Around your truck',parking:'Parking cameras',cargo:'Cargo',port:'Connections',systems:'Console settings'}).forEach(([id,label])=>{const h=q('#'+id+' h1');if(h)h.textContent=label;});
  for(const [selector,id] of [['#scan-mode','drive-mode-buttons'],['#expanded-mode','surround-mode-buttons']]) {
    const select=q(selector), bar=make('div','mode-buttons');bar.id=id;select.parentElement.before(bar);
    [['proximity','All'],['vehicle','Vehicles'],['road','Road'],['map','Map']].forEach(([value,label])=>{const b=make('button','',label);b.onclick=()=>{select.value=value;select.dispatchEvent(new Event('change'));syncModes();};b.dataset.mode=value;bar.append(b);});
    if(selector==='#scan-mode')select.closest('label').hidden=true;else select.hidden=true;
  }
  function syncModes(){document.querySelectorAll('.mode-buttons button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===SurfacePerception.state().mode)));}
  document.querySelectorAll('#scan-mode,#expanded-mode').forEach(n=>n.addEventListener('change',syncModes));
  ['scanner-svg','proximity-scope','parking-scope'].forEach(id=>q('#'+id).setAttribute('viewBox','0 0 360 360'));
  ['scanner-svg','proximity-scope'].forEach(id=>q('#'+id).removeAttribute('role'));
  const scope=q('#proximity-scope').closest('article');scope.classList.add('surround-field');
  scope.append(make('div','target-legend','<span>↑ Vehicle</span><span>△ Person</span><span>□ Animal</span><span>◌ Other</span>'));
  const preview=make('details','preview-details','<summary>Preview contacts</summary>');preview.append(q('#perception-preview').closest('label'));scope.append(preview);
  const contacts=q('#contact-list').closest('article');contacts.classList.add('contact-console');
  const coverage=make('details','source-details','<summary>Sensor coverage & symbols</summary>'),sources=q('.sensor-source-list');let tail=sources.nextElementSibling;
  coverage.append(sources);while(tail){const next=tail.nextElementSibling;coverage.append(tail);tail=next;}contacts.append(coverage);
  q('#proximity .section-heading button')?.remove();

  const oldMap=q('.nav-layout'),mapDetails=make('details','route-preview','<summary>Try the route display · simulated</summary>');mapDetails.append(oldMap);
  const mapLanding=make('article','console-map-landing',`${icon('map')}<small>NAVIGATION</small><h2>Where to?</h2><p>Open your live map on the Android head unit.</p><div id="native-map-slot"></div><p class="map-note">Live navigation requires the native app. The browser route preview is simulated.</p>`);
  q('#navigation').append(mapLanding,mapDetails);q('#native-map-slot').append(q('#open-native-map'),q('#native-map-status'));oldMap.prepend(q('#route-toggle'));
  const testOverlay=q('#commissioning');new MutationObserver(()=>{document.body.classList.toggle('display-testing',!testOverlay.hidden);mapDetails.open=!testOverlay.hidden;}).observe(testOverlay,{attributes:true,attributeFilter:['hidden']});

  // Cargo is a three-stage workspace: capture, confirm, inventory, on every screen size.
  const cargo=q('#cargo'),cargoLayout=q('.cargo-layout'),camera=q('.cargo-camera-panel'),manifest=q('#cargo-list').closest('article');
  cargoLayout.className='console-cargo-workspace';camera.classList.add('cargo-scan');manifest.classList.add('cargo-manifest');
  const review=make('article','panel console-cargo-review','<div class="panel-title">Confirm item</div><p>Review the name, category and quantity before adding it.</p>');review.append(q('#cargo-capture'),q('#cargo-form'));
  const cargoTabs=make('div','console-cargo-tabs');
  const cargoPanes={scan:camera,review,inventory:manifest};
  function selectCargo(key){cargo.dataset.pane=key;Object.entries(cargoPanes).forEach(([k,pane])=>{pane.hidden=k!==key;});cargoTabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pane===key)));if(key!=='scan')q('#stop-camera').click();}
  [['scan','1','Scan'],['review','2','Confirm'],['inventory','3','Inventory']].forEach(([key,n,label])=>{const b=make('button','',`<span>${n}</span>${label}`);b.dataset.pane=key;b.onclick=()=>selectCargo(key);cargoTabs.append(b);});
  cargoLayout.before(cargoTabs);cargoLayout.append(review);
  cargoLayout.before(q('#cargo-status'));
  const toReview=make('button','cargo-review-button','Continue to confirm →');toReview.onclick=()=>selectCargo('review');camera.append(toReview);
  q('#manual-cargo').addEventListener('click',()=>{selectCargo('review');q('#cargo-label').focus();});
  const manual=make('button','cargo-manual-start','Enter an item manually');manual.onclick=()=>q('#manual-cargo').click();camera.append(manual);
  // The original controller fills suggested labels; do not clear its pending capture.
  const cargoStatusObserver=new MutationObserver(()=>{const status=q('#cargo-status').textContent;if(/CAPTURE READY|VISION SUGGESTION|VISION ANALYSIS FAILED/.test(status))selectCargo('review');else if(status==='VERIFIED ITEM ADDED / IMAGE DISCARDED')selectCargo('inventory');});cargoStatusObserver.observe(q('#cargo-status'),{childList:true});
  q('.cargo-note').textContent='Items are saved on this device. Camera suggestions need a connected vision provider and your confirmation.';
  selectCargo('scan');
  q('#radio .album').remove();q('#radio .media-layout').classList.add('audio-workspace');
  const demoTuner=make('details','demo-tuner','<summary>Demo radio tuner</summary>');demoTuner.append(q('.tuner'),q('#playlist'));q('#radio').append(demoTuner);
  q('#radio .section-heading>span').textContent='LOCAL FILES / DEMO RADIO';
  q('.data-instrument').classList.add('digital-instrument');
  refreshMedia();syncModes();showView(location.hash.slice(1)||'cockpit');
})();
