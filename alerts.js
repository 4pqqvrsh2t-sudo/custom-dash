'use strict';
class SensorAlertMonitor {
  constructor(emit=()=>{}){this.states=new Map();this.emit=emit;this.severities=new Map();}
  configureSeverity(id,severity){if(!['info','warning','critical'].includes(severity))throw Error('Invalid severity');this.severities.set(id,severity);}
  update(id,connected,severity='warning',label=id){
    const previous=this.states.get(id);this.states.set(id,!!connected);
    if(previous===true&&!connected)this.emit({id,label,severity:this.severities.get(id)||severity});
  }
}
if(typeof module!=='undefined')module.exports={SensorAlertMonitor};
if(typeof window!=='undefined')(()=>{
  let enabled=true,pending=[],timer;
  try{enabled=localStorage.getItem('surface-sensor-alerts')!=='off';}catch{}
  const setting=document.createElement('label');setting.className='setting';setting.textContent='Sensor disconnect sounds';
  const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=enabled;setting.append(toggle);
  document.querySelector('#sounds').closest('label').after(setting);
  toggle.onchange=()=>{enabled=toggle.checked;try{localStorage.setItem('surface-sensor-alerts',enabled?'on':'off');}catch{}};
  const banner=document.createElement('div');banner.className='input-alert';banner.hidden=true;banner.setAttribute('role','status');document.querySelector('main').prepend(banner);
  const rank={info:0,warning:1,critical:2};
  const monitor=new SensorAlertMonitor(event=>{
    pending.push(event);if(timer)return;
    timer=setTimeout(()=>{
      const events=pending;pending=[];timer=null;events.sort((a,b)=>(rank[b.severity]??1)-(rank[a.severity]??1));const top=events[0];
      banner.replaceChildren();banner.hidden=false;banner.dataset.severity=top.severity;
      const label=document.createElement('span');label.textContent='INPUT LOST / '+events.map(e=>e.label).join(' · ');
      const dismiss=document.createElement('button');dismiss.textContent='ACK';dismiss.setAttribute('aria-label','Acknowledge disconnected inputs');dismiss.onclick=()=>banner.hidden=true;banner.append(label,dismiss);
      if(!enabled)return;
      try{
        const c=audioContext();if(c.state!=='running'){label.textContent+=' / SOUND NOT READY';return;}
        const notes=top.severity==='critical'?[220,110,220]:top.severity==='warning'?[180,120]:[130];
        notes.forEach((frequency,i)=>{const t=c.currentTime+i*.16,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(frequency*.75,t+.12);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,.16*prefs.volume/100),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.15);});
      }catch{label.textContent+=' / SOUND UNAVAILABLE';}
    },120);
  });
  window.SurfaceAlerts=monitor;
})();
