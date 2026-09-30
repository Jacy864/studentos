// UI 狀態持久化（非業務資料，§5 的 localStorage 禁令不涉此）：
//   hash        → 深鏈/分享/瀏覽器刷新還原（#schedule/w10/wed）
//   localStorage → PWA 從桌面冷啟（start_url 不帶 hash）時還原上次畫面
export const TABS = ['today', 'schedule', 'tasks'];

const UI_KEY = 'studentos:ui'; // { tab, settings }（settings = 齒輪頁是否開著）
const SCHED_KEY = 'studentos:sched'; // { week, day }

const readLS = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; }
};
const writeLS = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 隱私模式等，靜默降級 */ }
};
const hashSegs = () => location.hash.replace(/^#/, '').split('/').filter(Boolean);

export function initialTab() {
  const [h] = hashSegs();
  if (TABS.includes(h)) return h;
  const s = readLS(UI_KEY);
  return s && TABS.includes(s.tab) ? s.tab : 'today';
}

export function initialSettings() {
  return Boolean(readLS(UI_KEY)?.settings);
}

// tab 寫入：LS 永遠寫；hash 在 schedule 時讓權給 SchedulePage 帶 w/d 段寫全
// （子 effect 先於父 effect 執行，這裡若也寫會把段清掉）
export function rememberTab(tab, settingsOpen = false) {
  writeLS(UI_KEY, { tab, settings: settingsOpen });
  if (tab !== 'schedule') history.replaceState(null, '', `#${tab}`);
}

// { week?, day? }：hash 段優先，其次 LS；都不在交回調用方用當天默認
export function readSched() {
  const [, hw, hd] = hashSegs();
  const s = readLS(SCHED_KEY) || {};
  return {
    week: parseInt(hw?.slice(1), 10) || s.week || null,
    day: parseInt(hd?.slice(1), 10) || s.day || null,
  };
}

// 唯一調用方是 SchedulePage（僅掛載於 schedule tab），無條件寫 hash：
// 舊版守衛 hash.startsWith('#schedule') 會與 rememberTab 的讓權形成死鎖——
// 從其他 tab 點進 Schedule 時 hash 仍是舊 tab，導致刷新彈回首頁
export function rememberSched(week, day) {
  writeLS(SCHED_KEY, { week, day });
  history.replaceState(null, '', `#schedule/w${week}/d${day}`);
}
