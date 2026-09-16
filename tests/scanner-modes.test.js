const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
test('scanner modes keep measured detections opt-in and use five metre display steps',()=>{
  const nodes=new Map();
  function node(){return {dataset:{},children:[],style:{setProperty(){}},classList:{contains:()=>true},checked:true,attrs:{},append(e){this.children.push(e)},after(){},remove(){this.removed=true},insertBefore(){},setAttribute(k,v){this.attrs[k]=v},replaceChildren(){this.children=[]}};}
  const q=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
  vm.runInNewContext(fs.readFileSync('scanner-modes.js','utf8'),{document:{querySelector:q,createElement:node,createElementNS:node},location:{hash:''},showView(){},setInterval(){},matchMedia:()=>({matches:false})});
  const world=q('#scanner-world');assert.equal(world.children.filter(e=>e.attrs.class==='contact-lock').length,0);q('#scan-mode').onchange({target:{value:'map'}});assert.equal(world.children.filter(e=>e.attrs.width).length,8);
  q('#scan-mode').onchange({target:{value:'vehicle'}});assert.equal(world.children.filter(e=>e.attrs.class==='contact-lock').length,0);
  q('#perception-preview').onchange({target:{checked:true}});assert.equal(world.children.filter(e=>e.attrs.class==='contact-lock').length,1);
  q('#scan-mode').onchange({target:{value:'proximity'}});assert.equal(world.children.filter(e=>e.attrs.class==='contact-lock').length,4);
  q('#scan-mode').onchange({target:{value:'road'}});assert.equal(world.children.length,1);
  q('#scan-vehicles').onchange({target:{checked:true}});assert.equal(world.children.length,2);
  q('#perception-preview').onchange({target:{checked:false}});assert.equal(world.children.length,1);
  q('#scanner-in').onclick();assert.equal(q('#scanner-range').textContent,'195 M');
  for(let i=0;i<50;i++)q('#scanner-in').onclick();assert.equal(q('#scanner-range').textContent,'5 M');assert.equal(q('#scanner-in').disabled,true);
  assert.equal(q('#scanner-reset').removed,true);
});

test('sensor bridge validates measurements and exposes confidence hue',()=>{
  const nodes=new Map();
  function node(){return {children:[],style:{setProperty(){}},classList:{contains:()=>true},checked:false,attrs:{},append(e){this.children.push(e)},after(){},remove(){},setAttribute(k,v){this.attrs[k]=v},replaceChildren(){this.children=[]}};}
  const q=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
  const context={document:{querySelector:q,createElement:node,createElementNS:node},location:{hash:''},showView(){},setInterval(){},matchMedia:()=>({matches:false})};vm.runInNewContext(fs.readFileSync('scanner-modes.js','utf8'),context);
  assert.equal(context.SurfacePerception.ingestContacts([{type:'car',distanceMeters:12,bearingDegrees:4,confidence:.9},{type:'bad'}]),1);
  assert.deepEqual({...context.SurfacePerception.state()},{rangeMeters:200,mode:'proximity',preview:false,contactCount:1});
  assert.notEqual(context.SurfacePerception.confidenceColor(.2),context.SurfacePerception.confidenceColor(.9));
});
