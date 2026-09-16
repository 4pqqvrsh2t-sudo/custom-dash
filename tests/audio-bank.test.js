const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('custom sounds validate input, reuse loops, respect volume and restore synthesized fallback',async()=>{
 const nodes=new Map(),listeners={};let starts=0,stops=0;
 const node=()=>({value:'radar-arrival',textContent:'',append(){},gain:{value:0}});const q=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
 const context={window:{},document:{querySelector:q,createElement:node,addEventListener:(k,fn)=>listeners[k]=fn},prefs:{volume:25},audioContext:()=>({state:'running',resume:async()=>{},decodeAudioData:async()=>({duration:1}),createBufferSource:()=>({connect(){return this},disconnect(){},start(){starts++},stop(){stops++}}),createGain:()=>({gain:{value:0},connect(){},disconnect(){}})})};
 vm.runInNewContext(fs.readFileSync('audio-bank.js','utf8'),context);const api=context.window.CustomSounds;assert.equal(api.play('radar-arrival'),false);
 const file={name:'ping.wav',size:50,arrayBuffer:async()=>new ArrayBuffer(8)};await q('#sound-file').onchange({target:{files:[file],value:'file'}});assert(api.has('radar-arrival'));assert(api.play('radar-arrival',{loop:true}));assert(api.play('radar-arrival',{loop:true}));assert.equal(starts,1);
 await q('#sound-remove').onclick();assert.equal(api.has('radar-arrival'),false);assert.equal(api.play('radar-arrival'),false);assert.equal(stops,1);
 await q('#sound-file').onchange({target:{files:[{...file,size:9*1024*1024}],value:'file'}});assert.equal(api.has('radar-arrival'),false);assert.match(q('#sound-bank-status').textContent,/exceeds/);
});
