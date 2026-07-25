/**
 * 定局 · 数据模型与规则引擎（首版：本地规则，不接大模型 —— PRD §2/§7）
 * 全部数据仅存浏览器 localStorage，默认私密（PRD §11 数据边界）。
 */

import { detectCrisis, type CrisisHit } from '../shared/engine';
import { SCENE_LABELS, type Scene } from './lenses';

export type EntryType = 'fact' | 'feeling' | 'assumption' | 'rumor' | 'wish' | 'unknown';
export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  fact: '事实',
  feeling: '感受',
  assumption: '假设',
  rumor: '传闻',
  wish: '愿望',
  unknown: '未知',
};

export interface Entry {
  id: string;
  text: string;
  type: EntryType;
}

export type PathKey = 'A' | 'B' | 'C' | 'D';
export const PATH_NAMES: Record<PathKey, string> = { A: '进攻', B: '等待', C: '撤退', D: '换局' };

export interface PathOption {
  key: PathKey;
  winRate: number; // 0-100 主观胜率
  cost: string;
  reversibility: string;
  trigger: string;
}

export type Attribution = 'fact' | 'judgment' | 'execution' | 'environment' | 'luck';
export const ATTRIBUTION_LABELS: Record<Attribution, string> = {
  fact: '事实误差',
  judgment: '判断误差',
  execution: '执行误差',
  environment: '环境变化',
  luck: '运气噪声',
};

export interface Review {
  result: string;
  attribution: Attribution;
  principle: string;
  at: number;
}

export interface Decision {
  id: string;
  title: string;
  scene: Scene;
  what: string;   // 发生什么
  want: string;   // 你想要什么
  fear: string;   // 你怕什么
  deadline: string;
  reversibility: string;
  maxLoss: string;
  entries: Entry[];
  lensNotes: Record<string, string>; // lensId → 用户回答
  paths: PathOption[];
  dontList: string[];
  minAction: string;
  successSignal: string;
  stopSignal: string;
  status: 'active' | 'archived';
  createdAt: number;
  review7?: Review;
  review30?: Review;
}

export interface Principle {
  id: string;
  text: string;
  fromDecisionId: string;
  fromTitle: string;
  attribution: Attribution;
  at: number;
}

/* ================= 场景识别 ================= */

const SCENE_WORDS: Record<Scene, string[]> = {
  career: ['跳槽', '辞职', '离职', '创业', '转型', 'offer', '合伙', '裁员', '晋升', '副业', '开店', '项目', '入职', '转行', '自由职业', '融资'],
  negotiation: ['谈判', '谈薪', '薪资', '竞价', '竞标', '价格战', '对手', '竞争', '合同', '条款', '股权', '客户', '压价', '报价', '博弈', '分成'],
  relationship: ['边界', '借钱', '散伙', '家人', '父母', '伴侣', '翻脸', '拒绝', '人情', '催婚', '婆媳', '室友', '朋友', '亲戚', '恋人', '分手'],
};

export function detectScene(text: string): { scene: Scene; hits: string[] } {
  let best: Scene = 'career';
  let bestHits: string[] = [];
  for (const [scene, words] of Object.entries(SCENE_WORDS) as Array<[Scene, string[]]>) {
    const hits = words.filter((w) => text.includes(w));
    if (hits.length > bestHits.length) {
      best = scene;
      bestHits = hits;
    }
  }
  return { scene: best, hits: bestHits };
}

/* ================= 事实分层启发式 ================= */

const FEELING_WORDS = ['我觉得', '感觉', '担心', '害怕', '焦虑', '难受', '烦', '怕', '心慌', '委屈', '开心', '不甘'];
const RUMOR_WORDS = ['听说', '据说', '他们说', '有人说', '网上说', '大家都', '传言'];
const WISH_WORDS = ['希望', '最好是', '要是能', '如果能', '真想', '巴不得'];
const UNKNOWN_WORDS = ['不知道', '不确定', '没问过', '没查过', '不清楚', '还没了解', '存疑'];
const ASSUMPTION_WORDS = ['应该', '肯定', '一定', '估计', '大概', '想必', '八成', '可能', '我觉得会'];

export function classifySentence(text: string): EntryType {
  if (FEELING_WORDS.some((w) => text.includes(w))) return 'feeling';
  if (RUMOR_WORDS.some((w) => text.includes(w))) return 'rumor';
  if (WISH_WORDS.some((w) => text.includes(w))) return 'wish';
  if (UNKNOWN_WORDS.some((w) => text.includes(w))) return 'unknown';
  if (ASSUMPTION_WORDS.some((w) => text.includes(w))) return 'assumption';
  // 含数字/日期/百分比的句子倾向为事实
  if (/[0-9０-９%％]|昨天|上周|上个月|去年/.test(text)) return 'fact';
  return 'fact';
}

