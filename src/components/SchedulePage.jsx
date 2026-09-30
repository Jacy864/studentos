// Schedule — 手機 day view + 週次導航；桌面 ≥1200 週網格（§6.2）。選中的週/日由 lib/uistate 持久化。
import { useEffect, useState } from 'react';
import { periodWithClock, placeOf, scheduleOn, timeRange, weeksLabel, bandOf, BAND_LABELS, TOTAL_WEEKS } from '../lib/schedule';
import { readSched, rememberSched } from '../lib/uistate';
import { todayStr, weekLabel, weekOf, weekdayToday } from '../lib/week';

const WD_SHORT = ['', '一', '二', '三', '四', '五', '六', '日'];

export default function SchedulePage({ courses, settings, onOpenCourse }) {
  const currentWeek = weekOf(todayStr(), settings.semesterStart);
  const [week, setWeek] = useState(() => {
    const s = readSched();
    return Math.min(Math.max(s.week || currentWeek, 1), TOTAL_WEEKS);
  });
  const [day, setDay] = useState(() => {
    const d = readSched().day;
    return d >= 1 && d <= 7 ? d : weekdayToday();
  });

  // 學期外（開學前/結束後）週次鉗回邊界，課表自然為空（§3.1）；render 期派生，避免 effect 裡 setState
  const shownWeek = Math.min(Math.max(week, 1), TOTAL_WEEKS);

  // 週/日 → hash + localStorage（僅在 schedule tab 掛載時執行）
  useEffect(() => {
    rememberSched(shownWeek, day);
  }, [shownWeek, day]);

  const inc = (d) => setWeek((w) => Math.min(Math.max(w + d, 1), TOTAL_WEEKS));
  const todays = scheduleOn(courses, day, shownWeek);

  return (
    <div className="page page-schedule">
      <header className="week-nav">
        <button className="week-nav__btn" onClick={() => inc(-1)} disabled={shownWeek <= 1} aria-label="上一週">‹</button>
        <span className="week-nav__label">{weekLabel(shownWeek)}</span>
        <button className="week-nav__btn" onClick={() => inc(1)} disabled={shownWeek >= TOTAL_WEEKS} aria-label="下一週">›</button>
        {shownWeek !== currentWeek && (
          <button className="week-nav__today" onClick={() => { setWeek(Math.min(Math.max(currentWeek, 1), TOTAL_WEEKS)); setDay(weekdayToday()); }}>
            回今天
          </button>
        )}
      </header>

      {/* 手機：day tabs */}
      <div className="day-tabs" role="tablist">
        {WD_SHORT.slice(1).map((d, i) => {
          const wd = i + 1;
          const has = scheduleOn(courses, wd, shownWeek).length > 0;
          return (
            <button
              key={wd}
              role="tab"
              aria-selected={day === wd}
              className={day === wd ? 'day-tabs__item is-active' : 'day-tabs__item'}
              onClick={() => setDay(wd)}
            >
              {d}
              <i className={has ? 'day-tabs__dot is-on' : 'day-tabs__dot'} />
            </button>
          );
        })}
      </div>

      {/* 手機：單日縱向列表 */}
      <ul className="course-list day-list">
        {todays.length === 0 && <li className="quiet-note">這天沒課。</li>}
        {todays.map(({ course, sc }, i) => (
          <li key={i}>
            <button className="course-card" onClick={() => onOpenCourse(course)}>
              <span className="course-card__time">{periodWithClock(settings, sc)}</span>
              <span className="course-card__name">{course.name}</span>
              <span className="course-card__meta">
                {timeRange(settings, sc)}
                {placeOf(course, sc) ? ` · ${placeOf(course, sc)}` : ' · 教室 ··'}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* 桌面：週網格（CSS ≥1200 才顯示） */}
      <WeekGrid courses={courses} settings={settings} week={shownWeek} onOpenCourse={onOpenCourse} />
    </div>
  );
}

function WeekGrid({ courses, settings, week, onOpenCourse }) {
  const cells = Array.from({ length: 7 }, (_, i) => scheduleOn(courses, i + 1, week));
  return (
    <div className="week-grid" aria-hidden={false}>
      <div className="week-grid__head">
        <span />
        {WD_SHORT.slice(1).map((d, i) => (
          <span key={d} className={i + 1 === weekdayToday() && week === weekOf(todayStr(), settings.semesterStart) ? 'is-today' : ''}>{d}</span>
        ))}
      </div>
      {BAND_LABELS.map((label, band) => (
        <div className="week-grid__row" key={band}>
          <span className="week-grid__band">{label}</span>
          {Array.from({ length: 7 }, (_, i) => {
            const items = cells[i].filter(({ sc }) => bandOf(sc.startPeriod) === band);
            return (
              <span className="week-grid__cell" key={i}>
                {items.map(({ course, sc }, j) => (
                  <button key={j} className="week-grid__course" onClick={() => onOpenCourse(course)}>
                    <b>{course.name}</b>
                    <i>{periodWithClock(settings, sc)}{placeOf(course, sc) ? ` · ${placeOf(course, sc)}` : ''}</i>
                  </button>
                ))}
              </span>
            );
          })}
        </div>
      ))}
      <p className="week-grid__hint">週次詳情：{weeksLabel({ weeks: [{ start: week, end: week }] })}</p>
    </div>
  );
}
