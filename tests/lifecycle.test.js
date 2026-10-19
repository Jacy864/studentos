import { test } from 'node:test';
import assert from 'node:assert/strict';
import { courseWeekSpan, isCourseEnded, orderActiveCourses } from '../src/lib/schedule.js';
import { dateOf } from '../src/lib/week.js';

// 種子課程的週次形狀（seed.js 實據）
const c1 = { id: 'c1', schedules: [{ weeks: [{ start: 3, end: 7 }] }] }; // 身體（已結課）
const c2 = { id: 'c2', schedules: [{ weeks: [{ start: 3, end: 17 }] }] }; // 英語（進行中）
const c4 = { id: 'c4', schedules: [{ weeks: [{ start: 10, end: 17 }] }] }; // 19世纪末（未開課）
const c6 = { id: 'c6', schedules: [{ weeks: [{ start: 8, end: 13 }] }] }; // 格物（進行中，最新）
const SEED_ORDER = [c1, c2, c4, c6];

test('courseWeekSpan：跨 schedules 取總跨度', () => {
  assert.deepEqual(courseWeekSpan(c1), { start: 3, end: 7 });
  assert.deepEqual(courseWeekSpan({ id: 'x', schedules: [{ weeks: [{ start: 3, end: 7 }, { start: 10, end: 12 }] }] }), { start: 3, end: 12 });
  assert.deepEqual(courseWeekSpan({ id: 'x', schedules: [] }), { start: null, end: null });
});

test('isCourseEnded：最後一週 < 當前週', () => {
  assert.equal(isCourseEnded(c1, 8), true, '身體 3-7 於第 8 週已結課');
  assert.equal(isCourseEnded(c1, 7), false, '第 7 週還在上');
  assert.equal(isCourseEnded(c6, 8), false);
  assert.equal(isCourseEnded({ schedules: [] }, 8), false, '無排課不算結課');
});

test('orderActiveCourses 第 8 週：結課剔除、格物最前、未開課墊後', () => {
  assert.deepEqual(orderActiveCourses(SEED_ORDER, 8).map((c) => c.id), ['c6', 'c2', 'c4']);
});

test('orderActiveCourses 第 3 週：全部在課，按開課序', () => {
  assert.deepEqual(orderActiveCourses(SEED_ORDER, 3).map((c) => c.id), ['c1', 'c2', 'c6', 'c4']);
});

test('orderActiveCourses 第 14 週：格物也結課了，19世纪末接棒最前', () => {
  assert.deepEqual(orderActiveCourses(SEED_ORDER, 14).map((c) => c.id), ['c4', 'c2']);
});

test('dateOf：週次×星期 → 日期（起始日 2026-08-31）', () => {
  assert.equal(dateOf('2026-08-31', 1, 1), '2026-08-31');
  assert.equal(dateOf('2026-08-31', 8, 1), '2026-10-19'); // 今天：第 8 週週一
  assert.equal(dateOf('2026-08-31', 8, 3), '2026-10-21');
  assert.equal(dateOf('2026-08-31', 17, 7), '2026-12-27'); // 學期末週日
});
