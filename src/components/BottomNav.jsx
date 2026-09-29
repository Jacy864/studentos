// 底部導航 — 三個 tab（§6）。Tiffany = 位置與狀態。
const TABS = [
  { key: 'today', label: 'Today', icon: 'M7 2v3M17 2v3M3.5 9h17M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z' },
  { key: 'schedule', label: 'Schedule', icon: 'M4 5h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5ZM4 9h16M9 3v4M15 3v4M8 13h3M8 17h6' },
  { key: 'tasks', label: 'Tasks', icon: 'M4 7l2.5 2.5L11 5M4 17l2.5 2.5L11 15M14 7h6M14 17h6' },
];

export default function BottomNav({ tab, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={`bottom-nav__item${tab === t.key ? ' is-active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={t.icon} />
          </svg>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
