const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
test('scanner modes keep simulated detections opt-in and separate layers',()=>{
  const nodes=new Map();
  function node(){return {dataset:{},children:[],style:{},classList:{contains:()=>true},checked:true,attrs:{},append(e){this.children.push(e)},after(){},insertBefore(){},setAttribute(k,v){this.attrs[k]=v},replaceChildren(){this.children=[]}};}
  const q=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
  vm.runInNewContext(fs.readFileSync('scanner-modes.js','utf8'),{document:{querySelector:q,createElement:node,createElementNS:node},location:{hash:''},showView(){},setInterval(){},matchMedia:()=>({matches:false})});
  const world=q('#scanner-world');assert.equal(world.children.filter(e=>e.attrs.class==='contact-lock').length,0);q('#scan-mode').onchange({target:{value:'map'}});assert.equal(world.children.filter(e=>e.attrs.width).length,8);
  q('#scan-mode').onchange({target:{value:'vehicle'}});assert.equal(world.children.filter(e=>e.attrs.class==='contact-lock').length,0);
  q('#perception-preview').onchange({target:{checked:true}});assert.equal(world.children.filter(e=>e.attrs.class==='contact-lock').length,1);
  q('#scan-mode').onchange({target:{value:'proximity'}});assert.equal(world.children.filter(e=>e.attrs.class==='contact-lock').length,4);
  q('#scan-mode').onchange({target:{value:'road'}});assert.equal(world.children.length,1);
  q('#scan-vehicles').onchange({target:{checked:true}});assert.equal(world.children.length,2);
  q('#perception-preview').onchange({target:{checked:false}});assert.equal(world.children.length,1);
  q('#scanner-in').onclick();assert.equal(q('#scanner-range').textContent,'133 M');
});
