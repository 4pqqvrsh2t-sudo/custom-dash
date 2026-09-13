'use strict';
const assert=require('node:assert/strict'),g=require('../instruments'),p=require('../port-protocol');
assert.equal(g.model(60).secondary,26.8224);assert.equal(g.model(60,'km/s').secondary,.0268224);
assert.equal(g.model(60).fraction,.5);assert.equal(g.model(0).fraction,0);assert.equal(g.model(120).fraction,1);
assert.equal(g.arc(145,0),'');assert.equal(g.model(200).fraction,1);assert.equal(g.model(NaN).speed,0);
assert.equal(p.parse('{"type":"pins","board":"esp32-classic","pins":[{"gpio":21,"connected":true,"label":"SDA"}]}').pins[0].gpio,21);
for(const pins of [[{gpio:20,connected:true,label:'bad'}],[{gpio:21,connected:'yes',label:'bad'}],[{gpio:21,connected:true,label:'a'},{gpio:21,connected:true,label:'b'}]])assert.throws(()=>p.parse(JSON.stringify({type:'pins',board:'esp32-classic',pins})));
console.log('PASS: speed units, arc limits, valid pins, nonexistent pins, invalid states and duplicate pin rejection');
