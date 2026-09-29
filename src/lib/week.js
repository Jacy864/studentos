// 週次計算 — 任務書 §3 的靈魂。
// 全部用本地日期字串 "YYYY-MM-DD" 運算，禁止 UTC timestamp 除 86400000。
export function weekOf(dateStr, semesterStart) {
  const d = new Date(dateStr + 'T00:00:00');
  const s = new Date(semesterStart + 'T00:00:00');
  const diffDays = Math.round((d - s) / 86400000); // Math.round 防 DST/浮點
  return Math.floor(diffDays / 7) + 1;
}

export function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

// Date.getDay() 回傳 0=週日 → 模型 weekday 1-7（週一=1）；轉換集中這一處（任務書 §10.2）
export function weekdayToday() {
  const g = new Date().getDay();
  return g === 0 ? 7 : g;
}

// 週次顯示規則（§3.1）：w<1 開學前、w>17 學期結束，都屬正常狀態
export function weekLabel(w, totalWeeks = 17) {
  if (w < 1) return '開學前';
  if (w > totalWeeks) return '學期結束';
  return `第 ${w} 週`;
}

// schedule 的週次區間在第 w 週是否生效
export function activeInWeek(weeks, w) {
  return weeks.some(({ start, end }) => w >= start && w <= end);
}

// schedule 在第 w 週的星期 wd 是否上課
export function activeOn(weeks, weekday, w, wd) {
  return weekday === wd && activeInWeek(weeks, w);
}

// 本地日期字串 +n 天（§10.1：字串運算，不碰 UTC timestamp）
export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
