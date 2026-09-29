import { test } from 'node:test';
import assert from 'node:assert/strict';
import { petScheduleState } from '../src/pet/petState.js';

const settings = {
  semesterStart: '2026-09-07',
  periodTimes: [
    { period: 1, start: '08:30', end: '09:15' },
    { period: 5, start: '13:00', end: '13:45' },
  ],
};
const courses = [
  {
    id: 'c1', name: '造型基礎（身體）',
    schedules: [{ weekday: 2, startPeriod: 1, endPeriod: 4, weeks: [{ start: 3, end: 7 }], classroom: '良渚18號樓118' }],
  },
];
// 2026-09-29 = 第 4 週週二
const ctx = (minutes, weekday = 2, dateStr = '2026-09-29') => ({ courses, settings, dateStr, weekday, minutes });

test('深夜 → 睡覺', () => {
  assert.equal(petScheduleState(ctx(23 * 60 + 10)).state, 'sleep');
  assert.equal(petScheduleState(ctx(3 * 60)).state, 'sleep');
});

test('無課日 → 掃地（週六）', () => {
  assert.equal(petScheduleState(ctx(10 * 60, 6)).state, 'sweep');
});

test('下節課前 10 分鐘內 → 舉牌（課名+地點）', () => {
  const r = petScheduleState(ctx(8 * 60 + 25)); // 08:25，距 08:30 上課 5 分鐘
  assert.equal(r.state, 'sign');
  assert.equal(r.sign.line1, '造型基礎（身體）');
  assert.equal(r.sign.line2, '良渚18號樓118');
});

test('上課中/間隔 → idle；超過 10 分鐘預告期 → idle', () => {
  assert.equal(petScheduleState(ctx(9 * 60)).state, 'idle'); // 已上課
  assert.equal(petScheduleState(ctx(7 * 60)).state, 'idle'); // 07:00 距離太遠
});
