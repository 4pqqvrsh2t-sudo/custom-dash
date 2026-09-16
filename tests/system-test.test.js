const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('system test walks all systems, restores previews, and stops on measured motion',async()=>{
 const nodes=new Map(),timers=new Map(),events={},views=[],frames=[],tones=[];let n=0;
 const node=()=>({checked:false,disabled:false,hidden:false,children:[],append(e){this.children.push(e)},after(e){nodes.set('#system-stress-test',e)},prepend(){},setAttribute(){},replaceChildren(){},dispatchEvent(){}});
 const q=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
 const context={document:{querySelector:q,createElement:node,addEventListener:(k,fn)=>events[k]=fn},window:{SurfaceTelemetry:{current:()=>({speed:0})},radarTone:k=>tones.push(k),SurfaceAlerts:{testTone:k=>tones.push(k)},addEventListener:(k,fn)=>events[k]=fn},SurfacePerception:{test:x=>frames.push(x),selectTest(){}},SpeedGauge:require('../instruments'),TelemetrySession:require('../telemetry').TelemetrySession,showView:v=>views.push(v),location:{hash:'#systems'},Event:class{},audioContext:()=>({resume:async()=>{}}),setTimeout:fn=>{timers.set(++n,fn);return n},clearTimeout:id=>timers.delete(id),toast(){}};
 vm.runInNewContext(fs.readFileSync('system-test.js','utf8'),context);const start=q('#system-stress-test');await start.onclick();
 while(timers.size){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}
 assert(frames.some(x=>x?.length===200));assert.equal(frames.at(-1),null);assert.equal(views.at(-1),'systems');assert.deepEqual(tones.slice(-3),['info','warning','critical']);assert.equal(start.disabled,false);assert.equal(q('#pin-preview').checked,false);
 await start.onclick();events['surface-telemetry']({detail:{speed:1}});assert.equal(start.disabled,false);assert.equal(timers.size,0);assert.match(q('#test-step').textContent,/MOVING/);
});
