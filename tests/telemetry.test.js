'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{TelemetrySession}=require('../telemetry.js');
test('telemetry session records supplied measurements and never generates missing fields',()=>{const session=new TelemetrySession(),row=session.record({speed:60},1);assert.equal(row.speed,60);assert.equal(row.rpm,undefined);assert.equal(session.snapshot().average,60);assert.equal(session.snapshot().distance,1/60);session.record({rpm:1800},1);assert.equal(session.snapshot().peak,1800);assert.equal(session.snapshot().average,60);});
