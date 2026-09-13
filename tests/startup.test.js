const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
test('boot sequence reports disconnected hardware, completes, replays and skips',()=>{
  const nodes=new Map(),timers=new Map();let id=0,loaded=null;
  function node(){return {children:[],classList:{add(){},remove(){}},firstChild:{},isConnected:true,append(...e){this.children.push(...e)},after(e){this.afterNode=e},focus(){document.activeElement=this},setAttribute(){},addEventListener(){},replaceChildren(){this.children=[]}}}
  function q(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)}
  const document={querySelector:q,createElement:node,body:node(),addEventListener(){},hidden:false};q('#audio-file').parentElement=node();q('#audio-file').onchange=e=>{loaded=e.target.files[0]};
  vm.runInNewContext(fs.readFileSync('startup.js','utf8'),{document,setTimeout(fn){timers.set(++id,fn);return id},clearTimeout(i){timers.delete(i)}});
  assert.equal(q('.shell').inert,true);
  for(let i=0;i<7;i++){const [key,fn]=timers.entries().next().value;timers.delete(key);fn()}
  assert.equal(q('#boot-modules').children.length,6);assert.equal(q('#boot-modules').children[5].children[1].textContent,'NOT CONNECTED');assert.equal(q('.shell').inert,false);
  q('#systems .systems-layout').afterNode.onclick();assert.equal(q('.shell').inert,true);q('#boot-skip').onclick();assert.equal(q('.shell').inert,false);assert.equal(timers.size,0);
  const files=[{name:'one.mp3'},{name:'two.wav'}];q('#audio-file').onchange({target:{files}});assert.equal(loaded,files[0]);const list=q('#audio-file').parentElement.afterNode;assert.equal(list.children.length,2);list.children[1].onclick();assert.equal(loaded,files[1]);
});
