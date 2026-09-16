'use strict';
// Records supplied measurements only. This module never generates vehicle data.
class TelemetrySession {
  constructor(){this.reset();}
  reset(){this.elapsed=0;this.distance=0;this.speedSum=0;this.speedCount=0;this.count=0;this.peak=null;this.history=[];}
  record(values={},dt=1){
    if(!values||typeof values!=='object')throw Error('Telemetry values must be an object.');
    const safeDt=Math.max(0,Number.isFinite(dt)?dt:0),allowed=['speed','rpm','coolant','voltage','fuel','load','throttle','intake'],row={t:this.elapsed+=safeDt};
    for(const key of allowed)if(Number.isFinite(values[key]))row[key]=values[key];
    if(Number.isFinite(row.speed)){this.distance+=row.speed*safeDt/3600;this.speedSum+=row.speed;this.speedCount++;}
    if(Number.isFinite(row.rpm))this.peak=this.peak===null?row.rpm:Math.max(this.peak,row.rpm);
    this.count++;this.history.push(row);if(this.history.length>600)this.history.shift();return {...row};
  }
  snapshot(){return {elapsed:this.elapsed,distance:this.distance,average:this.speedCount?this.speedSum/this.speedCount:null,peak:this.peak,count:this.count,speedCount:this.speedCount,history:this.history.map(x=>({...x}))};}
}
if(typeof module!=='undefined')module.exports={TelemetrySession};
if(typeof window!=='undefined')window.TelemetrySession=TelemetrySession;
