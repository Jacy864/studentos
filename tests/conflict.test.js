import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conflictsFor, periodsOverlap, weeksOverlap } from '../src/lib/schedule.js';

test('節次/週次重疊基礎判定', () => {
  assert.equal(periodsOverlap({ startPeriod: 1, endPeriod: 4 }, { startPeriod: 5, endPeriod: 6 }), false);
  assert.equal(periodsOverlap({ startPeriod: 1, endPeriod: 4 }, { startPeriod: 4, endPeriod: 6 }), true, '端點相接算重疊');
  assert.equal(weeksOverlap([{ start: 3, end: 7 }], [{ start: 8, end: 17 }]), false);
  assert.equal(weeksOverlap([{ start: 3, end: 7 }], [{ start: 7, end: 9 }]), true);
});

test('任務書 M3 驗收：手動加週一 1-4 節 3-17 週的課 → 與造型基礎衝突', () => {
  const courses = [
    {
      id: 'c1', name: '造型基礎（身體）',
      schedules: [{ weekday: 1, startPeriod: 1, endPeriod: 4, weeks: [{ start: 3, end: 7 }] }],
    },
    {
      id: 'c2', name: '大学英语1',
      schedules: [{ weekday: 1, startPeriod: 5, endPeriod: 6, weeks: [{ start: 3, end: 17 }] }],
    },
  ];
  const newCourse = {
    id: 'new',
    name: '測試課',
    schedules: [{ weekday: 1, startPeriod: 1, endPeriod: 4, weeks: [{ start: 3, end: 17 }] }],
  };
  const hits = conflictsFor(newCourse, courses);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].course.id, 'c1', '應命中造型基礎，不誤報英語課');

  // 編輯自己時排除自身
  const self = conflictsFor({ ...newCourse, id: 'c1' }, courses, 'c1');
  // c1 與 c2 不衝突 → 0
  assert.equal(self.length, 0);

  // 週次錯開則不衝突
  const ok = conflictsFor({
    id: 'x', name: '第10週才開始', schedules: [{ weekday: 1, startPeriod: 1, endPeriod: 4, weeks: [{ start: 10, end: 17 }] }],
  }, courses);
  assert.equal(ok.length, 0);
});
