/* Standalone balanced generator for 90-ball Russian loto. No account, tracking or storage. */
(function (root) {
  'use strict';
  const BUCKETS = [[1,9],[10,19],[20,29],[30,39],[40,49],[50,59],[60,69],[70,79],[80,90]];
  const MAX_CARDS = 3000;
  function randomIndex(max, rng) {
    if (!Number.isInteger(max) || max < 1) throw new Error('Некорректная граница случайного числа');
    if (typeof rng === 'function') {
      const value = rng();
      if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Некорректный генератор случайных чисел');
      return Math.floor(value * max);
    }
    const cryptoApi = root.crypto;
    if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
      const array = new Uint32Array(1);
      const scale = 0x100000000;
      const limit = Math.floor(scale / max) * max;
      do { cryptoApi.getRandomValues(array); } while (array[0] >= limit);
      return array[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
  function shuffle(items, rng) {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1, rng);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function occupancy(extras, rng) {
    const order = shuffle(Array.from({length: 9}, (_, c) => c), rng)
      .sort((a, b) => Number(extras[b]) - Number(extras[a]));
    const counts = [0, 0, 0];
    const rowsByCol = Array.from({length: 9}, () => []);
    const visited = new Set();
    function dfs(position) {
      if (position === 9) return counts.every(n => n === 5);
      const key = position + ':' + counts.join(',');
      if (visited.has(key)) return false;
      const col = order[position];
      const choices = extras[col] ? [[0,1],[0,2],[1,2]] : [[0],[1],[2]];
      for (const selected of shuffle(choices, rng)) {
        if (selected.some(row => counts[row] >= 5)) continue;
        selected.forEach(row => { counts[row]++; });
        rowsByCol[col] = selected;
        if (dfs(position + 1)) return true;
        selected.forEach(row => { counts[row]--; });
      }
      visited.add(key);
      return false;
    }
    if (!dfs(0)) throw new Error('Не удалось распределить числа по строкам');
    return rowsByCol;
  }
  function makeStrip(rng) {
    // Every six cards together use all 90 numbers exactly once.
    const extras = Array.from({length: 6}, () => Array(9).fill(false));
    for (let col = 0; col < 9; col++) {
      const additional = BUCKETS[col][1] - BUCKETS[col][0] + 1 - 6;
      for (const row of shuffle([0,1,2,3,4,5], rng).slice(0, additional)) extras[row][col] = true;
    }
    const amounts = extras.map(row => row.filter(Boolean).length);
    let moves = 0;
    while (amounts.some(n => n !== 6)) {
      const hi = amounts.findIndex(n => n > 6);
      const lo = amounts.findIndex(n => n < 6);
      if (hi < 0 || lo < 0) throw new Error('Не удалось сбалансировать набор из шести карточек');
      const choices = Array.from({length: 9}, (_, c) => c).filter(c => extras[hi][c] && !extras[lo][c]);
      if (choices.length === 0 || moves++ >= 100) throw new Error('Не удалось сбалансировать столбцы');
      const col = choices[randomIndex(choices.length, rng)];
      extras[hi][col] = false;
      extras[lo][col] = true;
      amounts[hi]--;
      amounts[lo]++;
    }
    const cards = Array.from({length: 6}, () => Array.from({length: 3}, () => Array(9).fill(0)));
    const positions = extras.map(row => occupancy(row, rng));
    for (let col = 0; col < 9; col++) {
      const [first, last] = BUCKETS[col];
      const pool = shuffle(Array.from({length:last-first+1}, (_, i) => first+i), rng);
      let offset = 0;
      for (let card = 0; card < 6; card++) {
        const rows = positions[card][col].slice().sort((a, b) => a-b);
        const nums = pool.slice(offset, offset + rows.length).sort((a,b) => a-b);
        if (nums.length !== rows.length) throw new Error('Недостаточно чисел для карточки');
        rows.forEach((row, i) => { cards[card][row][col] = nums[i]; });
        offset += rows.length;
      }
      if (offset !== pool.length) throw new Error('Неверное распределение чисел по столбцу');
    }
    return cards;
  }
  function signature(card) { return card.flat().join(','); }
  function validateCard(card) {
    if (!Array.isArray(card) || card.length !== 3 || card.some(r => !Array.isArray(r) || r.length !== 9)) return false;
    if (card.some(r => r.filter(Boolean).length !== 5)) return false;
    const nums = card.flat().filter(Boolean);
    if (nums.length !== 15 || new Set(nums).size !== 15) return false;
    for (let col = 0; col < 9; col++) {
      const [first, last] = BUCKETS[col];
      const values = card.map(row => row[col]).filter(Boolean);
      if (values.length < 1 || values.length > 2) return false;
      if (values.some(n => !Number.isInteger(n) || n < first || n > last)) return false;
      if (values.some((v, i) => i > 0 && v <= values[i-1])) return false;
    }
    return true;
  }
  function generateDeck(totalCards, options) {
    if (!Number.isInteger(totalCards) || totalCards < 1 || totalCards > MAX_CARDS) {
      throw new Error('Допустимое количество карточек: от 1 до ' + MAX_CARDS);
    }
    const rng = options && options.rng;
    const used = new Set();
    const cards = [];
    while (cards.length < totalCards) {
      const remaining = Math.min(6, totalCards - cards.length);
      let strip = null;
      for (let attempt = 0; attempt < 64; attempt++) {
        const proposed = makeStrip(rng).slice(0, remaining);
        if (proposed.every(validateCard) && proposed.every(card => !used.has(signature(card)))) {
          strip = proposed;
          break;
        }
      }
      if (!strip) throw new Error('Не удалось создать набор без повторяющихся карточек. Измените объём генерации.');
      for (const card of strip) {
        used.add(signature(card));
        cards.push(card);
      }
    }
    const frequencies = Array(91).fill(0);
    for (const card of cards) for (const n of card.flat()) if (n) frequencies[n]++;
    const usedCounts = frequencies.slice(1);
    const min = Math.min(...usedCounts), max = Math.max(...usedCounts);
    if (used.size !== totalCards || max-min > 1) throw new Error('Нарушен контроль уникальности или баланса');
    return { cards, stats: { count: totalCards, unique: used.size, minNumberUses: min, maxNumberUses: max,
      completeSixCardStrips: Math.floor(totalCards / 6), frequencies } };
  }
  root.LotoUniqueEngine = Object.freeze({ BUCKETS, MAX_CARDS, makeStrip, generateDeck, validateCard, signature });
})(typeof window !== 'undefined' ? window : globalThis);
