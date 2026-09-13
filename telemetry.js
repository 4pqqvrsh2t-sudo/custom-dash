'use strict';
// Shared deterministic data source; no vehicle or location connection.
class TelemetrySession {
  constructor(){this.reset();}
  reset(){this.elapsed=0;this.distance=0;this.speedSum=0;this.count=0;this.peak=0;this.history=[];}
  sample(moving,dt=1){
    this.elapsed+=dt;
    const t=this.elapsed;
    const speed=moving?Math.round(42+Math.sin(t/7)*5+Math.sin(t/19)*3):0;
    const rpm=moving?Math.round(720+speed*27+Math.sin(t/4)*75):720;
    const row={t,speed,rpm,coolant:Number((191+Math.sin(t/24)*3).toFixed(1)),voltage:Number((14.2+Math.sin(t/9)*.15).toFixed(2)),fuel:Number(Math.max(0,72-this.distance*.06).toFixed(1)),load:Number((moving?34+Math.sin(t/5)*9:11).toFixed(1)),throttle:Number((moving?18+Math.sin(t/4)*7:4).toFixed(1)),intake:Number((84+Math.sin(t/18)*2).toFixed(1))};
    this.distance+=speed*dt/3600;this.speedSum+=speed;this.count++;this.peak=Math.max(this.peak,rpm);
    this.history.push(row);if(this.history.length>121)this.history.shift();return row;
  }
  snapshot(){return {elapsed:this.elapsed,distance:this.distance,average:this.count?this.speedSum/this.count:0,peak:this.peak,count:this.count,history:this.history.map(x=>({...x}))};}
}
if(typeof module!=='undefined')module.exports={TelemetrySession};
if(typeof window!=='undefined')window.TelemetrySession=TelemetrySession;
