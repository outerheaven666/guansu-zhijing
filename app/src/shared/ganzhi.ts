/**
 * 干支历法计算（民俗文化用途）
 *
 * 设计说明：
 * - 日柱：以儒略日数（JDN）精确推排，锚点 1949-10-01 为甲子日。
 * - 年柱：以立春为岁首（民俗命理传统），非正月初一。
 * - 月柱：以十二「节」（立春、惊蛰……小寒）换月。
 * - 节气日期：采用 1901–2100 年通用近似公式 ⌊Y×D+C⌋−⌊(Y−1)/4⌋，
 *   个别年份可能有一日误差，民俗演示够用；精确时刻以权威历书为准。
 */

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const;

export const STEM_ELEMENTS = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'] as const;
export const BRANCH_ELEMENTS = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'] as const;

export function jiaziName(index: number): string {
  const i = ((index % 60) + 60) % 60;
  return STEMS[i % 10] + BRANCHES[i % 12];
}

/** 公历日期 → 儒略日数（正午起算，整数部分） */
export function jdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * m2 + 2) / 5) +
    365 * y2 +
    Math.floor(y2 / 4) -
    Math.floor(y2 / 100) +
    Math.floor(y2 / 400) -
    32045
  );
}

const ANCHOR_JDN = jdn(1949, 10, 1); // 甲子日

/** 日柱 index（0 = 甲子） */
export function dayGanzhiIndex(y: number, m: number, d: number): number {
  return (((jdn(y, m, d) - ANCHOR_JDN) % 60) + 60) % 60;
}

export interface SolarTerm {
  name: string;
  month: number;
  day: number;
  approximate: boolean;
}

/** 21 世纪（2001–2100）C 值表；20 世纪（1901–2000）多数 +1 */
const TERM_DEFS: Array<{ name: string; month: number; c21: number }> = [
  { name: '小寒', month: 1, c21: 6.11 },
  { name: '大寒', month: 1, c21: 20.84 },
  { name: '立春', month: 2, c21: 3.87 },
  { name: '雨水', month: 2, c21: 18.73 },
  { name: '惊蛰', month: 3, c21: 5.63 },
  { name: '春分', month: 3, c21: 20.646 },
  { name: '清明', month: 4, c21: 4.81 },
  { name: '谷雨', month: 4, c21: 20.1 },
  { name: '立夏', month: 5, c21: 5.52 },
  { name: '小满', month: 5, c21: 21.04 },
  { name: '芒种', month: 6, c21: 5.678 },
  { name: '夏至', month: 6, c21: 21.37 },
  { name: '小暑', month: 7, c21: 7.108 },
  { name: '大暑', month: 7, c21: 22.83 },
  { name: '立秋', month: 8, c21: 7.5 },
  { name: '处暑', month: 8, c21: 23.13 },
  { name: '白露', month: 9, c21: 7.646 },
  { name: '秋分', month: 9, c21: 23.042 },
  { name: '寒露', month: 10, c21: 8.318 },
  { name: '霜降', month: 10, c21: 23.438 },
  { name: '立冬', month: 11, c21: 7.438 },
  { name: '小雪', month: 11, c21: 22.36 },
  { name: '大雪', month: 12, c21: 7.18 },
  { name: '冬至', month: 12, c21: 21.94 },
];

/** 计算某年全部节气（近似公式，1901–2100 较可靠） */
export function solarTermsOfYear(year: number): SolarTerm[] {
  const inRange = year >= 1901 && year <= 2100;
  const Y = ((year % 100) + 100) % 100;
  const cAdjust = year <= 2000 ? 1 : 0;
  return TERM_DEFS.map((t) => {
    // 闰年的 2 月 29 日只影响 3 月及以后的节气
    const L = t.month <= 2 ? Math.floor((Y - 1) / 4) : Math.floor(Y / 4);
    return {
      name: t.name,
      month: t.month,
      day: Math.floor(Y * 0.2422 + t.c21 + cAdjust) - L,
      approximate: !inRange,
    };
  });
}

function termDay(year: number, termName: string): { month: number; day: number } {
  const t = solarTermsOfYear(year).find((x) => x.name === termName)!;
  return { month: t.month, day: t.day };
}

function beforeOrOn(m: number, d: number, ref: { month: number; day: number }): boolean {
  return m < ref.month || (m === ref.month && d < ref.day);
}

