// 真實課程 seed — 2026-10-18 v2：身體課（週 3-7）已結課；10/10 正選入手格物 3 班（週 8-13）。
// 課名保留簡體原文；教室/學分未知的填 null，不造假（格物學分系統未存證，開課後可編輯補上）。

// v2 新增（2026-10-18）：形式基礎一（格物）3 班，10/10 正選到手（autofire.log 實錄）。
// 排課：週 8-13、週一到週四 1-4 節（與身體課同時段積木輪換，kclb=2 目錄實據）。
// v3 補教室：16號樓104（2026-10-19 開課日言實地確認）；teacher=郑筱莹（plan.json）；學分未知 → null 不造假。
// 獨立命名導出：老用戶的庫不是空庫，seed 寫不進去，db.js migrate() 用它補課。
export const GEWU_COURSE = {
  id: 'c6', name: '形式基础一（格物）3班', teacher: '郑筱莹', credits: null,
  classroom: '16號樓104', department: '專業基礎教學部',
  schedules: [
    { weekday: 1, startPeriod: 1, endPeriod: 4, weeks: [{ start: 8, end: 13 }] },
    { weekday: 2, startPeriod: 1, endPeriod: 4, weeks: [{ start: 8, end: 13 }] },
    { weekday: 3, startPeriod: 1, endPeriod: 4, weeks: [{ start: 8, end: 13 }] },
    { weekday: 4, startPeriod: 1, endPeriod: 4, weeks: [{ start: 8, end: 13 }] },
  ],
};

export const SEED = {
  version: 3,
  settings: {
    // 教學第 1 週 = 2026-08-31（週一）。實證：筆記 9/15（第 3 週週二）已是身體課第一週，
    // 且 9/10 主科輪選課、9/14 上課的時間線吻合；9/7 是報到/軍訓，不是教學週起點（v1 錯值）。
    semesterStart: '2026-08-31',
    periodTimes: [
      { period: 1, start: '08:30', end: '09:15' },
      { period: 2, start: '09:15', end: '10:00' },
      { period: 3, start: '10:10', end: '10:55' },
      { period: 4, start: '10:55', end: '11:40' },
      { period: 5, start: '13:00', end: '13:45' },
      { period: 6, start: '13:45', end: '14:30' },
      { period: 7, start: '14:40', end: '15:25' },
      { period: 8, start: '15:25', end: '16:10' },
      { period: 9, start: '18:00', end: '18:45', evening: true },
      { period: 10, start: '18:45', end: '19:30', evening: true },
      { period: 11, start: '19:45', end: '20:30', evening: true },
      { period: 12, start: '20:30', end: '21:15', evening: true },
    ],
  },
  courses: [
    {
      id: 'c1', name: '造型基礎（身體）', teacher: '扈奕飛、李轶军、倪菊华', credits: 3.0,
      classroom: null, department: null,
      schedules: [
        { weekday: 1, startPeriod: 1, endPeriod: 4, weeks: [{ start: 3, end: 7 }], classroom: '線上', note: '線上技術基礎' },
        { weekday: 2, startPeriod: 1, endPeriod: 4, weeks: [{ start: 3, end: 7 }], classroom: '良渚18號樓118' },
        { weekday: 3, startPeriod: 1, endPeriod: 4, weeks: [{ start: 3, end: 7 }], classroom: '良渚18號樓118' },
        { weekday: 4, startPeriod: 1, endPeriod: 4, weeks: [{ start: 3, end: 7 }], classroom: '良渚18號樓118' },
      ],
    },
    {
      id: 'c2', name: '大学英语1', teacher: '张瑜', credits: 2.0,
      classroom: null, department: '藝術管理與教育學院',
      schedules: [{ weekday: 1, startPeriod: 5, endPeriod: 6, weeks: [{ start: 3, end: 17 }] }],
    },
    {
      id: 'c3', name: '大学生心理健康', teacher: '蒋惠君', credits: 2.0,
      classroom: null, department: null,
      schedules: [{ weekday: 2, startPeriod: 5, endPeriod: 6, weeks: [{ start: 3, end: 17 }] }],
    },
    {
      id: 'c4', name: '19世纪末20世纪初的世界文化格局', teacher: '刘曲', credits: 2.0,
      classroom: null, department: '專業基礎教學部',
      schedules: [{ weekday: 3, startPeriod: 5, endPeriod: 8, weeks: [{ start: 10, end: 17 }] }],
    },
    {
      id: 'c5', name: '体育1', teacher: '方明克', credits: 1.0,
      classroom: '体育馆2', department: null,
      schedules: [{ weekday: 4, startPeriod: 7, endPeriod: 8, weeks: [{ start: 3, end: 17 }] }],
    },
    GEWU_COURSE,
  ],
  tasks: [],
};
