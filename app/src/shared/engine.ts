/**
 * 执镜引擎：本地规则式「苏格拉中」提问器
 *
 * 护栏（先于一切应答）：
 * 1. 不预测、不诊断、不承诺改命；
 * 2. 命中自伤/重病/重大法律财务风险时，直接转专业资源，不做陪练式回应；
 * 3. 「置信度」仅为引文与情境匹配程度的主观估计。
 */

import { QUOTES, THEME_LABELS, type Quote, type Theme } from './quotes';

export interface CrisisHit {
  category: 'mental' | 'medical' | 'legal_finance';
  categoryLabel: string;
  keyword: string;
}

const CRISIS_RULES: Array<{ category: CrisisHit['category']; label: string; words: string[] }> = [
  {
    category: 'mental',
    label: '心理危机信号',
    words: [
      '自杀', '不想活', '轻生', '自残', '自伤', '结束生命', '结束自己', '活不下去',
      '活着没意思', '想死', '死了算了', '跳楼', '割腕', '吞药', '厌世',
    ],
  },
  {
    category: 'medical',
    label: '重大健康议题',
    words: [
      '确诊', '癌症', '肿瘤', '绝症', '晚期', '病危', 'ICU', '化疗',
      '抑郁症', '双相', '精神分裂', '住院', '手术', '中风',
    ],
  },
  {
    category: 'legal_finance',
    label: '重大法律与财务议题',
    words: [
      '高利贷', '网贷', '负债累累', '破产', '被诈骗', '被骗', '传销',
      '官司', '起诉', '被告', '逮捕', '拘留', '案底', '家暴', '殴打我', '打我',
      '离婚官司', '抚养权', '遗产纠纷',
    ],
  },
];

export function detectCrisis(input: string): CrisisHit | null {
  for (const rule of CRISIS_RULES) {
    for (const w of rule.words) {
      if (input.includes(w)) {
        return { category: rule.category, categoryLabel: rule.label, keyword: w };
      }
    }
  }
  return null;
}

export const CRISIS_RESOURCES: Record<CrisisHit['category'], { intro: string; items: Array<{ name: string; detail: string }> }> = {
  mental: {
    intro: '你说到的这些，已经超出了一面「镜子」能照的范围。执镜不是医生，也不是咨询师——这个时候最重要的是让真的人介入。请优先联系以下资源：',
    items: [
      { name: '全国心理援助热线 12356', detail: '国家卫健委设置的全国统一心理援助热线，2025 年 5 月起全国各省均已开通，每天不少于 18 小时人工接听。' },
      { name: '北京心理危机研究与干预中心 010-82951332', detail: '24 小时危机干预热线。' },
      { name: '紧急情况 110 / 120', detail: '如果你或身边的人正处于即刻的危险中，请立即拨打。' },
      { name: '就近就医', detail: '各地市均有提供心理门诊服务的医院，可直接前往精神科或心理科。' },
    ],
  },
  medical: {
    intro: '涉及确诊与治疗的问题，任何引用经典的对话都不该替代医生的判断。执镜可以陪你整理面对疾病的思路与心态，但「怎么办」的第一答案永远在医生那里。',
    items: [
      { name: '主治医生与第二诊疗意见', detail: '重大治疗方案可寻求三甲医院第二意见，这是正常且被鼓励的做法。' },
      { name: '全国心理援助热线 12356', detail: '重大疾病带来的情绪压力，同样可以寻求心理支持。' },
      { name: '医保咨询 12393', detail: '涉及费用与报销问题，可咨询医保服务热线。' },
    ],
  },
  legal_finance: {
    intro: '法律与重大财务问题有明确的救济渠道，引文帮不上具体的忙，专业人士可以。建议优先走正规渠道：',
    items: [
      { name: '法律援助热线 12348', detail: '公共法律服务热线，可咨询律师、申请法律援助（符合条件的免费）。' },
      { name: '报警 110 / 反诈专线 96110', detail: '涉及诈骗、家暴等，请立即报警；96110 为反诈预警专线。' },
      { name: '金融消费权益保护 12363', detail: '涉及贷款、征信等金融纠纷可咨询。' },
    ],
  },
};

