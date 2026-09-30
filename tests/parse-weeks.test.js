// parseWeeks 倒置/邊界單測（Bug 2 修復驗收）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWeeks } from '../src/lib/schedule.js';

test('正常解析：單段 / 單週 / 多段 / 全形頓號 / 各種連字符', () => {
  assert.deepEqual(parseWeeks('3-7'), [{ start: 3, end: 7 }]);
  assert.deepEqual(parseWeeks('3'), [{ start: 3, end: 3 }]);
  assert.deepEqual(parseWeeks('3-7, 10-17'), [{ start: 3, end: 7 }, { start: 10, end: 17 }]);
  assert.deepEqual(parseWeeks('3-7、10-17'), [{ start: 3, end: 7 }, { start: 10, end: 17 }]);
  assert.deepEqual(parseWeeks('3–7'), [{ start: 3, end: 7 }], 'en-dash');
  assert.deepEqual(parseWeeks('3—7'), [{ start: 3, end: 7 }], 'em-dash');
  assert.deepEqual(parseWeeks('3~7'), [{ start: 3, end: 7 }], '波浪號');
  assert.deepEqual(parseWeeks(' 3 - 7 '), [{ start: 3, end: 7 }], '容忍空白');
  assert.deepEqual(parseWeeks('1-17'), [{ start: 1, end: 17 }], '全學期');
});

test('倒置自動交換："17-3" → {3,17}，不再永不顯示', () => {
  assert.deepEqual(parseWeeks('17-3'), [{ start: 3, end: 17 }]);
  assert.deepEqual(parseWeeks('10-1'), [{ start: 1, end: 10 }]);
});

test('越界丟棄：0 / 18 / 99 / 3-99', () => {
  assert.deepEqual(parseWeeks('0'), []);
  assert.deepEqual(parseWeeks('18'), []);
  assert.deepEqual(parseWeeks('99'), []);
  assert.deepEqual(parseWeeks('3-99'), []);
  assert.deepEqual(parseWeeks('0-5'), []);
});

test('垃圾輸入丟棄：非整數 / 非數字 / 空字串', () => {
  assert.deepEqual(parseWeeks('3.5'), []);
  assert.deepEqual(parseWeeks('abc'), []);
  assert.deepEqual(parseWeeks(''), []);
  assert.deepEqual(parseWeeks(', ,'), []);
  assert.deepEqual(parseWeeks('3-'), [], '懸空連字符：Number("3-")=NaN → 丟棄');
});

test('混合輸入：壞段丟棄、好段保留', () => {
  assert.deepEqual(parseWeeks('3-7, x, 99'), [{ start: 3, end: 7 }]);
  assert.deepEqual(parseWeeks('abc, 10'), [{ start: 10, end: 10 }]);
});
