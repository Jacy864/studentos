// M1 冒煙畫面：驗證 Dexie seed + 週次 + 匯出在瀏覽器端落地。M2 會整個換掉。
import { useEffect, useState } from 'react';
import { db, ensureSeeded, getSettings, exportData, downloadJSON } from './lib/db';
import { weekOf, todayStr, weekdayToday, weekLabel, activeOn } from './lib/week';

const WD = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日'];

export default function App() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await ensureSeeded();
        const [settings, courses, tasks] = await Promise.all([
          getSettings(),
          db.courses.toArray(),
          db.tasks.toArray(),
        ]);
        setS({ settings, courses, tasks });
      } catch (e) {
        setErr(String(e));
      }
    })();
  }, []);

  if (err) return <div style={{ padding: 24 }}>資料層錯誤：{err}</div>;
  if (!s) return <div style={{ padding: 24 }}>載入中…</div>;

  const { settings, courses, tasks } = s;
  const w = weekOf(todayStr(), settings.semesterStart);
  const wd = weekdayToday();
  const today = courses
    .flatMap((c) => c.schedules.map((sc) => ({ c, sc })))
    .filter(({ sc }) => activeOn(sc.weeks, sc.weekday, w, wd))
    .sort((a, b) => a.sc.startPeriod - b.sc.startPeriod);

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 20, letterSpacing: 1 }}>StudentOS lite</h1>
      <p style={{ color: 'var(--secondary)' }}>
        M1 資料層就緒 · {WD[wd]} · {todayStr()} · {weekLabel(w)}
      </p>

      <h2 style={{ fontSize: 14, color: 'var(--tiffany-deep)' }}>今日課程（第 {w} 週過濾後）</h2>
      {today.length === 0 && <p style={{ color: 'var(--secondary)' }}>今天沒課。</p>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
        {today.map(({ c, sc }, i) => (
          <li key={i} style={{ borderLeft: '3px solid var(--tiffany)', background: 'var(--surface)', padding: '10px 12px' }}>
            <strong>{c.name}</strong>
            <div style={{ fontSize: 13, color: 'var(--secondary)' }}>
              {sc.startPeriod}–{sc.endPeriod} 節 · {sc.classroom || c.classroom || '教室 ··'}
            </div>
          </li>
        ))}
      </ul>

      <p style={{ fontSize: 13, color: 'var(--secondary)' }}>
        seed：{courses.length} 門課 · {tasks.length} 個任務 · 學期起始 {settings.semesterStart}
      </p>
      <button
        onClick={() => exportData().then((d) => downloadJSON(d, `studentos-backup-${todayStr()}.json`))}
        style={{ marginTop: 8, padding: '8px 14px', background: 'var(--coral)', color: '#fff', border: 0, borderRadius: 6 }}
      >
        匯出 JSON 備份
      </button>
    </main>
  );
}