/** 把长文本拆成句子并预分类 */
export function splitAndClassify(text: string): Array<{ text: string; type: EntryType }> {
  return text
    .split(/[。；;！!？?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .map((s) => ({ text: s, type: classifySentence(s) }));
}

/* ================= 红线（复用执镜护栏 + 决策场景增补） ================= */

const DECISION_RED_WORDS = ['梭哈', '全仓', '加仓', '杠杆', '借钱投资', '贷款创业', '抵押房子', '孤注一掷', '网贷创业'];

export interface DecisionRedFlag {
  kind: 'crisis' | 'investment';
  label: string;
  keyword: string;
  crisis?: CrisisHit;
}

export function checkDecisionRedFlags(text: string): DecisionRedFlag | null {
  const crisis = detectCrisis(text);
  if (crisis) return { kind: 'crisis', label: crisis.categoryLabel, keyword: crisis.keyword, crisis };
  for (const w of DECISION_RED_WORDS) {
    if (text.includes(w)) {
      return { kind: 'investment', label: '高风险财务动作', keyword: w };
    }
  }
  return null;
}

export const INVESTMENT_RED_NOTICE = {
  title: '检测到高风险财务动作信号',
  body: '「孤注一掷」不是决策，是情绪的具名。定局不会为全仓、杠杆、借贷投入提供框架建议——这类动作的伤害一旦发生不可逆。请先拆出「输了会怎样」，并咨询专业财务人士。',
  rules: ['任何「输不起」的钱不进场：生活费、借款、他人物业。', '如果仍要考虑，把最大可承受损失写成具体数字，再回来走决策流程。'],
};

/* ================= 复盘到期 ================= */

const DAY = 24 * 3600 * 1000;
export function reviewDue(d: Decision): '7' | '30' | null {
  const now = Date.now();
  if (!d.review7 && now >= d.createdAt + 7 * DAY) return '7';
  if (!d.review30 && now >= d.createdAt + 30 * DAY) return '30';
  return null;
}

/* ================= 一页纸输出（PRD §10 模板） ================= */

export function onePageMarkdown(d: Decision): string {
  const facts = d.entries.filter((e) => e.type === 'fact').map((e) => `- ${e.text}`);
  const assumptions = d.entries.filter((e) => ['assumption', 'rumor', 'wish'].includes(e.type)).map((e) => `- [${ENTRY_TYPE_LABELS[e.type as EntryType]}] ${e.text}`);
  const unknowns = d.entries.filter((e) => e.type === 'unknown').map((e) => `- ${e.text}`);
  const pathLine = (p: PathOption) =>
    `${p.key} ${PATH_NAMES[p.key]}：胜率 ${p.winRate}% ｜ 成本：${p.cost || '—'} ｜ 可逆性：${p.reversibility || '—'} ｜ 触发条件：${p.trigger || '—'}`;

  return `# 决策：${d.title}
场景：${SCENE_LABELS[d.scene]} ｜ 期限：${d.deadline || '—'} ｜ 可逆性：${d.reversibility || '—'} ｜ 最大可承受损失：${d.maxLoss || '—'}

## 1) 局面判断
- 主要矛盾：${d.lensNotes['mao-maodun'] || '（未填写）'}
- 被高估的变量：${d.lensNotes['zz-feizhi'] || d.lensNotes['yj-wei'] || '（未填写）'}
- 被低估的风险：${d.lensNotes['yj-xian'] || d.lensNotes['sz-xiansheng'] || '（未填写）'}

## 2) 事实/假设
- 已证实事实：
${facts.length ? facts.join('\n') : '- （无）'}
- 关键假设：
${assumptions.length ? assumptions.join('\n') : '- （无）'}
- 必须补的调研：
${unknowns.length ? unknowns.join('\n') : '- （无）'}

## 3) 路径比较
${d.paths.map(pathLine).join('\n')}

## 4) 不做清单
${d.dontList.map((x) => `- ${x}`).join('\n')}

## 5) 最小试错
- 未来 72 小时动作：${d.minAction || '—'}
- 成功信号：${d.successSignal || '—'}
- 止损信号：${d.stopSignal || '—'}

## 6) 复盘
- 7 天看：${d.review7 ? `${d.review7.result}（归因：${ATTRIBUTION_LABELS[d.review7.attribution]}）` : '（到期回填）'}
- 30 天看：${d.review30 ? `${d.review30.result}（归因：${ATTRIBUTION_LABELS[d.review30.attribution]}）` : '（到期回填）'}
- 到期归因：事实误差/判断误差/执行误差/环境变化/运气噪声

---
生成于定局 · 经典透镜仅提供思维框架，不构成医疗、法律、投资、心理建议。
`;
}

/* ================= 本地存储 ================= */

const DECISIONS_KEY = 'dingju.decisions.v1';
const PRINCIPLES_KEY = 'dingju.principles.v1';

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

export const store = {
  decisions(): Decision[] {
    return load<Decision>(DECISIONS_KEY);
  },
  saveDecision(d: Decision): void {
    const list = store.decisions();
    const i = list.findIndex((x) => x.id === d.id);
    if (i >= 0) list[i] = d;
    else list.unshift(d);
    localStorage.setItem(DECISIONS_KEY, JSON.stringify(list.slice(0, 100)));
  },
  deleteDecision(id: string): void {
    localStorage.setItem(DECISIONS_KEY, JSON.stringify(store.decisions().filter((d) => d.id !== id)));
  },
  principles(): Principle[] {
    return load<Principle>(PRINCIPLES_KEY);
  },
  addPrinciple(p: Principle): void {
    const list = store.principles();
    list.unshift(p);
    localStorage.setItem(PRINCIPLES_KEY, JSON.stringify(list.slice(0, 200)));
  },
};

export function newDecisionId(): string {
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyPaths(): PathOption[] {
  return (['A', 'B', 'C', 'D'] as PathKey[]).map((key) => ({ key, winRate: 50, cost: '', reversibility: '', trigger: '' }));
}

export const DEFAULT_DONT_LIST = [
  '不为证明自己对而加码',
  '不在睡眠不足 / 酒后 / 情绪峰值时发关键信息',
  '不用命理 / 运势替代事实',
];
