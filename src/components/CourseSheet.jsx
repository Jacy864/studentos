// 課程詳情 bottom sheet（§6.2）：學分/教師/開課單位/時間/週次/地點 + 該課任務
import { placeOf, periodWithClock, timeRange, weeksLabel } from '../lib/schedule';
import { TaskRow } from './TodayPage';

const WD = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日'];

export default function CourseSheet({ course, tasks, settings, onClose }) {
  if (!course) return null;
  const courseTasks = tasks.filter((t) => t.courseId === course.id);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={course.name} onClick={(e) => e.stopPropagation()}>
        <button className="sheet__close" onClick={onClose} aria-label="關閉">×</button>
        <h2 className="sheet__title">{course.name}</h2>

        <dl className="sheet__meta">
          <div><dt>教師</dt><dd>{course.teacher || '··'}</dd></div>
          <div><dt>學分</dt><dd>{course.credits?.toFixed(1)}</dd></div>
          {course.department && <div><dt>開課單位</dt><dd>{course.department}</dd></div>}
        </dl>

        <h3 className="section-label">時間</h3>
        <ul className="sheet__schedules">
          {course.schedules.map((sc, i) => (
            <li key={i}>
              <span>{WD[sc.weekday]} · {periodWithClock(settings, sc)}</span>
              <span className="sheet__schedule-meta">
                {timeRange(settings, sc)} · {weeksLabel(sc)}
                {sc.note ? ` · ${sc.note}` : ''}
                {` · ${placeOf(course, sc) || '教室 ··'}`}
              </span>
            </li>
          ))}
        </ul>

        <h3 className="section-label">任務</h3>
        {courseTasks.length === 0 ? (
          <p className="quiet-note">這門課還沒有任務。</p>
        ) : (
          <ul className="task-list">
            {courseTasks.map((t) => <TaskRow key={t.id} task={t} />)}
          </ul>
        )}
      </div>
    </div>
  );
}
