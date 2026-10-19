// Schedule — 手機 day view + 週次導航；桌面 ≥1200 週網格（§6.2）。選中的週/日由 lib/uistate 持久化。
// v4：手機新增「日/週」切換 —— 週總覽一次看七天，點日期標頭跳進該天 day view。
// v4.1：任務跟隨課程縮排顯示（默認全部展開）—— day view 掛該課全部未完成任務；
// 週總覽每門課的任務只掛在本週第一次出現那天，避免一格課重複掛四天。
import { useEffect, useState } from 'react';
import { periodWithClock, placeOf, scheduleOn, timeRange, weeksLabel, bandOf, BAND_LABELS, TOTAL_WEEKS } from '../lib/schedule';
import { readSched, rememberSched } from '../lib/uistate';
import { dateOf, todayStr, weekLabel, weekOf, weekdayToday } from '../lib/week';
import { openTasksOf, takeWeekFirst } from '../lib/tasks';
import { TaskRow } from './TodayPage';

const WD_SHORT = ['', '一', '二', '三', '四', '五', '六', '日'];
const SLASH_MD = (s) => `${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))}`;

export default function SchedulePage({ courses, tasks = [], settings, onOpenCourse, onEditTask }) {
  const currentWeek = weekOf(todayStr(), settings.semesterStart);
  const [week, setWeek] = useState(() => {
    const s = readSched();
    return Math.min(Math.max(s.week || currentWeek, 1), TOTAL_WEEKS);
  });
  const [day, setDay] = useState(() => {
    const d = readSched().day;
    return d >= 1 && d <= 7 ? d : weekdayToday();
  });
  const [view, setView] = useState(() => (readSched().view === 'week' ? 'week' : 'day'));

  // 學期外（開學前/結束後）週次鉗回邊界，課表自然為空（§3.1）；render 期派生，避免 effect 裡 setState
  const shownWeek = Math.min(Math.max(week, 1), TOTAL_WEEKS);

  // 週/日/視圖 → hash + localStorage（僅在 schedule tab 掛載時執行）
  useEffect(() => {
    rememberSched(shownWeek, day, view);
  }, [shownWeek, day, view]);

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
        <div className="view-toggle" role="tablist" aria-label="視圖">
          <button
            role="tab"
            aria-selected={view === 'day'}
            className={view === 'day' ? 'view-toggle__btn is-active' : 'view-toggle__btn'}
            onClick={() => setView('day')}
          >
            日
          </button>
          <button
            role="tab"
            aria-selected={view === 'week'}
            className={view === 'week' ? 'view-toggle__btn is-active' : 'view-toggle__btn'}
            onClick={() => setView('week')}
          >
            週
          </button>
        </div>
      </header>

      {/* 手機 day view：day tabs + 單日列表 */}
      {view === 'day' && (
        <>
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

          <ul className="course-list day-list">
            {todays.length === 0 && <li className="quiet-note">這天沒課。</li>}
            {todays.map(({ course, sc }, i) => {
              const mine = openTasksOf(tasks, course.id);
              return (
                <li key={i}>
                  <button className="course-card" onClick={() => onOpenCourse(course)}>
                    <span className="course-card__time">{periodWithClock(settings, sc)}</span>
                    <span className="course-card__name">{course.name}</span>
                    <span className="course-card__meta">
                      {timeRange(settings, sc)}
                      {placeOf(course, sc) ? ` · ${placeOf(course, sc)}` : ' · 教室 ··'}
                    </span>
                  </button>
                  {mine.length > 0 && (
                    <ul className="course-tasks">
                      {mine.map((t) => (
                        <TaskRow key={t.id} task={t} onEdit={() => onEditTask?.(t)} />
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* 手機 week view：七天縱向總覽，一屏掃完一週 */}
      {view === 'week' && (
        <WeekOverview
          courses={courses}
          tasks={tasks}
          settings={settings}
          week={shownWeek}
          currentWeek={currentWeek}
          onOpenCourse={onOpenCourse}
          onPickDay={(wd) => { setDay(wd); setView('day'); }}
          onEditTask={onEditTask}
        />
      )}

      {/* 桌面：週網格（CSS ≥1200 才顯示） */}
      <WeekGrid courses={courses} settings={settings} week={shownWeek} onOpenCourse={onOpenCourse} />
    </div>
  );
}

function WeekOverview({ courses, tasks = [], settings, week, currentWeek, onOpenCourse, onPickDay, onEditTask }) {
  // 本週每門課的任務只掛第一次出現那天：週一到週日順序掃描，掛過就登記
  const seenCourseIds = new Set();
  return (
    <div className="week-overview">
      {WD_SHORT.slice(1).map((d, i) => {
        const wd = i + 1;
        const items = scheduleOn(courses, wd, week);
        const isToday = week === currentWeek && wd === weekdayToday();
        return (
          <section className={items.length ? 'week-overview__day' : 'week-overview__day is-empty'} key={wd}>
            <button className="week-overview__head" onClick={() => onPickDay(wd)} aria-label={`看週${d}的單日課表`}>
              <b>週{d}</b>
              <i>{SLASH_MD(dateOf(settings.semesterStart, week, wd))}</i>
              {isToday && <em className="week-overview__today">今天</em>}
            </button>
            {items.length === 0 ? (
              <p className="week-overview__none">—</p>
            ) : (
              <ul className="week-overview__list">
                {items.map(({ course, sc }, j) => {
                  const mine = takeWeekFirst(tasks, course.id, seenCourseIds);
                  return (
                    <li key={j}>
                      <button className="week-overview__item" onClick={() => onOpenCourse(course)}>
                        <b>{course.name}</b>
                        <i>{periodWithClock(settings, sc)}{placeOf(course, sc) ? ` · ${placeOf(course, sc)}` : ''}</i>
                      </button>
                      {mine.length > 0 && (
                        <ul className="course-tasks week-overview__tasks">
                          {mine.map((t) => (
                            <TaskRow key={t.id} task={t} onEdit={() => onEditTask?.(t)} />
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
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
