// StudentOS lite — 三個 tab 的外殼（§6）。無 router，狀態放記憶體（§7.3）。
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureSeeded, getSettings } from './lib/db';
import { SEED } from './lib/seed';
import BottomNav from './components/BottomNav';
import TodayPage from './components/TodayPage';
import SchedulePage from './components/SchedulePage';
import TasksPage from './components/TasksPage';
import CourseSheet from './components/CourseSheet';
import './app.css';

export default function App() {
  const [tab, setTab] = useState('today');
  const [sheetCourse, setSheetCourse] = useState(null);

  useEffect(() => { ensureSeeded(); }, []);

  const courses = useLiveQuery(() => db.courses.toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const settings = useLiveQuery(() => getSettings(), []) || SEED.settings;

  return (
    <div className="app">
      <main className="app__main">
        {tab === 'today' && (
          <TodayPage courses={courses} tasks={tasks} settings={settings} onOpenCourse={setSheetCourse} />
        )}
        {tab === 'schedule' && (
          <SchedulePage courses={courses} settings={settings} onOpenCourse={setSheetCourse} />
        )}
        {tab === 'tasks' && <TasksPage courses={courses} tasks={tasks} />}
      </main>

      <BottomNav tab={tab} onChange={setTab} />

      <CourseSheet course={sheetCourse} tasks={tasks} settings={settings} onClose={() => setSheetCourse(null)} />
    </div>
  );
}
