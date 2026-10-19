// 資料層 — 任務書 §5。IndexedDB（Dexie）是唯一主存儲，禁止 localStorage 存業務資料。
import Dexie from 'dexie';
import { SEED, GEWU_COURSE } from './seed.js';

export const db = new Dexie('studentos');
db.version(1).stores({
  courses: 'id',
  tasks: 'id',
  meta: 'key',
});

// 首次啟動 seed：只在空庫寫入，用戶已編輯過則永不覆蓋（§10.6）；每次啟動都跑 migrate 補版本
export async function ensureSeeded() {
  const seeded = await db.meta.get('seeded');
  if (!seeded) {
    await db.transaction('rw', db.courses, db.tasks, db.meta, async () => {
      if ((await db.courses.count()) === 0) {
        await db.courses.bulkPut(SEED.courses);
        await db.tasks.bulkPut(SEED.tasks);
        await db.meta.put({ key: 'settings', value: SEED.settings });
        await db.meta.put({ key: 'schemaVersion', value: SEED.version });
      }
      // 庫裡已有數據但沒 seeded 標記：不動業務數據，交給 migrate 按 v1 老庫補
      await db.meta.put({ key: 'seeded', value: true });
    });
  }
  await migrate();
}

// v1→v2（2026-10-18）：
//  1) 學期起始日 9/7 → 8/31 —— v1 錯把報到/軍訓當教學週起點，週次全系少一（第 7 週顯示成第 6 週）。
//     只在值仍是錯值 2026-09-07 時改；用戶手動改過其它日期就尊重，不碰。
//  2) 補形式基礎一（格物）3 班（10/10 正選到手，週 8-13）——只補缺失，不覆蓋用戶已有編輯。
async function migrate() {
  const row = await db.meta.get('schemaVersion');
  const v = row ? row.value : 1; // 沒有版本標記 = v1 老庫
  if (v >= SEED.version) return;
  if (v < 2) {
    await db.transaction('rw', db.courses, db.meta, async () => {
      const s = await db.meta.get('settings');
      if (s && s.value && s.value.semesterStart === '2026-09-07') {
        await db.meta.put({ key: 'settings', value: { ...s.value, semesterStart: '2026-08-31' } });
      }
      if (!(await db.courses.get(GEWU_COURSE.id))) {
        await db.courses.put(GEWU_COURSE);
      }
      await db.meta.put({ key: 'schemaVersion', value: 2 });
    });
  }
}

export async function getSettings() {
  const row = await db.meta.get('settings');
  return row ? row.value : SEED.settings;
}

export async function putSettings(value) {
  await db.meta.put({ key: 'settings', value });
}

// ——— Export / Import（第一天就有的保命功能，§5）———

export async function exportData() {
  const [settings, courses, tasks] = await Promise.all([
    getSettings(),
    db.courses.toArray(),
    db.tasks.toArray(),
  ]);
  return { version: 1, settings, courses, tasks, exportedAt: new Date().toISOString() };
}

// 全量覆蓋。呼叫方負責：覆蓋前先自動下載備份 + 明確確認對話框（§5）
export async function importData(data) {
  if (!data || !Array.isArray(data.courses) || !Array.isArray(data.tasks) || !data.settings) {
    throw new Error('匯入格式不符：需要 settings / courses / tasks');
  }
  await db.transaction('rw', db.courses, db.tasks, db.meta, async () => {
    await db.courses.clear();
    await db.tasks.clear();
    await db.courses.bulkPut(data.courses);
    await db.tasks.bulkPut(data.tasks);
    await db.meta.put({ key: 'settings', value: data.settings });
    await db.meta.put({ key: 'schemaVersion', value: 1 }); // 故意標 v1：與 exportData 的 version 欄位對齊；老備份（9/7 起始日/無格物）匯入後下次啟動由 migrate 修正
    await db.meta.put({ key: 'seeded', value: true }); // 匯入即有數據，免得 ensureSeeded 每次啟動多做一次事務
  });
}

export function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  // 延遲 revoke：同步 revoke 在 Safari/iOS 可能截斷下載；這是匯出備份的唯一通道，寧可慢 5 秒
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
