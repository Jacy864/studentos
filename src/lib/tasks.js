// 任務的純函數（v4.1）：課程任務縮排 + 防手滑重複創建。
// 選擇器放純函數裡，方便單測；組件只負責渲染。

// 某門課的未完成任務，按期限升序（無期限墊後）
export function openTasksOf(tasks, courseId) {
  return tasks
    .filter((t) => t.courseId === courseId && !t.completed)
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
}

// 週總覽用：課程在這一週的任務只掛在第一次出現那天（後續天不重複，保持總覽緊湊）
// weekCourseIds = 本週已經掛過任務的課程 id 集合（函數內會登記，調用方每週重置）
export function takeWeekFirst(tasks, courseId, weekCourseIds) {
  if (weekCourseIds.has(courseId)) return [];
  weekCourseIds.add(courseId);
  return openTasksOf(tasks, courseId);
}

// 新建任務防重複：同一標題+課程+期限，且剛創建不久（默認 10 秒內）→ 視為手滑連點
export function isRecentDuplicate(tasks, draft, now = Date.now(), windowMs = 10_000) {
  return tasks.some(
    (t) =>
      !t.completed &&
      t.title === draft.title &&
      (t.courseId || null) === (draft.courseId || null) &&
      (t.dueDate || null) === (draft.dueDate || null) &&
      now - new Date(t.createdAt).getTime() < windowMs,
  );
}
