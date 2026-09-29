// 原創像素蟹 — 16×14 網格手繪（§13.1 授權紅線：零素材拷貝，僅行為概念借鑑）
// 色板：B=本體 #DE886D · D=深 #C96A4B · W=眼白 · I=瞳 · K=暗部/腿
const PALETTE = { B: '#DE886D', D: '#C96A4B', W: '#FBF8F4', I: '#221E19', K: '#8A4A34' };

const BASE = [
  '................',
  '....DD....DD....',
  '...DBBD..DBBD...',
  '...DBBD..DBBD...',
  '..DDDDDDDDDDDD..',
  '.DBBWWDBBDWWDBD.',
  '.DBWIDBBDDBWIDBD',
  '.DBBWWDBBDWWDBD.',
  'DDBBBBBBBBBBBBDD',
  'DBDBBBBBBBBBBBBD',
  'DDBDBDDDDDDDBDBD',
  '.DDBDBBBBBBBDBD.',
  '..K.K.K..K.K.K..',
  '.KK.K.K..K.K.KK.',
];

// 閉眼（睡/眨眼幀）
const EYES_CLOSED = BASE.map((row) =>
  row.replace(/WID|DIW|WIW/g, (m) => (m.includes('I') ? 'DDD' : m)).replace(/W/g, 'D'),
);

// 歡慶：鉗子舉高 + 眼睛彎月
const CHEER = [
  '..DD........DD..',
  '.DBBD......DBBD.',
  '.DBBD......DBBD.',
  '..DDDDDDDDDDDD..',
  '.DBBWWDBBDWWDBD.',
  '.DBWIDBBDDBWIDBD',
  '.DBBWWDBBDWWDBD.',
  'DDBBBBBBBBBBBBDD',
  'DBDBBBBBBBBBBBBD',
  'DBDBBBBBBBBBBBBD',
  'DDBDBDDDDDDDBDBD',
  '.DDBDBBBBBBBDBD.',
  '..K.K.K..K.K.K..',
  '.KK.K.K..K.K.KK.',
];

function toRects(rows) {
  const rects = [];
  rows.forEach((row, y) => {
    let run = null;
    for (let x = 0; x <= row.length; x++) {
      const c = row[x];
      if (c !== '.' && c !== undefined) {
        if (run && run.c === c && run.x + run.w === x) run.w += 1;
        else { if (run) rects.push(run); run = { c, x, y, w: 1 }; }
      } else if (run) { rects.push(run); run = null; }
    }
  });
  return rects.map(({ c, x, y, w }) => ({ fill: PALETTE[c], x, y, w }));
}

const ART = {
  base: toRects(BASE),
  blink: toRects(EYES_CLOSED),
  cheer: toRects(CHEER),
};

// 像素蟹本體。frame: 0/1（兩幀律動）；state 決定附加元素
export default function PixelCrab({ state = 'idle', frame = 0, sign = null }) {
  const squash = state === 'poke' ? 0.82 : 1;
  const bodyArt =
    state === 'celebrate' ? ART.cheer
    : state === 'sleep' ? ART.blink
    : frame === 1 ? ART.blink
    : ART.base;

  return (
    <svg
      width="72"
      height="72"
      viewBox="-4 -14 24 28"
      shapeRendering="crispEdges"
      aria-hidden
      style={{ transform: `scaleY(${squash})`, transformOrigin: '50% 100%', transition: 'transform .12s' }}
    >
      {/* 舉牌：下節課前 10 分鐘 */}
      {state === 'sign' && sign && (
        <g>
          <rect x="-2" y="-13" width="20" height="6" rx="1" fill="#FBF8F4" stroke="#E8E2DA" strokeWidth="0.4" />
          <rect x="7.4" y="-7" width="1.2" height="2" fill="#C96A4B" />
          <text x="8" y="-9.2" textAnchor="middle" fontSize="3.4" fill="#221E19" style={{ font: '3.4px sans-serif' }}>
            {sign.line1}
          </text>
          <text x="8" y="-5.9" textAnchor="middle" fontSize="3" fill="#6E6860" style={{ font: '3px sans-serif' }}>
            {sign.line2}
          </text>
        </g>
      )}

      {/* 掃地：今日無課 */}
      {state === 'sweep' && (
        <g>
          <rect x="-3.5" y="9" width="1" height="7" fill="#8A4A34" transform={frame === 1 ? 'rotate(-8 -3 12)' : 'rotate(8 -3 12)'} />
          <rect x="-5.5" y="15.4" width="5" height="1.6" fill="#C96A4B" transform={frame === 1 ? 'rotate(-8 -3 12)' : 'rotate(8 -3 12)'} />
        </g>
      )}

      {/* 睡覺：Zzz（角色素材內部色彩，允許淺藍） */}
      {state === 'sleep' && (
        <g fill="#9DB8C9" style={{ font: '4px sans-serif' }}>
          <text x="15" y="-8">z</text>
          <text x="17.5" y="-11.5">z</text>
        </g>
      )}

      {/* 慶祝：星光 */}
      {state === 'celebrate' && (
        <g fill="#F2C14E">
          <rect x="0" y="-10" width="1" height="1" />
          <rect x="14" y="-6" width="1" height="1" />
          <rect x="17" y="-12" width="1.4" height="1.4" />
        </g>
      )}

      {bodyArt.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />
      ))}
    </svg>
  );
}
