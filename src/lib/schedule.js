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