/** 年柱：立春换岁 */
export function yearGanzhiIndex(y: number, m: number, d: number): number {
  const lichun = termDay(y, '立春');
  const effectiveYear = beforeOrOn(m, d, lichun) ? y - 1 : y;
  // 公元 4 年为甲子
  return (((effectiveYear - 4) % 60) + 60) % 60;
}

/** 月柱：十二节换月。返回 { index, branchName } */
export function monthGanzhiIndex(y: number, m: number, d: number): { index: number; branch: string } {
  // 「节」序列（年内按时间先后）：立春(寅) 惊蛰(卯) 清明(辰) 立夏(巳) 芒种(午) 小暑(未)
  //   立秋(申) 白露(酉) 寒露(戌) 立冬(亥) 大雪(子)
  // 小寒在次年 1 月，不参与年内循环；立春前的日期由下方 -1 分支单独处理。
  const JIE = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪'];
  // 确定当前处于哪个节之后
  let jieIndex = -1; // -1 表示尚未到本年立春
  for (let i = 0; i < JIE.length; i++) {
    const t = termDay(y, JIE[i]);
    if (!beforeOrOn(m, d, t)) jieIndex = i;
  }
  // 月份序号：寅月 = 0
  let monthOffset: number;
  let yearIdx: number;
  if (jieIndex === -1) {
    // 立春前：属于上一年的子月(大雪后)或丑月(小寒后)
    const xiaohan = termDay(y, '小寒');
    monthOffset = beforeOrOn(m, d, xiaohan) ? 10 : 11; // 子月 or 丑月
    yearIdx = yearGanzhiIndex(y - 1, 12, 31);
  } else {
    monthOffset = jieIndex; // 立春=0(寅月) ... 大雪=10(子月)
    yearIdx = yearGanzhiIndex(y, m, d);
  }
  const yearStem = yearIdx % 10;
  const monthStem = (yearStem * 2 + 2 + monthOffset) % 10;
  const branchIndex = (2 + monthOffset) % 12; // 寅 = 2
  // 找同时满足天干、地支的 60 甲子序号
  let idx = 0;
  for (let i = 0; i < 60; i++) {
    if (i % 10 === monthStem && i % 12 === branchIndex) {
      idx = i;
      break;
    }
  }
  return { index: idx, branch: BRANCHES[branchIndex] };
}

export interface CalendarReading {
  year: number;
  month: number;
  day: number;
  weekday: string;
  yearPillar: string;
  yearZodiac: string;
  yearElement: string;
  monthPillar: string;
  monthBranch: string;
  dayPillar: string;
  dayElement: string;
  prevTerm: SolarTerm | null;
  nextTerm: SolarTerm | null;
  daysToNext: number | null;
  approximate: boolean;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 历法解释器主入口 */
export function readCalendar(y: number, m: number, d: number): CalendarReading {
  const yearIdx = yearGanzhiIndex(y, m, d);
  const monthGz = monthGanzhiIndex(y, m, d);
  const dayIdx = dayGanzhiIndex(y, m, d);
  const weekday = '星期' + WEEKDAYS[new Date(y, m - 1, d).getDay()];

  // 上一/下一节气（跨年查找）
  const terms = [
    ...solarTermsOfYear(y - 1).map((t) => ({ ...t, year: y - 1 })),
    ...solarTermsOfYear(y).map((t) => ({ ...t, year: y })),
    ...solarTermsOfYear(y + 1).map((t) => ({ ...t, year: y + 1 })),
  ].sort((a, b) => jdn(a.year, a.month, a.day) - jdn(b.year, b.month, b.day));
  const today = jdn(y, m, d);
  let prevTerm: (SolarTerm & { year: number }) | null = null;
  let nextTerm: (SolarTerm & { year: number }) | null = null;
  for (const t of terms) {
    const tj = jdn(t.year, t.month, t.day);
    if (tj <= today) prevTerm = t;
    if (tj > today) {
      nextTerm = t;
      break;
    }
  }

  return {
    year: y,
    month: m,
    day: d,
    weekday,
    yearPillar: jiaziName(yearIdx),
    yearZodiac: ZODIAC[yearIdx % 12],
    yearElement: STEM_ELEMENTS[yearIdx % 10],
    monthPillar: jiaziName(monthGz.index),
    monthBranch: monthGz.branch,
    dayPillar: jiaziName(dayIdx),
    dayElement: STEM_ELEMENTS[dayIdx % 10],
    prevTerm,
    nextTerm,
    daysToNext: nextTerm ? jdn(nextTerm.year!, nextTerm.month, nextTerm.day) - today : null,
    approximate: y < 1901 || y > 2100,
  };
}
