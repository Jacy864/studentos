import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekOf, activeInWeek, activeOn } from '../src/lib/week.js';

// 任務書 §3.4 週次自測 fixture（驗收用）
// 學期起始日 2026-08-31（v2 修正值）：實證 = 9/15 已在授身體課第一週（= 第 3 週）
const S = '2026-08-31';
const fixtures = [
  ['2026-08-30', 0],
  ['2026-08-31', 1],
  ['2026-09-15', 3], // 身體課開課第一週（筆記實證）
  ['2026-10-18', 7], // 身體課結課日（第 7 週週日）
  ['2026-10-19', 8], // 格物開課（第 8 週週一）
  ['2026-11-11', 11],
  ['2026-11-29', 13], // 格物結課（第 13 週週日）
  ['2026-12-27', 17],
  ['2026-12-28', 18],
];

test('§3.4 週次 fixture 全過', () => {
  for (const [d, w] of fixtures) {
    assert.equal(weekOf(d, S), w, `${d} 應為第 ${w} 週`);
  }
});

test('週次區間生效判定', () => {
  const w35 = [{ start: 3, end: 7 }];
  assert.equal(activeInWeek(w35, 3), true);
  assert.equal(activeInWeek(w35, 7), true);
  assert.equal(activeInWeek(w35, 8), false, '第 8 週造型基礎應消失');
  const w1017 = [{ start: 10, end: 17 }];
  assert.equal(activeInWeek(w1017, 9), false);
  assert.equal(activeInWeek(w1017, 10), true, '第 10 週 19世纪末應出現');
  assert.equal(activeInWeek([{ start: 3, end: 7 }, { start: 10, end: 17 }], 12), true, '多區間任一命中');
});

test('星期×週次聯合判定', () => {
  assert.equal(activeOn([{ start: 3, end: 7 }], 1, 4, 1), true);
  assert.equal(activeOn([{ start: 3, end: 7 }], 2, 4, 1), false, '星期不符');
  assert.equal(activeOn([{ start: 3, end: 7 }], 1, 8, 1), false, '週次不符');
});
