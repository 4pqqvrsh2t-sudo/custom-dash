'use strict';
// Stable tracker IDs must come from the detector; bearing is not heading.
class RadarEvents {
  constructor(emit=()=>{}){this.emit=emit;this.tracks=new Map();this.lastSound=-Infinity;}
  update(contacts,now=Date.now()){
    const seen=new Set(contacts.filter(c=>c.id!=null).map(c=>String(c.id))),events=[];
    for(const id of seen){let t=this.tracks.get(id);if(!t){t={present:false,flips:0,last:now,muted:false};this.tracks.set(id,t);}if(!t.present){t.flips++;t.present=true;t.muted=t.flips>=9;if(!t.muted)events.push('arrival');}t.last=now;}
    for(const [id,t] of this.tracks){if(!seen.has(id)&&t.present&&now-t.last>=1200){t.present=false;t.flips++;t.muted=t.flips>=9;if(!t.muted)events.push('departure');}if(now-t.last>300000)this.tracks.delete(id);}
    if(events.length&&now-this.lastSound>=2500){this.lastSound=now;this.emit(events.includes('arrival')?'arrival':'departure');}
  }
  reset(){this.tracks.clear();this.lastSound=-Infinity;}
}
if(typeof module!=='undefined')module.exports={RadarEvents};
if(typeof window!=='undefined'){
 window.RadarEvents=RadarEvents;
 let enabled=true;try{enabled=localStorage.getItem('surface-target-sounds')!=='off';}catch{}
 const label=document.createElement('label');label.className='setting';label.textContent='Radar arrival / departure sounds';const input=document.createElement('input');input.type='checkbox';input.checked=enabled;label.append(input);document.querySelector('#sounds').closest('label').after(label);input.onchange=()=>{enabled=input.checked;try{localStorage.setItem('surface-target-sounds',enabled?'on':'off');}catch{}};
 window.radarTone=(kind,test=false)=>{try{if(document.hidden||!enabled&&!test)return;const c=audioContext();if(c.state!=='running')return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type='sine';o.frequency.setValueAtTime(kind==='arrival'?260:200,t);o.frequency.exponentialRampToValueAtTime(kind==='arrival'?390:120,t+.12);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,.08*prefs.volume/100),t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.15);}catch{}};
}
