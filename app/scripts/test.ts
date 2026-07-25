/**
 * 核心逻辑冒烟测试：干支历法、节气近似、执镜引擎与风控护栏
 * 运行：npx tsx scripts/test.ts
 */
import {
  dayGanzhiIndex,
  jiaziName,
  monthGanzhiIndex,
  readCalendar,
  solarTermsOfYear,
  yearGanzhiIndex,
} from '../src/shared/ganzhi';
import { JIEQI_INFO, JIEQI_ORDER } from '../src/shared/jieqi';
import { LIUQI, yunOfStem, EXHIBITS, QI_NARRATIVE } from '../src/shared/wuyunliuqi';
import { QUOTES } from '../src/shared/quotes';
import { classify, detectCrisis, respond } from '../src/shared/engine';
import { DUANYU_CARDS } from '../src/shared/narrative';
import { currentTermName, drawQuoteFor, estimatePayoutYuan, tierOfDiamond } from '../src/live/tiers';
import { LENS_CARDS, lensesForScene } from '../src/dingju/lenses';
import {
  checkDecisionRedFlags,
  classifySentence,
  detectScene,
  emptyPaths,
  onePageMarkdown,
  reviewDue,
  splitAndClassify,
  type Decision,
} from '../src/dingju/model';

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name} ${extra}`);
  }
}

console.log('— 干支历法 —');
// 锚点：1949-10-01 为甲子日
check('1949-10-01 日柱为甲子', jiaziName(dayGanzhiIndex(1949, 10, 1)) === '甲子');
// 逐日推进一致性
check('日柱逐日 +1', dayGanzhiIndex(2024, 3, 1) === (dayGanzhiIndex(2024, 2, 29) + 1) % 60);
// 2024 立春后为甲辰年，立春前仍为癸卯年
check('2024-02-04 起为甲辰年', jiaziName(yearGanzhiIndex(2024, 2, 4)) === '甲辰', jiaziName(yearGanzhiIndex(2024, 2, 4)));
check('2024-02-03 仍为癸卯年', jiaziName(yearGanzhiIndex(2024, 2, 3)) === '癸卯', jiaziName(yearGanzhiIndex(2024, 2, 3)));
// 2024-02-10（立春后、惊蛰前）应为丙寅月
check('2024-02-10 为丙寅月', jiaziName(monthGanzhiIndex(2024, 2, 10).index) === '丙寅', jiaziName(monthGanzhiIndex(2024, 2, 10).index));
// 2024-01-15（小寒后、立春前）属上一年乙丑月
check('2024-01-15 为乙丑月', jiaziName(monthGanzhiIndex(2024, 1, 15).index) === '乙丑', jiaziName(monthGanzhiIndex(2024, 1, 15).index));

console.log('— 节气近似（2023–2025 应与通行历书一致） —');
const assertTerm = (y: number, name: string, m: number, d: number) => {
  const t = solarTermsOfYear(y).find((x) => x.name === name)!;
  check(`${y} ${name} = ${m}月${d}日`, t.month === m && t.day === d, `got ${t.month}月${t.day}日`);
};
assertTerm(2024, '立春', 2, 4);
assertTerm(2024, '清明', 4, 4);
assertTerm(2024, '夏至', 6, 21);
assertTerm(2024, '立秋', 8, 7);
assertTerm(2023, '春分', 3, 21);
assertTerm(2025, '立春', 2, 3);
assertTerm(2025, '冬至', 12, 21);
assertTerm(2025, '芒种', 6, 5);

console.log('— 数据完整性 —');
check('24 节气资料齐全', JIEQI_ORDER.length === 24 && JIEQI_ORDER.every((n) => JIEQI_INFO[n]));
check('六气叙述覆盖全部司天', Object.values(LIUQI).every((q) => QI_NARRATIVE[q.sitian] && QI_NARRATIVE[q.zaiquan]));
check('医史展厅不少于 5 个', EXHIBITS.length >= 5);
check('断语卡不少于 5 张且每卡 4 问', DUANYU_CARDS.length >= 5 && DUANYU_CARDS.every((c) => c.prompts.length >= 4));
check('引文库不少于 24 条且四传统齐备', QUOTES.length >= 24 && ['zhuangzi', 'daodejing', 'sunzi', 'mao'].every((t) => QUOTES.some((q) => q.tradition === t)));
check('每条引文含出处/镜问/小实验', QUOTES.every((q) => q.source && q.ask && q.experiment));
check('五运推导：甲→土太过、辛→水不及', yunOfStem('甲').element === '土' && yunOfStem('甲').excess === '太过' && yunOfStem('辛').element === '水' && yunOfStem('辛').excess === '不及');

console.log('— 执镜引擎 —');
const r1 = respond('最近工作压力特别大，天天加班，感觉快撑不住了');
check('压力主题能识别', r1.kind === 'coach' && r1.themes[0]?.theme === 'pressure');
if (r1.kind === 'coach') {
  check('回应含两条不同传统的引文', r1.quotes.length === 2 && r1.quotes[0].tradition !== r1.quotes[1].tradition);
  check('置信度在 0.55–0.88 之间', r1.confidence >= 0.55 && r1.confidence <= 0.88);
  check('必含适用边界', r1.boundary.length > 10);
}
const r2 = respond('拿到两个 offer，一个钱多一个更喜欢，纠结');
check('选择主题能识别', r2.kind === 'coach' && r2.themes[0]?.theme === 'choice');
const r3 = respond('今天天气不错');
check('无关键词时兜底为意义主题且不崩溃', r3.kind === 'coach' && r3.quotes.length >= 1);

console.log('— 多轮上下文 —');
const r4 = respond('那我再补充一点情况', [], ['最近工作压力特别大，天天加班，感觉快撑不住了']);
check('无信号输入可延续上文主题', r4.kind === 'coach' && r4.themes[0]?.theme === 'pressure' && r4.inherited === true);
const r5 = respond('压力还是很大', [], ['我被诈骗了三十万']);
check('本轮有信号时不误标延续', r5.kind === 'coach' && r5.inherited === false);

console.log('— 风控护栏 —');
check('「不想活了」触发心理危机转介', detectCrisis('我觉得活着没意思，不想活了')?.category === 'mental');
check('「确诊癌症」触发健康转介', detectCrisis('上周确诊了癌症，怎么办')?.category === 'medical');
check('「被诈骗」触发法律财务转介', detectCrisis('我被诈骗了三十万，债主天天催')?.category === 'legal_finance');
const rc = respond('我不想活了');
check('危机输入不走陪练回应', rc.kind === 'crisis');
check('正常倾诉不误报', detectCrisis('工作压力大，有点焦虑') === null);
check('分类器不崩溃于空字符串', classify('').length === 0);

console.log('— 历法解释器综合 —');
const today = readCalendar(2026, 7, 25);
check('readCalendar 返回完整字段', !!(today.yearPillar && today.monthPillar && today.dayPillar && today.prevTerm && today.nextTerm));
check('2026-07-25 已过大暑、未到立秋', today.prevTerm?.name === '大暑' && today.nextTerm?.name === '立秋', `${today.prevTerm?.name}/${today.nextTerm?.name}`);

console.log('— 直播互动台：礼物分档 —');
check('1 抖币 → 节气签（t1）', tierOfDiamond(1).id === 't1');
check('49 抖币 → t1 边界', tierOfDiamond(49).id === 't1');
check('50 抖币 → 执镜签（t2）', tierOfDiamond(50).id === 't2');
check('200 抖币 → 双镜签（t3）', tierOfDiamond(200).id === 't3');
check('1000 抖币 → 典藏签（t4）', tierOfDiamond(1000).id === 't4');
check('99999 抖币 → t4 封顶', tierOfDiamond(99999).id === 't4');
check('0/负值兜底为 t1', tierOfDiamond(0).id === 't1');
check('分成估算：1000 抖币 ≈ ¥50', estimatePayoutYuan(1000) === 50);
check('执镜签确定性：同昵称同主题同签', drawQuoteFor('青梅煮酒', 'choice').id === drawQuoteFor('青梅煮酒', 'choice').id);
check('执镜签必属当周主题', drawQuoteFor('青梅煮酒', 'choice').themes.includes('choice'));
check('当令节气：2026-07-26 → 大暑', currentTermName(new Date(2026, 6, 26)) === '大暑');
check('当令节气：2026-02-10 → 立春', currentTermName(new Date(2026, 1, 10)) === '立春');
check('当令节气：2026-01-03 → 小寒（岁首回绕）', currentTermName(new Date(2026, 0, 3)) === '小寒');

console.log('— 定局：场景识别 —');
check('跳槽/offer → 职业创业', detectScene('拿到两个 offer，要不要跳槽').scene === 'career');
check('谈薪/合同 → 谈判竞争', detectScene('下周和客户谈合同条款，对方压价').scene === 'negotiation');
check('借钱/父母 → 关系边界', detectScene('亲戚又来借钱，父母也劝我借').scene === 'relationship');

console.log('— 定局：事实分层 —');
check('「我觉得」→ 感受', classifySentence('我觉得他针对我') === 'feeling');
check('「听说」→ 传闻', classifySentence('听说公司要裁员') === 'rumor');
check('「希望」→ 愿望', classifySentence('希望最好能涨薪') === 'wish');
check('「不确定」→ 未知', classifySentence('还不确定对方预算') === 'unknown');
check('「应该」→ 假设', classifySentence('他应该会同意的') === 'assumption');
check('含数字 → 事实', classifySentence('上月销售额 120 万') === 'fact');
check('拆句分类：三段拆出三条', splitAndClassify('我被骗了钱。听说他要跑。希望还能追回来。').length === 3);

console.log('— 定局：透镜库 —');
check('透镜卡 ≥ 16 张', LENS_CARDS.length >= 16);
check('每卡四元数据齐全', LENS_CARDS.every((c) => c.source && c.translation && c.applyWhen && c.avoidWhen));
check('五部经典齐备', ['yijing', 'sunzi', 'mao', 'daodejing', 'zhuangzi'].every((t) => LENS_CARDS.some((c) => c.tradition === t)));
check('场景选镜 3–5 张且传统不重复', (() => {
  const ls = lensesForScene('career');
  return ls.length >= 3 && ls.length <= 5 && new Set(ls.map((c) => c.tradition)).size === ls.length;
})());
check('每场景都能选到卡', (['career', 'negotiation', 'relationship'] as const).every((s) => lensesForScene(s).length >= 3));

console.log('— 定局：红线与复盘 —');
check('「梭哈」触发高风险财务阻断', checkDecisionRedFlags('我想梭哈全部积蓄')?.kind === 'investment');
check('「不想活」触发危机硬阻断', checkDecisionRedFlags('我不想活了')?.kind === 'crisis');
check('正常决策文本不误报', checkDecisionRedFlags('我在考虑要不要跳槽') === null);

const mockDecision: Decision = {
  id: 't1', title: '要不要跳槽', scene: 'career', what: '拿到 offer', want: '涨薪', fear: '不适应',
  deadline: '两周', reversibility: '试用期可退', maxLoss: '3 个月工资',
  entries: [
    { id: 'e1', text: '新 offer 月薪 28000', type: 'fact' },
    { id: 'e2', text: '听说对方加班严重', type: 'rumor' },
    { id: 'e3', text: '还不知道团队构成', type: 'unknown' },
  ],
  lensNotes: { 'mao-maodun': '成长空间 vs 稳定' },
  paths: emptyPaths(), dontList: ['不用运势替代事实'],
  minAction: '约未来主管聊一次', successSignal: '聊完疑虑消除', stopSignal: '对方回避管理问题',
  status: 'active', createdAt: Date.now(),
};
const md = onePageMarkdown(mockDecision);
check('一页纸含全部六个章节', ['## 1) 局面判断', '## 2) 事实/假设', '## 3) 路径比较', '## 4) 不做清单', '## 5) 最小试错', '## 6) 复盘'].every((s) => md.includes(s)));
check('一页纸含合规声明', md.includes('不构成医疗、法律、投资、心理建议'));
check('一页纸事实/假设正确归栏', md.includes('新 offer 月薪 28000') && md.includes('[传闻] 听说对方加班严重'));
check('复盘到期：新决策不到期', reviewDue(mockDecision) === null);
check('复盘到期：8 天前 → 7 天档', reviewDue({ ...mockDecision, createdAt: Date.now() - 8 * 86400000 }) === '7');
check('复盘到期：31 天前且 7 天已填 → 30 天档', reviewDue({ ...mockDecision, createdAt: Date.now() - 31 * 86400000, review7: { result: 'x', attribution: 'fact', principle: 'y', at: 1 } }) === '30');

console.log(`\n结果：${passed} 通过，${failed} 失败`);
process.exit(failed > 0 ? 1 : 0);
