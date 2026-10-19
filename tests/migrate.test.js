import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, ensureSeeded } from '../src/lib/db.js';

// v1→v2 遷移：模擬 2026-10-18 之前部署的實例（學期起始日 9/7、5 門課、schemaVersion 1）
async function buildV1Db(semesterStart = '2026-09-07') {
  await db.courses.clear();
  await db.tasks.clear();
  await db.meta.clear();
  await db.courses.bulkPut([
    { id: 'c1', name: '造型基礎（身體）', schedules: [{ weekday: 1, startPeriod: 1, endPeriod: 4, weeks: [{ start: 3, end: 7 }] }] },
    { id: 'c2', name: '大学英语1' },
    { id: 'c3', name: '大学生心理健康' },
    { id: 'c4', name: '19世纪末20世纪初的世界文化格局' },
    { id: 'c5', name: '体育1' },
  ]);
  await db.meta.put({ key: 'settings', value: { semesterStart, periodTimes: [] } });
  await db.meta.put({ key: 'schemaVersion', value: 1 });
  await db.meta.put({ key: 'seeded', value: true });
}

test('v1 老庫遷移：起始日修正 + 補格物課', async () => {
  await buildV1Db();
  await ensureSeeded();

  const settings = (await db.meta.get('settings')).value;
  assert.equal(settings.semesterStart, '2026-08-31', '起始日應從 9/7 修成 8/31');

  const names = (await db.courses.toArray()).map((c) => c.name);
  assert.equal(names.length, 6, '應補成 6 門課');
  assert.ok(names.includes('形式基础一（格物）3班'), '格物課應被補入');

  const gewu = await db.courses.get('c6');
  assert.equal(gewu.teacher, '郑筱莹');
  assert.deepEqual(gewu.schedules.map((s) => s.weeks), [
    [{ start: 8, end: 13 }], [{ start: 8, end: 13 }], [{ start: 8, end: 13 }], [{ start: 8, end: 13 }],
  ]);
  assert.equal((await db.meta.get('schemaVersion')).value, 2);
});

test('遷移冪等：再跑一次不重複補課', async () => {
  await ensureSeeded();
  assert.equal((await db.courses.toArray()).length, 6, '仍是 6 門，不重複');
  assert.equal((await db.meta.get('schemaVersion')).value, 2);
});

test('用戶手改過起始日：遷移不覆蓋', async () => {
  await buildV1Db('2026-09-01'); // 用戶自設的其它日期
  await ensureSeeded();
  const settings = (await db.meta.get('settings')).value;
  assert.equal(settings.semesterStart, '2026-09-01', '尊重用戶手動設定');
  assert.ok(await db.courses.get('c6'), '課程補充不受影響');
});

test('用戶已自建格物課：遷移不覆蓋', async () => {
  await buildV1Db();
  await db.courses.put({ id: 'c6', name: '我自己建的格物', schedules: [] });
  await ensureSeeded();
  assert.equal((await db.courses.get('c6')).name, '我自己建的格物', '不覆蓋用戶數據');
});
