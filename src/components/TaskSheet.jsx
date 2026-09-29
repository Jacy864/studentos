// 新增/編輯任務 bottom sheet（§6.3）— 必填只有 title，其餘可選摺疊
import { useState } from 'react';
import { db } from '../lib/db';

export default function TaskSheet({ task, courses, onClose }) {
  const editing = Boolean(task);
  const [title, setTitle] = useState(task?.title || '');
  const [courseId, setCourseId] = useState(task?.courseId || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [priority, setPriority] = useState(task?.priority ?? 0);

  const save = async () => {
    if (!title.trim()) return;
    await db.tasks.put({
      id: task?.id || crypto.randomUUID(),
      title: title.trim(),
      courseId: courseId || null,
      dueDate: dueDate || null,
      completed: task?.completed ?? false,
      priority: Number(priority),
      createdAt: task?.createdAt || new Date().toISOString(),
      notes: task?.notes || null,
    });
    onClose();
  };

  const remove = async () => {
    if (editing && confirm('刪除這個任務？')) {
      await db.tasks.delete(task.id);
      onClose();
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={editing ? '編輯任務' : '新增任務'} onClick={(e) => e.stopPropagation()}>
        <button className="sheet__close" onClick={onClose} aria-label="關閉">×</button>
        <h2 className="sheet__title">{editing ? '編輯任務' : '新增任務'}</h2>

        <input
          className="field"
          autoFocus
          placeholder="要做什麼？"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />

        <details className="field-fold" open={Boolean(task?.courseId || task?.dueDate || task?.priority)}>
          <summary>更多欄位（課程 / 期限 / 優先級）</summary>
          <div className="field-grid">
            <label className="field-cell">
              <span>課程</span>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">無課程（個人事務）</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field-cell">
              <span>期限</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
            <label className="field-cell">
              <span>優先級</span>
              <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
                <option value={0}>普通</option>
                <option value={1}>重要</option>
                <option value={2}>緊急</option>
              </select>
            </label>
          </div>
        </details>

        <div className="sheet__actions">
          {editing && <button className="btn btn-ghost" onClick={remove}>刪除</button>}
          <button className="btn btn-primary" onClick={save} disabled={!title.trim()}>儲存</button>
        </div>
      </div>
    </div>
  );
}
