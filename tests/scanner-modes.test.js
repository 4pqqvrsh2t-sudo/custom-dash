const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
test('scanner modes keep measured detections opt-in and use five metre display steps',()=>{
  const nodes=new Map();
  function node(){return {dataset:{},children:[],style:{setProperty(){}},classList:{contains:()=>true},checked:true,attrs:{},append(e){this.children.push(e)},after(){},remove(){this.removed=true},insertBefore(){},setAttribute(k,v){this.attrs[k]=v},replaceChildren(){this.children=[]}};}
  const q=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
  vm.runInNewContext(fs.readFileSync('scanner-modes.js','utf8'),{document:{querySelector:q,createElement:node,createElementNS:node},location:{hash:''},showView(){},setInterval(){},matchMedia:()=>({matches:false})});
  const world=q('#scanner-world'),all=(root,predicate)=>root.children.flatMap(e=>[...(predicate(e)?[e]:[]),...all(e,predicate)]);assert.equal(all(world,e=>e.attrs.class==='contact-lock').length,0);q('#scan-mode').onchange({target:{value:'map'}});assert.equal(all(world,e=>e.attrs.class==='map-building').length,9);assert(all(world,e=>e.attrs.class==='map-destination').length);
  q('#scan-mode').onchange({target:{value:'vehicle'}});assert.equal(all(world,e=>e.attrs.class==='contact-lock').length,0);
  q('#perception-preview').onchange({target:{checked:true}});assert.equal(all(world,e=>e.attrs.class==='contact-lock').length,1);
  q('#scan-mode').onchange({target:{value:'proximity'}});assert.equal(all(world,e=>e.attrs.class==='contact-lock').length,4);
  q('#scan-mode').onchange({target:{value:'road'}});assert(all(world,e=>e.attrs.class==='road-edge').length);assert.equal(all(world,e=>e.attrs.class==='contact-lock').length,0);
  q('#scan-vehicles').onchange({target:{checked:true}});assert.equal(all(world,e=>e.attrs.class==='contact-lock').length,1);
  q('#perception-preview').onchange({target:{checked:false}});assert.equal(all(world,e=>e.attrs.class==='contact-lock').length,0);
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
  assert.equal(q('#scanner-world').children.filter(e=>e.attrs.class==='confidence-zone').length,0);
  assert.notEqual(context.SurfacePerception.confidenceColor(.2),context.SurfacePerception.confidenceColor(.9));
});

test('centered coverage bands, directional symbols, and selectable confidence use supplied measurements',()=>{
 const nodes=new Map();function node(tag){return {tag,children:[],style:{setProperty(){}},classList:{contains:()=>true},checked:false,attrs:{},append(e){this.children.push(e)},after(){},remove(){},setAttribute(k,v){this.attrs[k]=v},replaceChildren(){this.children=[]}};}
 const q=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
 const c={document:{querySelector:q,createElement:node,createElementNS:(ns,tag)=>node(tag)},location:{hash:''},showView(){},setInterval(){},matchMedia:()=>({matches:false})};vm.runInNewContext(fs.readFileSync('scanner-modes.js','utf8'),c);
 const input=['CAR','CAR','HUMAN','ANIMAL','MISC'].map((type,i)=>({id:String(i),type,distanceMeters:20+i*10,bearingDegrees:i*30,confidence:.9,...(i===0?{headingDegrees:90}:{})})),all=(root,predicate)=>root.children.flatMap(e=>[...(predicate(e)?[e]:[]),...all(e,predicate)]);
 c.SurfacePerception.ingestContacts(input,[{radiusMeters:50,confidence:.8}]);const marks=all(q('#scanner-world'),e=>e.attrs.class==='contact-lock');assert.deepEqual(marks.map(e=>e.tag),['path','rect','path','rect','circle']);assert.match(marks[0].attrs.transform,/rotate\(90/);assert.equal(marks[4].attrs['stroke-dasharray'],'1 3');marks[2].onclick();assert.match(q('#contact-detail').textContent,/90%/);
 const bands=all(q('#scanner-world'),e=>e.attrs.class==='confidence-zone');assert.equal(bands.length,1);assert.equal(bands[0].attrs.cx,180);assert.equal(bands[0].attrs.cy,112);
 c.SurfacePerception.test([]);assert.equal(c.SurfacePerception.state().contactCount,5);c.SurfacePerception.test(null);assert.equal(all(q('#scanner-world'),e=>e.attrs.class==='contact-lock').length,5);
});
