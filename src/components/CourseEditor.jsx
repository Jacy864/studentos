// 課程新增/編輯（§6.4 Settings 課程 CRUD），含週次區間編輯與本地衝突檢測
import { useMemo, useState } from 'react';
import { db } from '../lib/db';
import { conflictsFor, parseWeeks, weeksLabel } from '../lib/schedule';

const WD = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日'];
const emptySchedule = () => ({ weekday: 1, startPeriod: 1, endPeriod: 2, weeks: [{ start: 3, end: 17 }], classroom: '', note: '' });

export default function CourseEditor({ course, courses, onClose }) {
  const editing = Boolean(course?.id);
  const [name, setName] = useState(course?.name || '');
  const [teacher, setTeacher] = useState(course?.teacher || '');
  const [credits, setCredits] = useState(course?.credits ?? 2.0);
  const [classroom, setClassroom] = useState(course?.classroom || '');
  const [department, setDepartment] = useState(course?.department || '');
  const [schedules, setSchedules] = useState(() =>
    (course?.schedules?.length ? course.schedules : [emptySchedule()]).map((sc) => ({
      ...sc,
      weeksText: sc.weeks.map(({ start, end }) => (start === end ? `${start}` : `${start}-${end}`)).join(', '),
    })),
  );
  const [showConflict, setShowConflict] = useState(false);

  const draft = useMemo(() => ({
    id: course?.id || 'draft',
    name: name.trim(),
    schedules: schedules.map(({ weeksText, ...sc }) => {
      // 倒置節次自動交換（10 節起、2 節止 → 2–10 節），衝突檢測與入庫同源
      const startPeriod = Math.min(sc.startPeriod, sc.endPeriod);
      const endPeriod = Math.max(sc.startPeriod, sc.endPeriod);
      return { ...sc, startPeriod, endPeriod, weeks: parseWeeks(weeksText) };
    }),
  }), [course, name, schedules]);

  const conflicts = useMemo(
    () => (name.trim() ? conflictsFor(draft, courses, editing ? course.id : null) : []),
    [draft, courses, editing, course, name],
  );

  const setSc = (i, patch) => setSchedules((list) => list.map((sc, j) => {
    if (j !== i) return sc;
    const next = { ...sc, ...patch };
    // 聯動：起點越過終點時把終點拉上來，select 不倒置（draft 清洗是雙保險）
    if (next.startPeriod > next.endPeriod) next.endPeriod = next.startPeriod;
    return next;
  }));

  const save = async () => {
    if (!name.trim()) return;
    const clean = {
      id: course?.id || crypto.randomUUID(),
      name: name.trim(),
      teacher: teacher.trim() || null,
      credits: Number(credits) || 0,
      classroom: classroom.trim() || null,
      department: department.trim() || null,
      schedules: draft.schedules.filter((sc) => sc.weeks.length > 0),
    };
    if (conflicts.length > 0 && !showConflict) {
      setShowConflict(true); // 第一步：先警告
      return;
    }
    await db.courses.put(clean);
    onClose();
  };

  const remove = async () => {
    if (editing && confirm(`刪除《${course.name}》？其關聯任務會保留為「無課程」。`)) {
      await db.courses.delete(course.id);
      onClose();
    }
  };

  return (
    <div className="sheet-backdrop sheet-backdrop--center">
      <div className="sheet sheet--editor" role="dialog" aria-label={editing ? '編輯課程' : '新增課程'} onClick={(e) => e.stopPropagation()}>
        <button className="sheet__close" onClick={onClose} aria-label="關閉">×</button>
        <h2 className="sheet__title">{editing ? '編輯課程' : '新增課程'}</h2>

        <div className="field-grid">
          <label className="field-cell field-cell--wide">
            <span>課名 *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="課程名稱" />
          </label>
          <label className="field-cell field-cell--wide">
            <span>教師</span>
            <input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="未知可留空" />
          </label>
          <label className="field-cell">
            <span>學分</span>
            <input type="number" step="0.5" min="0" value={credits} onChange={(e) => setCredits(e.target.value)} />
          </label>
          <label className="field-cell">
            <span>預設地點</span>
            <input value={classroom} onChange={(e) => setClassroom(e.target.value)} placeholder="未知留空" />
          </label>
          <label className="field-cell field-cell--wide">
            <span>開課單位</span>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="可留空" />
          </label>
        </div>

        <h3 className="section-label">上課時間（可多筆）</h3>
        {schedules.map((sc, i) => (
          <div className="sc-row" key={i}>
            <div className="sc-row__line1">
              <select value={sc.weekday} onChange={(e) => setSc(i, { weekday: Number(e.target.value) })}>
                {WD.slice(1).map((d, k) => <option key={k} value={k + 1}>{d}</option>)}
              </select>
              <select value={sc.startPeriod} onChange={(e) => setSc(i, { startPeriod: Number(e.target.value) })}>
                {Array.from({ length: 12 }, (_, k) => <option key={k} value={k + 1}>{k + 1} 節起</option>)}
              </select>
              <select value={sc.endPeriod} onChange={(e) => setSc(i, { endPeriod: Number(e.target.value) })}>
                {Array.from({ length: 12 }, (_, k) => <option key={k} value={k + 1}>{k + 1} 節止</option>)}
              </select>
            </div>
            <div className="sc-row__line2">
              <input
                className="sc-row__weeks"
                value={sc.weeksText}
                onChange={(e) => setSc(i, { weeksText: e.target.value })}
                placeholder="週次，如 3-7 或 3-7, 10-17"
              />
              <input value={sc.classroom || ''} onChange={(e) => setSc(i, { classroom: e.target.value })} placeholder="地點（可覆蓋）" />
            </div>
            <div className="sc-row__line2">
              <input value={sc.note || ''} onChange={(e) => setSc(i, { note: e.target.value })} placeholder="備註（如：線上技術基礎）" />
              {schedules.length > 1 && (
                <button className="btn btn-ghost sc-row__del" onClick={() => setSchedules((l) => l.filter((_, j) => j !== i))}>移除</button>
              )}
            </div>
          </div>
        ))}
        <button className="btn btn-ghost" onClick={() => setSchedules((l) => [...l, emptySchedule()])}>+ 加一個時段</button>

        {showConflict && conflicts.length > 0 && (
          <div className="conflict-box" role="alert">
            <b>⚠ 與既有課程衝突</b>
            <ul>
              {conflicts.map(({ course: oc, osc }, i) => (
                <li key={i}>
                  {oc.name} · {WD[osc.weekday]} {osc.startPeriod}–{osc.endPeriod} 節 · {weeksLabel(osc)}
                </li>
              ))}
            </ul>
            <p>學校系統不會攔你，我們提醒到這裡。確定衝突可共存再儲存。</p>
          </div>
        )}

        <div className="sheet__actions">
          {editing && <button className="btn btn-ghost" onClick={remove}>刪除課程</button>}
          <button className="btn btn-primary" onClick={save} disabled={!name.trim()}>
            {conflicts.length > 0 && !showConflict ? '儲存（有衝突待確認）' : showConflict || conflicts.length === 0 ? '儲存' : '仍要儲存'}
          </button>
        </div>
      </div>
    </div>
  );
}
