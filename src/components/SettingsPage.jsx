// Settings（§6.4）：學期起始日 / 節次時刻表 / 課程 CRUD / 匯出匯入
import { db, exportData, importData, downloadJSON, putSettings } from '../lib/db';
import { todayStr } from '../lib/week';

export default function SettingsPage({ courses, settings, onClose, onEditCourse }) {
  const setPeriodTime = (period, key, value) => {
    const periodTimes = settings.periodTimes.map((t) => (t.period === period ? { ...t, [key]: value } : t));
    putSettings({ ...settings, periodTimes });
  };

  const doExport = () => exportData().then((d) => downloadJSON(d, `studentos-backup-${todayStr()}.json`));

  const doImport = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      doExport(); // 覆蓋前強制自動備份（§10.7）
      if (confirm('匯入將全量覆蓋現有資料（已自動下載目前資料的備份）。確定繼續？')) {
        await importData(data);
        alert('匯入完成');
      }
    } catch (e) {
      alert(`匯入失敗：${e.message}`);
    }
  };

  return (
    <div className="overlay-page">
      <header className="overlay-page__head">
        <button className="btn btn-ghost" onClick={onClose}>← 返回</button>
        <h1>Settings</h1>
      </header>

      <h2 className="section-label">學期</h2>
      <div className="field-grid">
        <label className="field-cell">
          <span>第 1 週週一（學期起始日）</span>
          <input
            type="date"
            value={settings.semesterStart}
            onChange={(e) => e.target.value && putSettings({ ...settings, semesterStart: e.target.value })}
          />
        </label>
      </div>

      <h2 className="section-label">節次時刻表</h2>
      <div className="period-table">
        {settings.periodTimes.map((t) => (
          <div className="period-table__row" key={t.period}>
            <span className="period-table__label">{t.evening ? `晚${t.period - 8}` : t.period} 節</span>
            <input type="time" value={t.start} onChange={(e) => setPeriodTime(t.period, 'start', e.target.value)} />
            <span className="period-table__dash">–</span>
            <input type="time" value={t.end} onChange={(e) => setPeriodTime(t.period, 'end', e.target.value)} />
          </div>
        ))}
      </div>

      <h2 className="section-label">課程（{courses.length}）</h2>
      <ul className="settings-course-list">
        {courses.map((c) => (
          <li key={c.id}>
            <button className="settings-course-list__item" onClick={() => onEditCourse(c)}>
              <span className="settings-course-list__name">{c.name}</span>
              <span className="settings-course-list__meta">{c.credits?.toFixed(1)} 學分 · {c.schedules.length} 個時段</span>
            </button>
          </li>
        ))}
      </ul>
      <button className="btn btn-primary" onClick={() => onEditCourse(null)}>+ 新增課程</button>

      <h2 className="section-label">資料</h2>
      <div className="sheet__actions sheet__actions--start">
        <button className="btn btn-ghost" onClick={doExport}>匯出 JSON</button>
        <label className="btn btn-ghost file-btn">
          匯入 JSON
          <input type="file" accept="application/json,.json" onChange={(e) => { doImport(e.target.files?.[0]); e.target.value = ''; }} hidden />
        </label>
      </div>
      <p className="settings-note">資料只存在這台裝置的瀏覽器裡（IndexedDB）。匯出檔就是完整備份，換手機/重灌前記得導出。</p>
    </div>
  );
}
