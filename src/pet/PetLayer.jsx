// 桌寵容器：狀態機 + 互動（戳/拖拽/漫遊）。獨立模組不侵入業務代碼（§13.4）
import { useEffect, useRef, useState } from 'react';
import PixelCrab from './pixelCrab.jsx';
import { petScheduleState } from './petState.js';
import { todayStr, weekdayToday } from '../lib/week.js';

const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function PetLayer({ courses, settings }) {
  const [scheduleState, setScheduleState] = useState({ state: 'idle' });
  const [mood, setMood] = useState(null); // poke | celebrate（短暫覆蓋）
  const [frame, setFrame] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(null);

  // 每 30 秒重算日程聯動狀態
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setScheduleState(petScheduleState({
        courses, settings,
        dateStr: todayStr(),
        weekday: weekdayToday(),
        minutes: n.getHours() * 60 + n.getMinutes(),
      }));
    };
    tick();
    const iv = setInterval(tick, 30000);
    return () => clearInterval(iv);
  }, [courses, settings]);

  // 兩幀律動 + 漫遊（尊重 prefers-reduced-motion：靜態站立）
  useEffect(() => {
    if (REDUCED) return;
    const iv = setInterval(() => setFrame((f) => 1 - f), 700);
    const wander = setInterval(() => {
      if (dragging.current) return;
      setPos({ x: Math.round(Math.random() * 60 - 30), y: Math.round(Math.random() * 12 - 6) });
    }, 7000);
    return () => { clearInterval(iv); clearInterval(wander); };
  }, []);

  // 勾掉任務 → 慶祝（§13.3）
  useEffect(() => {
    const on = () => {
      setMood('celebrate');
      setTimeout(() => setMood(null), 1400);
    };
    window.addEventListener('studentos:task-done', on);
    return () => window.removeEventListener('studentos:task-done', on);
  }, []);

  const state = mood || scheduleState.state;

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = { x: e.clientX, y: e.clientY, base: pos };
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const d = dragging.current;
    setPos({ x: d.base.x + e.clientX - d.x, y: d.base.y + e.clientY - d.y });
  };
  const onPointerUp = () => { dragging.current = null; };
  const onClick = () => {
    if (REDUCED) return;
    setMood('poke');
    setTimeout(() => setMood(null), 650);
  };

  return (
    <div className="pet" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
      <div
        className="pet__hit"
        role="button"
        aria-label="小螃蟹"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onClick}
      >
        <PixelCrab state={state} frame={frame} sign={scheduleState.sign} />
      </div>
    </div>
  );
}
