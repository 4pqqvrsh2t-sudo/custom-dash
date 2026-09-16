const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('simulated gauge readings use a separate chart session and restore real data',()=>{
 const nodes=new Map();function node(){return {textContent:'',style:{},classList:{contains:()=>true},setAttribute(){},querySelector:()=>node()};}const $=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
 const src=fs.readFileSync('app.js','utf8');const context={$,$$:()=>[],TelemetrySession:require('../telemetry').TelemetrySession,SpeedGauge:{render:v=>context.lastGauge=v},window:{dispatchEvent(){},SurfaceAlerts:{update(){}}},CustomEvent:class{},formatTime:String};
 vm.runInNewContext(src.slice(src.indexOf('const telemetry=new TelemetrySession'),src.indexOf('let gpsWatch=null')),context);
 context.window.SurfaceTelemetry.ingest({speed:25,rpm:1000},'OBD');context.window.SurfaceDisplayTest.frame({speed:150,rpm:7500});assert.equal(context.lastGauge,150);assert.equal(context.window.SurfaceTelemetry.current().speed,25);assert.match($('#sample-count').textContent,/TEST/);
 context.window.SurfaceDisplayTest.stop();assert.equal(context.lastGauge,25);assert.equal($('#sample-count').textContent,'1 REAL SAMPLES');
});
