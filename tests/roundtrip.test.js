import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, ensureSeeded, exportData, importData } from '../src/lib/db.js';

// 任務書 M1 驗收：匯出 → 清庫 → 匯入 roundtrip 資料一致
test('seed → 匯出 → 清庫 → 匯入 → 再匯出，資料一致', async () => {
  await ensureSeeded();
  const first = await exportData();
  assert.equal(first.courses.length, 5, 'seed 應有 5 門課');
  assert.equal(first.tasks.length, 0);

  await db.courses.clear();
  await db.tasks.clear();
  await db.meta.clear();
  const cleared = await exportData();
  assert.equal(cleared.courses.length, 0, '清庫後應為空');

  await importData(first);
  const second = await exportData();
  assert.deepEqual(second.settings, first.settings);
  assert.deepEqual(second.courses, first.courses);
  assert.deepEqual(second.tasks, first.tasks);
  assert.ok(second.exportedAt, '匯出含 exportedAt');
});

test('importData 拒絕壞格式', async () => {
  await assert.rejects(() => importData({ courses: [] }), /格式不符/);
  await assert.rejects(() => importData(null), /格式不符/);
});

test('ensureSeeded 不覆蓋已有資料', async () => {
  await ensureSeeded();
  await ensureSeeded(); // 二次呼叫不應報錯也不應重複
  const first = await exportData();
  await db.meta.delete('seeded'); // 模擬標記丟失但資料還在
  await ensureSeeded();
  const second = await exportData();
  assert.deepEqual(second.courses, first.courses, '有資料時 seed 不得覆蓋');
});
