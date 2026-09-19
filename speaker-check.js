'use strict';
(()=>{
 const box=document.createElement('div');box.className='panel speaker-check';box.innerHTML='<button id="enable-speaker-audio">ENABLE / TEST AUDIO</button><p id="speaker-status" role="status">Tap to unlock audio. If silent, turn Silent Mode off, raise media volume and select iPhone in Control Center’s audio output menu. The dashboard cannot force speaker routing.</p>';document.querySelector('#systems').append(box);
 async function unlock(){try{const c=audioContext();await c.resume();return c;}catch{return null;}}
 document.addEventListener('pointerdown',()=>{unlock();});
 document.querySelector('#enable-speaker-audio').onclick=async()=>{const c=await unlock();const status=document.querySelector('#speaker-status');if(!c||c.state!=='running'){status.textContent='AUDIO BLOCKED / Open in Safari and tap again.';return;}const o=c.createOscillator(),g=c.createGain();o.frequency.value=660;o.type='sine';g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(.09,c.currentTime+.02);g.gain.linearRampToValueAtTime(0,c.currentTime+.35);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.36);o.onended=()=>{o.disconnect();g.disconnect();};status.textContent='TEST TONE SENT / Output is chosen by iOS. Playback mode may pause other apps’ audio.';};
})();
