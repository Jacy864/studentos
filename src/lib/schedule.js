// 課表選擇器與顯示格式 — 時刻一律由 periodTimes 推導，不冗餘手存（§2.2）
import { activeOn } from './week.js';

export const TOTAL_WEEKS = 17;

export function periodTime(settings, p) {
  return settings.periodTimes.find((t) => t.period === p) || null;
}

export function periodLabel(sc) {
  return `${sc.startPeriod}–${sc.endPeriod} 節`;
}

export function timeRange(settings, sc) {
  const a = periodTime(settings, sc.startPeriod);
  const b = periodTime(settings, sc.endPeriod);
  return a && b ? `${a.start}–${b.end}` : '';
}

// 節次為主、時刻為輔：`5–6 節 · 13:00`
export function periodWithClock(settings, sc) {
  const a = periodTime(settings, sc.startPeriod);
  return `${periodLabel(sc)}${a ? ` · ${a.start}` : ''}`;
}

// 地點：schedule 覆蓋 course，再未知 → null（UI 顯示「教室 ··」，§0.2 不造假）
export function placeOf(course, sc) {
  return sc.classroom || course.classroom || null;
}

// 第 w 週星期 wd 的所有課，按 startPeriod 排序
export function scheduleOn(courses, wd, w) {
  return courses
    .flatMap((c) =>
      c.schedules
        .filter((sc) => activeOn(sc.weeks, sc.weekday, w, wd))
        .map((sc) => ({ course: c, sc })),
    )
    .sort((a, b) => a.sc.startPeriod - b.sc.startPeriod);
}

export function weeksLabel(sc) {
  return sc.weeks.map(({ start, end }) => (start === end ? `${start}` : `${start}–${end}`)).join('、') + ' 週';
}

// 桌面週網格的四個時段行（§6.2）
export function bandOf(period) {
  if (period <= 4) return 0; // 上午 1–4
  if (period <= 6) return 1; // 下午前 5–6
  if (period <= 8) return 2; // 下午後 7–8
  return 3; // 晚間 9–12
}

export const BAND_LABELS = ['上午 1–4', '下午前 5–6', '下午後 7–8', '晚間 9–12'];

// "3-7, 10-17" → [{start,end}]；容忍全形與頓號。
// 倒置（"17-3"）自動交換；非整數或越界（1..TOTAL_WEEKS）的區段丟棄。
export function parseWeeks(text) {
  return String(text)
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(\d+)\s*[-–—~]\s*(\d+)$/);
      const [a, b] = m ? [Number(m[1]), Number(m[2])] : [Number(s), Number(s)];
      if (!Number.isInteger(a) || !Number.isInteger(b)) return null;
      const start = Math.min(a, b);
      const end = Math.max(a, b);
      if (start < 1 || end > TOTAL_WEEKS) return null;
      return { start, end };
    })
    .filter(Boolean);
}

// ——— 課程生命週期（Tasks/Today 用）：結課的不擋路、進行中的最新 block 在前 ———
// 全部 schedules 週次區間的總跨度；無 schedules → { start: null, end: null }
export function courseWeekSpan(course) {
  const starts = [];
  const ends = [];
  for (const sc of course.schedules || []) {
    for (const { start, end } of sc.weeks) { starts.push(start); ends.push(end); }
  }
  return { start: starts.length ? Math.min(...starts) : null, end: ends.length ? Math.max(...ends) : null };
}

// 已結課：最後一週 < 當前週（身體 3-7 於第 8 週起算結課）
export function isCourseEnded(course, currentWeek) {
  const { end } = courseWeekSpan(course);
  return end !== null && end < currentWeek;
}

// 任務入口的課程排序：剔除已結課 → 進行中按開課週降序（新 block 在前，格物先於英語）
// → 未開課按開課週升序 appended 在後。start 未知的排進行中末尾。
export function orderActiveCourses(courses, currentWeek) {
  const active = [];
  const future = [];
  for (const c of courses) {
    const { start, end } = courseWeekSpan(c);
    if (end !== null && end < currentWeek) continue; // 結課剔除
    if (start !== null && start > currentWeek) future.push(c);
    else active.push(c);
  }
  const startOf = (c) => courseWeekSpan(c).start ?? 99;
  active.sort((a, b) => startOf(b) - startOf(a));
  future.sort((a, b) => startOf(a) - startOf(b));
  return [...active, ...future];
}

// ——— 衝突檢測（§6.4：學校系統不做的，我們做）———
// 同 weekday × 節次重疊 × 週次區間交集 → 衝突

export function periodsOverlap(a, b) {
  return a.startPeriod <= b.endPeriod && b.startPeriod <= a.endPeriod;
}

export function weeksOverlap(a, b) {
  return a.some((wa) => b.some((wb) => wa.start <= wb.end && wb.start <= wa.end));
}

export function schedulesConflict(a, b) {
  return a.weekday === b.weekday && periodsOverlap(a, b) && weeksOverlap(a.weeks, b.weeks);
}

// 新增/編輯 course 時，找出與「其他課程」衝突的所有組合。
// exceptCourseId：編輯既有課時排除自己（新課傳 null）
export function conflictsFor(course, courses, exceptCourseId = null) {
  const hits = [];
  for (const other of courses) {
    if (other.id === course.id || other.id === exceptCourseId) continue;
    for (const sc of course.schedules || []) {
      for (const osc of other.schedules) {
        if (schedulesConflict(sc, osc)) {
          hits.push({ course: other, sc, osc });
        }
      }
    }
  }
  return hits;
}
