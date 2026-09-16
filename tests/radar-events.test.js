const {test}=require('node:test'),assert=require('node:assert/strict');const {RadarEvents}=require('../radar-events');
test('busy targets are grouped, departures debounce, and an unstable identity mutes on fifth appearance',()=>{
 let sounds=[];const r=new RadarEvents(k=>sounds.push(k));r.update([{id:'a'},{id:'b'}],0);assert.deepEqual(sounds,['arrival']);
 r.update([],500);assert.equal(r.tracks.get('a').present,true);r.update([],3000);assert.deepEqual(sounds,['arrival','departure']);
 for(let i=1;i<=4;i++){r.update([{id:'a'}],i*6000);r.update([],i*6000+3000);}
 assert.equal(r.tracks.get('a').muted,true);const count=sounds.length;r.update([{id:'a'}],33000);r.update([],36000);assert.equal(sounds.length,count);
 r.update([{id:'new'}],39000);assert.equal(sounds.at(-1),'arrival');assert.equal(sounds.length,count+1);
});
test('untracked objects do not get guessed identities and feed reset does not emit departures',()=>{const sounds=[],r=new RadarEvents(k=>sounds.push(k));r.update([{id:null}],0);assert.equal(sounds.length,0);r.update([{id:'car'}],3000);r.reset();assert.equal(sounds.length,1);assert.equal(r.tracks.size,0);});
