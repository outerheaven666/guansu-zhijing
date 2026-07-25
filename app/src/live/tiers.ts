/**
 * 礼物分档 → 差异化文化内容服务 映射层
 *
 * 定位红线：交付物全部是「文化内容」，不提供任何预测/命理服务。
 * 抖音平台对封建迷信类直播内容严格管控，礼物对应的服务只能是
 * 节气文化卡、经典引文签、叙事练习等合规内容。
 */

import { QUOTES, type Quote, type Theme } from '../shared/quotes';

export interface GiftTier {
  id: string;
  name: string;          // 档位名
  minDiamond: number;    // 抖币下限（含）
  maxDiamond: number;    // 抖币上限（含，Infinity 封顶）
  examples: string;      // 典型礼物示例
  serviceName: string;   // 签品名
  serviceDesc: string;   // 交付内容说明
  displaySeconds: number; // 上屏展示时长
  perks: string[];       // 权益清单
}

export const GIFT_TIERS: GiftTier[] = [
  {
    id: 't1',
    name: '入门礼',
    minDiamond: 1,
    maxDiamond: 49,
    examples: '小心心 / 玫瑰 / 啤酒',
    serviceName: '节气签',
    serviceDesc: '当令节气文化卡：昵称入卡，含干支、三候、民俗与诗句',
    displaySeconds: 12,
    perks: ['专属昵称节气卡 ×1', '上屏展示 12 秒'],
  },
  {
    id: 't2',
    name: '进阶礼',
    minDiamond: 50,
    maxDiamond: 199,
    examples: '你真好看 / 墨镜',
    serviceName: '执镜签',
    serviceDesc: '经典引文签：按本周直播主题，抽一条庄子/道德经/孙子/毛选原文，附出处、镜问与小实验',
    displaySeconds: 18,
    perks: ['专属昵称引文签 ×1', '含出处 + 镜问 + 小实验', '上屏展示 18 秒'],
  },
  {
    id: 't3',
    name: '高阶礼',
    minDiamond: 200,
    maxDiamond: 999,
    examples: '热气球 / 浪漫马车',
    serviceName: '双镜签',
    serviceDesc: '节气签 + 执镜签双卡，加赠本年五运六气文化解读（医史视角，非医疗建议）',
    displaySeconds: 30,
    perks: ['节气签 ×1', '执镜签 ×1', '年度运气文化卡 ×1', '上屏展示 30 秒', '主播口播致谢'],
  },
  {
    id: 't4',
    name: '典藏礼',
    minDiamond: 1000,
    maxDiamond: Infinity,
    examples: '火箭 / 嘉年华',
    serviceName: '典藏签',
    serviceDesc: '全套三卡 +《断语叙事练习》精选三问（自我叙事练习，不做推算）',
    displaySeconds: 60,
    perks: ['全套三卡', '叙事练习精选 ×3', '上屏展示 60 秒', '主播口播致谢', '名字入当周「知音榜」'],
  },
];

export function tierOfDiamond(diamond: number): GiftTier {
  return GIFT_TIERS.find((t) => diamond >= t.minDiamond && diamond <= t.maxDiamond) ?? GIFT_TIERS[0];
}

/** 打赏分成估算（元）：1 元 ≈ 10 抖币；个人主播通常约为打赏流水的 50%（平台分成后，公会另计） */
export function estimatePayoutYuan(diamond: number, share = 0.5): number {
  return (diamond / 10) * share;
}

export interface LiveThemeConfig {
  /** 本周直播主题：决定执镜签抽哪类引文 */
  theme: Theme;
  themeLabel: string;
}

/** 执镜签抽签：按主题确定性抽取（昵称做种子，同一昵称同一主题得到同一条，可复现可截图核对） */
export function drawQuoteFor(nickname: string, theme: Theme, salt = ''): Quote {
  const pool = QUOTES.filter((q) => q.themes.includes(theme));
  const list = pool.length > 0 ? pool : QUOTES;
  let h = 0;
  const s = `${nickname}::${theme}::${salt}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

/** 当令节气（按公历月份就近取，用于节气签；节气在公历中日期稳定，每月 6 日与 21 日前后各一个） */
export function currentTermName(date = new Date()): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const approx = [
    ['小寒', 1, 6], ['大寒', 1, 20], ['立春', 2, 4], ['雨水', 2, 19],
    ['惊蛰', 3, 6], ['春分', 3, 21], ['清明', 4, 5], ['谷雨', 4, 20],
    ['立夏', 5, 6], ['小满', 5, 21], ['芒种', 6, 6], ['夏至', 6, 21],
    ['小暑', 7, 7], ['大暑', 7, 23], ['立秋', 8, 8], ['处暑', 8, 23],
    ['白露', 9, 8], ['秋分', 9, 23], ['寒露', 10, 8], ['霜降', 10, 23],
    ['立冬', 11, 8], ['小雪', 11, 22], ['大雪', 12, 7], ['冬至', 12, 22],
  ] as Array<[string, number, number]>;
  let picked: [string, number, number] = approx[0];
  for (const t of approx) {
    if (m > t[1] || (m === t[1] && d >= t[2])) picked = t;
  }
  return picked[0];
}
