'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const EdgeTabs=require('../gestures.js');

test('tab order advances and wraps',()=>{
  assert.equal(EdgeTabs.adjacent('cockpit','next'),'navigation');
  assert.equal(EdgeTabs.adjacent('spotify','next'),'cargo');
  assert.equal(EdgeTabs.adjacent('systems','next'),'cockpit');
  assert.equal(EdgeTabs.adjacent('cockpit','previous'),'systems');
});

test('only deliberate inward edge swipes are accepted',()=>{
  assert.equal(EdgeTabs.classify(8,90,4,390,300),'previous');
  assert.equal(EdgeTabs.classify(382,300,3,390,300),'next');
  assert.equal(EdgeTabs.classify(80,170,2,390,300),null);
  assert.equal(EdgeTabs.classify(8,80,90,390,300),null);
  assert.equal(EdgeTabs.classify(8,90,4,390,900),null);
});