/** 主题关键词表 */
const THEME_WORDS: Record<Theme, string[]> = {
  pressure: ['压力', '焦虑', '紧张', '睡不着', '失眠', '累', '疲惫', '喘不过', '内卷', '加班', 'deadline', 'DDL', '崩溃', '撑不住', '担心', '害怕'],
  choice: ['选择', '纠结', '犹豫', '要不要', '该不该', '选哪个', 'offer', '跳槽', '辞职', '转行', '分手吗', '买不买房', '去留', '两难'],
  anger: ['生气', '愤怒', '气死', '委屈', '凭什么', '欺负', '针对我', '不公平', '吵架', '冲突', '得罪', '背刺', '甩锅'],
  relationship: ['同事', '领导', '老板', '朋友', '对象', '男朋友', '女朋友', '老公', '老婆', '父母', '孩子', '婆婆', '人际', '关系', '讨厌', '孤立', '排挤'],
  action: ['拖延', '不想动', '懒得', '执行力', '自律', '坚持不', '三分钟热度', '躺平', '摆烂', '计划', '目标', '行动', '开始不', '效率'],
  gainloss: ['失败', '失利', '亏钱', '赔了', '降薪', '裁员', '被裁', '失业', '没考上', '落榜', '得失', '不甘心', '吃亏', '错过', '后悔'],
  meaning: ['意义', '迷茫', '空虚', '为什么活', '人生', '方向', '价值', '无趣', '无聊', '空虚', '宿命', '命运', '三十而立', '中年'],
  self: ['我不行', '做不到', '自卑', '怀疑自己', '不自信', '能力不够', '比不上', '配吗', '不配', '否定', '一事无成', '废物'],
};

export interface ThemeScore {
  theme: Theme;
  label: string;
  hits: string[];
}

export function classify(input: string): ThemeScore[] {
  const scores: ThemeScore[] = [];
  for (const [theme, words] of Object.entries(THEME_WORDS) as Array<[Theme, string[]]>) {
    const hits = words.filter((w) => input.includes(w));
    if (hits.length > 0) scores.push({ theme, label: THEME_LABELS[theme], hits });
  }
  return scores.sort((a, b) => b.hits.length - a.hits.length);
}

export interface CoachReply {
  kind: 'coach';
  themes: ThemeScore[];
  quotes: Quote[];
  /** 展示为「约 68%」的主观估计 */
  confidence: number;
  confidenceNote: string;
  boundary: string;
}

export interface CrisisReply {
  kind: 'crisis';
  hit: CrisisHit;
}

export type EngineReply = CoachReply | CrisisReply;

/** 主题与视角的亲和度：不同问题用不同的「镜子」 */
const LENS_AFFINITY: Record<Theme, Array<Quote['tradition']>> = {
  pressure: ['daodejing', 'zhuangzi', 'mao', 'sunzi'],
  choice: ['sunzi', 'daodejing', 'mao', 'zhuangzi'],
  anger: ['sunzi', 'zhuangzi', 'daodejing', 'mao'],
  relationship: ['zhuangzi', 'daodejing', 'sunzi', 'mao'],
  action: ['mao', 'sunzi', 'daodejing', 'zhuangzi'],
  gainloss: ['daodejing', 'zhuangzi', 'sunzi', 'mao'],
  meaning: ['zhuangzi', 'mao', 'daodejing', 'sunzi'],
  self: ['mao', 'daodejing', 'zhuangzi', 'sunzi'],
};

/** 生成陪练式回应。historyQuotes 用于避免连续重复同一引文。 */
export function respond(input: string, recentQuoteIds: string[] = []): EngineReply {
  const crisis = detectCrisis(input);
  if (crisis) return { kind: 'crisis', hit: crisis };

  const themes = classify(input);
  const topTheme: Theme = themes[0]?.theme ?? 'meaning';

  // 选引文：优先亲和视角，尽量避免最近用过
  const pool = QUOTES.filter((q) => q.themes.includes(topTheme));
  const affinity = LENS_AFFINITY[topTheme];
  const sorted = [...pool].sort(
    (a, b) => affinity.indexOf(a.tradition) - affinity.indexOf(b.tradition),
  );
  const fresh = sorted.filter((q) => !recentQuoteIds.includes(q.id));
  const candidates = fresh.length >= 2 ? fresh : sorted;
  // 取两条不同传统的引文
  const picked: Quote[] = [];
  for (const q of candidates) {
    if (picked.length >= 2) break;
    if (!picked.some((p) => p.tradition === q.tradition)) picked.push(q);
  }
  if (picked.length === 0 && QUOTES.length > 0) picked.push(QUOTES[0]);

  // 置信度：主题命中越多，主观估计越高；封顶 88%
  const hitCount = themes[0]?.hits.length ?? 0;
  const confidence = Math.min(0.55 + hitCount * 0.08 + (themes.length > 1 ? 0.05 : 0), 0.88);

  const boundary =
    themes.length === 0
      ? '你没有给出太多信号，我按「意义与迷茫」给了一面通用的镜子。说得越具体，镜子照得越准。以上引文只提供看问题的角度，不构成建议；涉及健康、法律、重大财务的决定，请咨询专业人士。'
      : `以上解读基于你提到的「${themes[0].label}」信号，是一种视角而非结论。引文不提供答案，只提供看问题的角度；涉及健康、法律、重大财务的决定，请咨询专业人士。`;

  return {
    kind: 'coach',
    themes,
    quotes: picked,
    confidence,
    confidenceNote: '匹配置信度为主观估计（基于关键词命中），表示引文与你所述情境的贴合程度，不代表任何预测准确率。',
    boundary,
  };
}
