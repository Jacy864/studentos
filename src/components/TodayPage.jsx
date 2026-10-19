// Today — 打開 3 秒內知道今天要幹什麼（§6.1）。安靜日的留白本身就是設計。
// v4：帶課程的任務跟隨該課卡片顯示（英語任務掛英語卡、格物任務掛格物卡），
// 不再全部擠在 TASKS 區；只有「無課程」或「該課今天沒課」的任務才落回獨立區。
import crabWelcome from '../assets/welcome-crab.svg';
import { db } from '../lib/db';
import { addDays, todayStr, weekLabel, weekdayToday, weekOf } from '../lib/week';
import { periodWithClock, placeOf, scheduleOn, timeRange } from '../lib/schedule';

const WD = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日'];
const MONTH_DAY = (s) => `${Number(s.slice(5, 7))}月${Number(s.slice(8, 10))}日`;

export default function TodayPage({ courses, tasks, settings, onOpenCourse, onEditTask }) {
  const today = todayStr();
  const w = weekOf(today, settings.semesterStart);
  const wd = weekdayToday();

  const todays = scheduleOn(courses, wd, w);
  // 任務池 = 未完成且有期限、期限在今天+7 天內（與原 due/upcoming 口徑一致）
  const inWindow = tasks
    .filter((t) => !t.completed && t.dueDate && t.dueDate <= addDays(today, 7))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // 跟隨課程：今天有卡的課，其任務掛到卡片下
  const todaysCourseIds = new Set(todays.map(({ course }) => course.id));
  const attached = inWindow.filter((t) => t.courseId && todaysCourseIds.has(t.courseId));
  const attachedIds = new Set(attached.map((t) => t.id));
  const due = inWindow.filter((t) => t.dueDate <= today && !attachedIds.has(t.id));
  const upcoming = inWindow.filter((t) => t.dueDate > today && !attachedIds.has(t.id));
  const courseName = (id) => courses.find((c) => c.id === id)?.name;

  const quiet = todays.length === 0 && inWindow.length === 0;

  return (
    <div className="page page-today">
      <header className="today-head">
        <p className="today-head__month">
          {MONTH_DAY(today)} · {weekLabel(w)}
        </p>
        <h1 className="today-head__date">{Number(today.slice(8, 10))}</h1>
        <p className="today-head__weekday">{WD[wd]}</p>
      </header>

      {quiet && <p className="quiet-note">今天沒課。</p>}

      {todays.length > 0 && (
        <section className="today-block">
          <h2 className="section-label">TODAY</h2>
          <ul className="course-list">
            {todays.map(({ course, sc }, i) => {
              const mine = attached.filter((t) => t.courseId === course.id);
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
        </section>
      )}

      {due.length > 0 && (
        <section className="today-block">
          <h2 className="section-label">TASKS</h2>
          <ul className="task-list">
            {due.map((t) => (
              <TaskRow key={t.id} task={t} courseName={courseName(t.courseId)} onEdit={() => onEditTask?.(t)} />
            ))}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="today-block">
          <h2 className="section-label">UPCOMING</h2>
          <ul className="upcoming-list">
            {upcoming.map((t) => (
              <li key={t.id}>
                <span className="upcoming-list__when">{t.dueDate === addDays(today, 1) ? '明天' : MONTH_DAY(t.dueDate)}</span>
                <span className="upcoming-list__what">{t.title}</span>
                {t.courseId && courseName(t.courseId) && <span className="upcoming-list__course">{courseName(t.courseId)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 小裝飾：官方歡迎蟹（言指定的靜態素材，純裝飾零互動） */}
      <div className="crab-deco" aria-hidden="true">
        <img src={crabWelcome} alt="" draggable={false} />
      </div>
    </div>
  );
}

export function TaskRow({ task, courseName, onEdit }) {
  const toggle = () => {
    db.tasks.update(task.id, { completed: !task.completed });
  };
  // v4.1：行內直接刪——連點誤建多個任務時可以秒清，不用進 sheet 逐個開
  const remove = (e) => {
    e.stopPropagation();
    db.tasks.delete(task.id);
  };
  return (
    <li className={task.completed ? 'task-row is-done' : 'task-row'}>
      <button className="task-row__check" onClick={toggle} aria-label={task.completed ? '取消完成' : '完成'} />
      <div className="task-row__body" onClick={onEdit} role={onEdit ? 'button' : undefined}>
        <span className="task-row__title">
          {task.priority === 2 && <i className="task-row__flag task-row__flag--urgent" title="緊急">急</i>}
          {task.priority === 1 && <i className="task-row__flag" title="重要" />}
          {task.title}
        </span>
        <span className="task-row__meta">
          {courseName && <>{courseName} · </>}
          {task.dueDate ? `Due ${MONTH_DAY(task.dueDate)}` : ''}
        </span>
      </div>
      <button className="task-row__del" onClick={remove} aria-label={`刪除任務 ${task.title}`}>×</button>
    </li>
  );
}
