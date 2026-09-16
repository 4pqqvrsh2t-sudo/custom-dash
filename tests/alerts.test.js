const {test}=require('node:test');const assert=require('node:assert/strict');const {SensorAlertMonitor}=require('../alerts.js');
test('disconnect alerts only fire on a lost connected input and rearm after recovery',()=>{
 const events=[],monitor=new SensorAlertMonitor(e=>events.push(e));monitor.update('a',false);assert.equal(events.length,0);
 monitor.update('a',true);monitor.update('a',false,'warning','Camera');monitor.update('a',false);assert.equal(events.length,1);assert.equal(events[0].label,'Camera');
 monitor.configureSeverity('a','critical');monitor.update('a',true);monitor.update('a',false);assert.equal(events.length,2);assert.equal(events[1].severity,'critical');
 assert.throws(()=>monitor.configureSeverity('b','bogus'));
});
