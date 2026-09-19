const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('system test walks all systems, restores previews, and stops on measured motion',async()=>{
 const nodes=new Map(),timers=new Map(),events={},views=[],frames=[],tones=[],readings=[];let n=0,now=0;
 const node=()=>({checked:false,disabled:false,hidden:false,children:[],append(e){this.children.push(e)},after(e){nodes.set('#system-stress-test',e)},prepend(){},setAttribute(){},replaceChildren(){},dispatchEvent(){}});
 const q=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
 const context={document:{querySelector:q,createElement:node,addEventListener:(k,fn)=>events[k]=fn},window:{SurfaceDisplayTest:{frame:v=>readings.push(v),stop(){}},SurfaceTelemetry:{current:()=>({speed:0})},radarTone:k=>tones.push(k),SurfaceAlerts:{testTone:k=>tones.push(k)},addEventListener:(k,fn)=>events[k]=fn},SurfacePerception:{test:x=>frames.push(x),selectTest(){}},SpeedGauge:require('../instruments'),TelemetrySession:require('../telemetry').TelemetrySession,showView:v=>views.push(v),location:{hash:'#systems'},Event:class{},audioContext:()=>({resume:async()=>{}}),setTimeout:(fn,delay)=>{timers.set(++n,{fn,time:now+delay});return n},clearTimeout:id=>timers.delete(id),toast(){}};
 vm.runInNewContext(fs.readFileSync('system-test.js','utf8'),context);const start=q('#system-stress-test');await start.onclick();
 while(timers.size){const [id,item]=[...timers].sort((a,b)=>a[1].time-b[1].time)[0];timers.delete(id);now=item.time;item.fn();}
 assert(frames.some(x=>x?.length===200));assert(frames.some(x=>x?.length===25));assert(readings.some(x=>x.speed===150&&x.rpm===7500));assert.equal(readings.at(-1).speed,0);assert.equal(frames.at(-1),null);assert(now<18000);assert.equal(views.at(-1),'systems');assert.deepEqual(tones.slice(-3),['info','warning','critical']);assert.equal(start.disabled,false);assert.equal(q('#pin-preview').checked,false);
 await start.onclick();events['surface-telemetry']({detail:{speed:1}});assert.equal(start.disabled,false);assert.equal(timers.size,0);assert.match(q('#test-step').textContent,/MOVING/);
});
