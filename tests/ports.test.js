'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const protocol=require('../port-protocol.js');
function node(){return {textContent:'',disabled:false,value:'115200',children:[],append(...items){this.children.push(...items)},replaceChildren(){this.children=[]}};}
async function run(){
  const nodes=new Map(),$=key=>{if(!nodes.has(key))nodes.set(key,node());return nodes.get(key)};
  let now=10000,refresh,deliver,closed=0,released=0;
  const reader={read:()=>new Promise(resolve=>deliver=resolve),cancel:async()=>deliver({done:true}),releaseLock:()=>released++};
  const port={readable:{getReader:()=>reader},open:async settings=>assert.equal(settings.baudRate,115200),close:async()=>closed++,getInfo:()=>({usbVendorId:0x303a,usbProductId:0x1001})};
  const context={$ ,SurfaceProtocol:protocol,navigator:{serial:{requestPort:async()=>port}},window:{isSecureContext:true},document:{createElement:node},TextDecoder,Date:{now:()=>now},setInterval:fn=>refresh=fn};
  vm.runInNewContext(fs.readFileSync(require.resolve('../ports.js'),'utf8'),context);
  assert.equal($('#port-state').textContent,'NOT OPEN');
  await $('#connect-port').onclick();assert.equal($('#port-state').textContent,'OPEN / WAITING');
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  const send=async s=>{deliver({value:new TextEncoder().encode(s),done:false});await flush();refresh();};
  await send('{"type":"hello","protocol":"surface-port/1","device":"ESP32","firmware":"test"}\n');
  assert.equal($('#port-state').textContent,'DEVICE ONLINE');assert.equal($('#port-usb').textContent,'303A / 1001');
  await send('{"type":"sensors","values":[{"id":"temp","value":23,"unit":"C"}]}\n');
  assert.equal($('#sensor-count').textContent,1);assert.equal($('#port-packets').textContent,2);
  await send('x'.repeat(5000)+'\nnope\n');assert.equal($('#port-errors').textContent,2);
  now+=6000;refresh();assert.equal($('#port-state').textContent,'STALE / NO DATA');
  assert.equal($('#sensor-readings').children[0].children[2].textContent,'STALE');
  await $('#disconnect-port').onclick();assert.equal($('#port-state').textContent,'NOT OPEN');assert.equal(closed,1);assert.equal(released,1);
  $('#packet-test').value='{"type":"power","usb_present":true}';$('#validate-packet').onclick();assert($('#packet-result').textContent.startsWith('VALID'));assert.equal($('#port-state').textContent,'NOT OPEN');
  console.log('PASS: serial open/read/identity, sensor rendering, oversized line recovery, stale timers, disconnect cleanup, isolated validation');
}
run().catch(e=>{console.error(e);process.exitCode=1});
