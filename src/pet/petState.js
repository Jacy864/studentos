// 桌寵狀態機的純邏輯（§13.3 行為與日程聯動）— 可單測
import { activeOn, weekOf } from '../lib/week.js';
import { periodTime, placeOf } from '../lib/schedule.js';

// 回傳 { state, sign? }；state: sign | sweep | sleep | idle
export function petScheduleState({ courses, settings, dateStr, weekday, minutes }) {
  // 深夜 23:00 後睡覺（凌晨 0-6 也睡）
  const hour = Math.floor(minutes / 60);
  if (hour >= 23 || hour < 6) return { state: 'sleep' };

  const week = weekOf(dateStr, settings.semesterStart);
  const today = courses
    .flatMap((c) => c.schedules.filter((sc) => activeOn(sc.weeks, sc.weekday, week, weekday)).map((sc) => ({ course: c, sc })))
    .sort((a, b) => a.sc.startPeriod - b.sc.startPeriod);

  if (today.length === 0) return { state: 'sweep' }; // 今日無課 → 掃地

  // 下節課前 10 分鐘舉牌
  for (const { course, sc } of today) {
    const t = periodTime(settings, sc.startPeriod);
    if (!t) continue;
    const [h, m] = t.start.split(':').map(Number);
    const diff = h * 60 + m - minutes;
    if (diff > 0 && diff <= 10) {
      return {
        state: 'sign',
        sign: { line1: course.name, line2: placeOf(course, sc) || '教室 ··' },
      };
    }
  }
  return { state: 'idle' };
}
