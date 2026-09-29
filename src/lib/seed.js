// 真實課程 seed — 任務書 §4 原文。5 門課 10 學分，禁止虛構第 6 門。
// 課名保留簡體原文；教室/地點未知的填 null，不造假。
export const SEED = {
  version: 1,
  settings: {
    semesterStart: '2026-09-07',
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
  ],
  tasks: [],
};
