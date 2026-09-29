// 資料層 — 任務書 §5。IndexedDB（Dexie）是唯一主存儲，禁止 localStorage 存業務資料。
import Dexie from 'dexie';
import { SEED } from './seed.js';

export const db = new Dexie('studentos');
db.version(1).stores({
  courses: 'id',
  tasks: 'id',
  meta: 'key',
});

// 首次啟動 seed：只在空庫寫入，用戶已編輯過則永不覆蓋（§10.6）
export async function ensureSeeded() {
  const seeded = await db.meta.get('seeded');
  if (seeded) return;
  await db.transaction('rw', db.courses, db.tasks, db.meta, async () => {
    if ((await db.courses.count()) > 0) return;
    await db.courses.bulkPut(SEED.courses);
    await db.tasks.bulkPut(SEED.tasks);
    await db.meta.put({ key: 'settings', value: SEED.settings });
    await db.meta.put({ key: 'schemaVersion', value: 1 });
    await db.meta.put({ key: 'seeded', value: true });
  });
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
  });
}

export function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
