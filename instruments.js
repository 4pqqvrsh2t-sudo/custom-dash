'use strict';
const SpeedGauge = (()=>{
  const point=(r,f)=>{const a=(135+270*f)*Math.PI/180;return [180+r*Math.cos(a),170+r*Math.sin(a)];};
  function arc(r,f){f=Math.max(0,Math.min(1,f));if(!f)return '';const a=point(r,0),b=point(r,f);return `M${a.join(' ')} A${r} ${r} 0 ${f>2/3?1:0} 1 ${b.join(' ')}`;}
  const MPH_TO_METERS_PER_SECOND=.44704,MAX_MPH=120;
  function model(mph,unit='m/s'){
    const speed=Number.isFinite(mph)?Math.max(0,mph):0;
    const metersPerSecond=speed*MPH_TO_METERS_PER_SECOND;
    const secondary=unit==='km/s'?metersPerSecond/1000:metersPerSecond;
    const secondaryMax=MAX_MPH*MPH_TO_METERS_PER_SECOND/(unit==='km/s'?1000:1);
    return {speed,mphFraction:Math.min(speed/MAX_MPH,1),secondary,secondaryMax,secondaryFraction:Math.min(secondary/secondaryMax,1)};
  }
  function render(mph){if(typeof document==='undefined')return;const unit=document.querySelector('#metric-unit').value,m=model(mph,unit),digits=unit==='km/s'?6:2;document.querySelector('#mph-fill').setAttribute('d',arc(145,m.mphFraction));document.querySelector('#metric-fill').setAttribute('d',arc(128,m.secondaryFraction));document.querySelector('#metric-speed').textContent=m.secondary.toFixed(digits);document.querySelector('#metric-max').textContent=`120 MPH = ${m.secondaryMax.toFixed(digits)} ${unit}`;document.querySelector('#speed-dial').setAttribute('aria-label',`${m.speed} miles per hour; exactly ${m.secondary.toFixed(digits)} ${unit}. Simulated speed.`);}
  function init(){const svg=document.querySelector('#dial-ticks'),ns='http://www.w3.org/2000/svg';for(let mph=0;mph<=120;mph+=5){const major=mph%20===0,a=point(156,mph/120),b=point(major?137:148,mph/120),p=document.createElementNS(ns,'path');p.setAttribute('d',`M${a.join(' ')}L${b.join(' ')}`);p.setAttribute('class','dial-tick');svg.append(p);if(major){const t=document.createElementNS(ns,'text'),xy=point(112,mph/120);t.setAttribute('x',xy[0]);t.setAttribute('y',xy[1]+4);t.textContent=mph;svg.append(t);}}document.querySelector('#mph-track').setAttribute('d',arc(145,1));document.querySelector('#metric-track').setAttribute('d',arc(128,1));document.querySelector('#metric-unit').onchange=()=>render(Number(document.querySelector('#speed').textContent));}
  return {model,arc,render,init};
})();
if(typeof module!=='undefined')module.exports=SpeedGauge;
if(typeof document!=='undefined')SpeedGauge.init();
