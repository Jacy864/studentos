// Tasks（§6.3）：未完成在前、已完成在後；分組篩選；FAB 快速新增
import { useState } from 'react';
import { TaskRow } from './TodayPage';

const MONTH_DAY = (s) => (s ? `${Number(s.slice(5, 7))}月${Number(s.slice(8, 10))}日` : '');

export default function TasksPage({ courses, tasks, onAddTask, onEditTask }) {
  const [filter, setFilter] = useState('all'); // all | none | courseId

  const visible = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'none') return !t.courseId;
    return t.courseId === filter;
  });
  const open = visible.filter((t) => !t.completed).sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  const done = visible.filter((t) => t.completed);
  const courseName = (id) => courses.find((c) => c.id === id)?.name;

  const chips = [
    { key: 'all', label: '全部' },
    { key: 'none', label: '無課程' },
    ...courses.map((c) => ({ key: c.id, label: c.name })),
  ];

  return (
    <div className="page page-tasks">
      <h1 className="page-title">Tasks</h1>

      <div className="chip-row" role="tablist" aria-label="篩選">
        {chips.map((chip) => (
          <button
            key={chip.key}
            role="tab"
            aria-selected={filter === chip.key}
            className={filter === chip.key ? 'chip is-active' : 'chip'}
            onClick={() => setFilter(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {tasks.length === 0 && <p className="quiet-note">這裡還沒有東西。</p>}
      {tasks.length > 0 && open.length === 0 && done.length === 0 && <p className="quiet-note">這個分組沒有任務。</p>}
      {tasks.length > 0 && open.length === 0 && done.length > 0 && filter === 'all' && <p className="quiet-note">全部搞定了。</p>}

      <ul className="task-list">
        {open.map((t) => (
          <TaskRow key={t.id} task={t} courseName={courseName(t.courseId)} onEdit={() => onEditTask(t)} />
        ))}
      </ul>

      {done.length > 0 && (
        <>
          <h2 className="section-label">已完成</h2>
          <ul className="task-list">
            {done.map((t) => (
              <TaskRow key={t.id} task={t} courseName={courseName(t.courseId)} onEdit={() => onEditTask(t)} />
            ))}
          </ul>
        </>
      )}

      <button className="fab" onClick={onAddTask} aria-label="新增任務">+</button>
    </div>
  );
}
