// Tasks — 未完成在前（dueDate 升序）、已完成在後（§6.3）。新增/編輯/篩選在 M3。
import { db } from '../lib/db';
import { TaskRow } from './TodayPage';

const MONTH_DAY = (s) => (s ? `${Number(s.slice(5, 7))}月${Number(s.slice(8, 10))}日` : '');

export default function TasksPage({ courses, tasks }) {
  const open = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  const done = tasks.filter((t) => t.completed);
  const courseName = (id) => courses.find((c) => c.id === id)?.name;

  return (
    <div className="page page-tasks">
      <h1 className="page-title">Tasks</h1>
      {open.length === 0 && done.length === 0 && <p className="quiet-note">這裡還沒有東西。</p>}
      {open.length === 0 && done.length > 0 && <p className="quiet-note">全部搞定了。</p>}
      <ul className="task-list">
        {open.map((t) => <TaskRow key={t.id} task={t} courseName={courseName(t.courseId)} />)}
      </ul>
      {done.length > 0 && (
        <>
          <h2 className="section-label">已完成</h2>
          <ul className="task-list">
            {done.map((t) => <TaskRow key={t.id} task={t} courseName={courseName(t.courseId)} />)}
          </ul>
        </>
      )}
      {/* 新增入口在 M3：bottom sheet，必填只有 title */}
      <button className="fab" onClick={() => db.tasks.add({
        id: crypto.randomUUID(),
        title: `測試任務 ${new Date().toLocaleTimeString()}`,
        courseId: null, dueDate: null, completed: false, priority: 0,
        createdAt: new Date().toISOString(),
      })} title="M3 會換成正式新增表單">+</button>
    </div>
  );
}
