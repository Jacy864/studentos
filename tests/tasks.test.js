import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openTasksOf, takeWeekFirst, isRecentDuplicate } from '../src/lib/tasks.js';

const NOW = Date.UTC(2026, 9, 19, 4, 0, 0); // 固定錨點（UTC）， createdAt 一律相對 NOW 生成
const t = (id, over) => ({
  id,
  title: '交作業',
  courseId: 'c6',
  dueDate: '2026-10-21',
  completed: false,
  createdAt: new Date(NOW - 5000).toISOString(), // NOW - 5s
  ...over,
});

test('openTasksOf：只取該課未完成，按期限升序、無期限墊後', () => {
  const tasks = [
    t('a', { dueDate: '2026-10-25' }),
    t('b', { dueDate: null }),
    t('c', { dueDate: '2026-10-20' }),
    t('d', { courseId: 'c2' }),            // 別的課
    t('e', { completed: true }),           // 已完成
  ];
  assert.deepEqual(openTasksOf(tasks, 'c6').map((x) => x.id), ['c', 'a', 'b']);
});

test('takeWeekFirst：本週只掛第一次，之後回空並登記', () => {
  const seen = new Set();
  assert.equal(takeWeekFirst([], 'c6', seen).length, 0); // 無任務也登記佔位
  assert.deepEqual(takeWeekFirst([t('a')], 'c6', seen).map((x) => x.id), []); // 已掛過 → 空
  assert.deepEqual(takeWeekFirst([t('x', { courseId: 'c2' })], 'c2', seen).map((x) => x.id), ['x']); // 新課正常掛
});

test('isRecentDuplicate：同標題+課程+期限且 10 秒內 → true', () => {
  const existing = [t('a')];
  assert.equal(isRecentDuplicate(existing, { title: '交作業', courseId: 'c6', dueDate: '2026-10-21' }, NOW), true);
  // 超過窗口 → false
  assert.equal(
    isRecentDuplicate(existing, { title: '交作業', courseId: 'c6', dueDate: '2026-10-21' }, NOW + 10_001),
    false,
  );
});

test('isRecentDuplicate：標題/課程/期限任一不同 → false', () => {
  const existing = [t('a')];
  assert.equal(isRecentDuplicate(existing, { title: '另一件事', courseId: 'c6', dueDate: '2026-10-21' }, NOW), false);
  assert.equal(isRecentDuplicate(existing, { title: '交作業', courseId: 'c2', dueDate: '2026-10-21' }, NOW), false);
  assert.equal(isRecentDuplicate(existing, { title: '交作業', courseId: 'c6', dueDate: '2026-10-22' }, NOW), false);
  assert.equal(isRecentDuplicate(existing, { title: '交作業', courseId: null, dueDate: '2026-10-21' }, NOW), false);
});

test('isRecentDuplicate：已完成的同名任務不算重複', () => {
  const existing = [t('a', { completed: true })];
  assert.equal(isRecentDuplicate(existing, { title: '交作業', courseId: 'c6', dueDate: '2026-10-21' }, NOW), false);
});
