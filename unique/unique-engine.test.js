/* Run with: node unique/unique-engine.test.js (Node.js 18+) */
'use strict';
const assert = require('node:assert/strict');
require('./unique-engine.js');
const engine = globalThis.LotoUniqueEngine;
function seeded(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function check(count, seed) {
  const result = engine.generateDeck(count, {rng:seeded(seed)});
  assert.equal(result.cards.length, count);
  assert.equal(result.stats.unique, count);
  assert.equal(new Set(result.cards.map(engine.signature)).size, count);
  assert(result.cards.every(engine.validateCard), '3x9 / 5 cells per row / column ranges / strict order');
  assert(result.stats.maxNumberUses - result.stats.minNumberUses <= 1, 'frequency spread <= 1');
  for (let start = 0; start + 6 <= count; start += 6) {
    const nums = result.cards.slice(start,start+6).flat(2).filter(Boolean);
    assert.equal(nums.length, 90);
    assert.equal(new Set(nums).size, 90, 'each 6-card strip contains all 90 values once');
  }
  return result;
}
for (const n of [1,2,3,4,5,6,7,8,11,12,23,24,25,48,100,600,3000]) check(n,20261022);
for (let seed = 1; seed <= 100; seed++) check(600,seed);
for (const bad of [0,-1,1.5,NaN,Infinity,3001]) {
  assert.throws(()=>engine.generateDeck(bad),/Допустимое количество/);
}
const notValid = [[1,2,3],[4,5,6],[7,8,9]];
assert.equal(engine.validateCard(notValid),false);
const six = check(6,44);
for (const n of six.cards.flat(2)) if (n) assert(n >= 1 && n <= 90);
console.log('PASS: validation, 100 seeds × 600 cards, 3000-card deck, unique signatures, exactly balanced 90 numbers per complete six-card strip, bounded inputs.');
