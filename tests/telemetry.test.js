'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{TelemetrySession}=require('../telemetry.js');
test('telemetry session records supplied measurements and never generates missing fields',()=>{const session=new TelemetrySession(),row=session.record({speed:60},1);assert.equal(row.speed,60);assert.equal(row.rpm,undefined);assert.equal(session.snapshot().average,60);assert.equal(session.snapshot().distance,1/60);session.record({rpm:1800},1);assert.equal(session.snapshot().peak,1800);assert.equal(session.snapshot().average,60);});

require("node:test").test("live buffer accepts every sample without a timed window",()=>{const t=new TelemetrySession();for(let i=0;i<650;i++)t.record({speed:i},.01);assert.equal(t.snapshot().count,650);assert.equal(t.snapshot().history.length,600);assert.equal(t.snapshot().history.at(-1).speed,649);});
