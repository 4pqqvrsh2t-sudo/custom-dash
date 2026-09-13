'use strict';
(() => {
  // Existing file decoding, playback state and errors stay owned by app.js.
  const input=document.querySelector('#audio-file'),original=input.onchange;input.multiple=true;
  input.parentElement.firstChild.textContent='BACKUP RADIO / LOAD AUDIO FILES';
  const list=document.createElement('div');list.className='backup-library';list.setAttribute('aria-label','Backup Radio files');input.parentElement.after(list);
  input.onchange=e=>{const files=Array.from(e.target.files);if(!files.length)return;list.replaceChildren();for(const file of files){const b=document.createElement('button');b.textContent=file.name;b.onclick=()=>original({target:{files:[file]}});list.append(b)}original({target:{files:[files[0]]}});};
  const info=document.createElement('article');info.className='panel antenna-info';info.innerHTML='<div class="panel-title">ANTENNA RADIO <span>HARDWARE ACCESS UNAVAILABLE</span></div><p>This browser cannot tune an iPhone or truck antenna. Truck reception requires its native radio app or a verified head-unit tuner integration.</p><a href="https://music.apple.com/radio" target="_blank" rel="noopener">OPEN INTERNET RADIO IN APPLE MUSIC ↗</a><p class="tiny">Internet connection required. The frequency dial below remains a synthetic demo. Backup Radio plays your selected local files without uploading them; choose the files again after a reload.</p>';
  document.querySelector('#radio .section-heading').after(info);
})();
