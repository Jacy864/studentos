// Today — 打開 3 秒內知道今天要幹什麼（§6.1）。安靜日的留白本身就是設計。
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
  const due = tasks
    .filter((t) => !t.completed && t.dueDate && t.dueDate <= today)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  const upcoming = tasks
    .filter((t) => !t.completed && t.dueDate && t.dueDate > today && t.dueDate <= addDays(today, 7))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const courseName = (id) => courses.find((c) => c.id === id)?.name;

  const quiet = todays.length === 0 && due.length === 0 && upcoming.length === 0;

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
    </div>
  );
}

export function TaskRow({ task, courseName, onEdit }) {
  const toggle = () => {
    db.tasks.update(task.id, { completed: !task.completed });
    if (!task.completed) window.dispatchEvent(new CustomEvent('studentos:task-done')); // 螃蟹慶祝（§13.3）
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
    </li>
  );
}
