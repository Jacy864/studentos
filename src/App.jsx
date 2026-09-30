// StudentOS lite — 三個 tab 的外殼（§6）。無 router；UI 狀態由 lib/uistate 持久化（hash + localStorage）。
import { useEffect, useState } from 'react';
import { initialTab, rememberTab } from './lib/uistate';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureSeeded, getSettings } from './lib/db';
import { SEED } from './lib/seed';
import BottomNav from './components/BottomNav';
import TodayPage from './components/TodayPage';
import SchedulePage from './components/SchedulePage';
import TasksPage from './components/TasksPage';
import CourseSheet from './components/CourseSheet';
import TaskSheet from './components/TaskSheet';
import CourseEditor from './components/CourseEditor';
import SettingsPage from './components/SettingsPage';
import './app.css';

export default function App() {
  const [tab, setTab] = useState(initialTab);

  // tab → hash + localStorage（replaceState：不加歷史記錄，不污染返回鍵）
  useEffect(() => {
    rememberTab(tab);
  }, [tab]);

  const [sheetCourse, setSheetCourse] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [taskSheet, setTaskSheet] = useState(null); // null 關 | 'new' 新增 | task 物件 編輯
  const [courseEditor, setCourseEditor] = useState(false); // false 關 | 'new' | course 物件

  useEffect(() => { ensureSeeded(); }, []);

  const courses = useLiveQuery(() => db.courses.toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const settings = useLiveQuery(() => getSettings(), []) || SEED.settings;

  const editingTask = taskSheet && taskSheet !== 'new' ? taskSheet : null;

  return (
    <div className="app">
      <main className="app__main">
        {tab === 'today' && (
          <TodayPage
            courses={courses} tasks={tasks} settings={settings}
            onOpenCourse={setSheetCourse} onEditTask={setTaskSheet}
          />
        )}
        {tab === 'schedule' && (
          <SchedulePage courses={courses} settings={settings} onOpenCourse={setSheetCourse} />
        )}
        {tab === 'tasks' && (
          <TasksPage
            courses={courses} tasks={tasks}
            onAddTask={() => setTaskSheet('new')} onEditTask={setTaskSheet}
          />
        )}
      </main>

      <button
        className="gear"
        aria-label="設置"
        onClick={() => setShowSettings(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.1 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" />
        </svg>
      </button>

      <BottomNav tab={tab} onChange={setTab} />

      <CourseSheet
        course={sheetCourse} tasks={tasks} settings={settings}
        onClose={() => setSheetCourse(null)}
        onEditCourse={(c) => { setSheetCourse(null); setCourseEditor(c); }}
        onEditTask={setTaskSheet}
      />

      {showSettings && (
        <SettingsPage
          courses={courses} settings={settings}
          onClose={() => setShowSettings(false)}
          onEditCourse={setCourseEditor}
        />
      )}

      {courseEditor !== false && (
        <CourseEditor
          course={courseEditor === 'new' ? null : courseEditor}
          courses={courses}
          onClose={() => setCourseEditor(false)}
        />
      )}

      {taskSheet && (
        <TaskSheet
          task={editingTask}
          courses={courses}
          onClose={() => setTaskSheet(null)}
        />
      )}
    </div>
  );
}
