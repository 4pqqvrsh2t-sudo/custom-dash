'use strict';
const PinDiagram=(()=>{
  const gpios=[...Array(20).keys(),21,22,23,25,26,27,32,33,34,35,36,37,38,39];
  let report=[],stamp=0,open=false,preview=false,selected=21;
  function update(pins,time,connected){report=pins;stamp=time;open=connected;render();}
  function render(){const rows=preview?[{gpio:21,connected:true,label:'I2C / SDA'},{gpio:22,connected:true,label:'I2C / SCL'},{gpio:34,connected:true,label:'ANALOG INPUT'}]:report;const fresh=preview||(open&&stamp>0&&Date.now()-stamp<=5000);document.querySelector('#pin-mode').textContent=preview?'PREVIEW / EXAMPLE CONNECTIONS':fresh?'LIVE / FIRMWARE REPORT':'NO FRESH PIN REPORT';for(const gpio of gpios){const b=document.querySelector('[data-gpio="'+gpio+'"]'),r=rows.find(p=>p.gpio===gpio);const state=r?fresh?(r.connected?'CONNECTED':'UNCONNECTED'):'STALE':'UNKNOWN';b.classList.toggle('pin-live',!!r&&r.connected&&fresh);b.classList.toggle('pin-selected',gpio===selected);b.setAttribute('aria-label',`GPIO ${gpio}: ${state}${r?' / '+r.label:''}`);b.setAttribute('aria-pressed',String(gpio===selected));if(gpio===selected)document.querySelector('#pin-detail').textContent=`GPIO ${gpio} / ${state}${r?' / '+r.label:''}${preview?' / EXAMPLE ONLY':''}`;} }
  function init(){const grid=document.querySelector('#pin-board');gpios.forEach((gpio,i)=>{const b=document.createElement('button');b.type='button';b.dataset.gpio=String(gpio);b.className='pin-contact '+(i<17?'pin-left':'pin-right');b.style.gridRow=String(i%17+1);b.textContent='GPIO '+gpio;b.onclick=()=>{selected=gpio;render();};grid.append(b);});document.querySelector('#pin-preview').onchange=e=>{preview=e.target.checked;render();};render();}
  return {update,init};
})();
PinDiagram.init();
