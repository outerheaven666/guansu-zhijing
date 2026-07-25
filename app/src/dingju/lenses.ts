/**
 * 定局 · 经典透镜卡库
 * 每张卡必须挂四个元数据：来源文本、现代转译、适用条件、禁用条件。
 * 无法说明边界的句子不进库（PRD §6）。
 */

export type Scene = 'career' | 'negotiation' | 'relationship';
export const SCENE_LABELS: Record<Scene, string> = {
  career: '职业 / 创业',
  negotiation: '谈判 / 竞争',
  relationship: '关系 / 边界',
};

export type LensTradition = 'yijing' | 'sunzi' | 'mao' | 'daodejing' | 'zhuangzi';
export const LENS_TRADITION_NAMES: Record<LensTradition, string> = {
  yijing: '易经',
  sunzi: '孙子兵法',
  mao: '毛选',
  daodejing: '道德经',
  zhuangzi: '庄子',
};

export interface LensCard {
  id: string;
  tradition: LensTradition;
  title: string;       // 透镜名：时 / 主要矛盾 / 虚实……
  question: string;    // 每张卡回答一个尖锐问题
  source: string;      // 来源文本
  translation: string; // 现代转译
  applyWhen: string;   // 适用条件
  avoidWhen: string;   // 禁用条件
  scenes: Scene[];     // 适用场景
}

export const LENS_CARDS: LensCard[] = [
  // ============ 易经：情境枚举与变量分层（不做占卜断吉凶） ============
  {
    id: 'yj-shi', tradition: 'yijing', title: '时',
    question: '这件事的正确时机是现在，还是「再等一个可验证的信号」？把那个信号写下来。',
    source: '《易经·乾卦·文言》「终日乾乾，与时偕行」',
    translation: '「时」不是黄道吉日，而是条件成熟度：等的是可观察的条件，不是心里的忐忑。',
    applyWhen: '决策窗口弹性大、条件明显未成熟时。',
    avoidWhen: '严禁用作拖延借口，严禁占卜择日、断吉凶。',
    scenes: ['career', 'negotiation', 'relationship'],
  },
  {
    id: 'yj-wei', tradition: 'yijing', title: '位',
    question: '你在这个局里的位置——权、责、利是否名实相符？名不副实的部分，先正名还是先做事？',
    source: '《易经》「当位」观念与《系辞》「位」之升降',
    translation: '位置决定你能调动什么。超出位置的用力，大多变成内耗。',
    applyWhen: '职责边界不清、越级或背锅风险高的组织决策。',
    avoidWhen: '不作为宿命论式的「安分守己」说教；不用于压制合理诉求。',
    scenes: ['career', 'negotiation'],
  },
  {
    id: 'yj-bian', tradition: 'yijing', title: '变',
    question: '哪一个变量一旦改变，整个局面翻转？你能影响它吗，还是只能为它准备预案？',
    source: '《易经·系辞》「穷则变，变则通，通则久」',
    translation: '把局看成变量的组合，找杠杆率最高的那一个，而不是平均用力。',
    applyWhen: '局面僵持、单点突破比全面铺开更现实时。',
    avoidWhen: '不把「求变」当作频繁改方向的许可证；每次变要有触发条件。',
    scenes: ['career', 'negotiation', 'relationship'],
  },
  {
    id: 'yj-xian', tradition: 'yijing', title: '险',
    question: '最坏局面具体长什么样？你能在哪一步设置「到此为止」的止损闸？',
    source: '《易经·坎卦》「习坎，有孚，维心亨，行有尚」',
    translation: '险不是吓退你的理由，是要求你提前画好止损线的提醒。',
    applyWhen: '不可逆投入（资金、信誉、关系）发生之前。',
    avoidWhen: '不放大恐惧渲染灾难；险要写成可观察的具体形态，不是模糊焦虑。',
    scenes: ['career', 'negotiation'],
  },

  // ============ 孙子兵法：胜率与代价评估（不把亲密关系战争化） ============
  {
    id: 'sz-wushi', tradition: 'sunzi', title: '五事七计',
    question: '道、天、地、将、法逐项打分：你在哪一项其实已经输了？那一项能补吗？',
    source: '《孙子兵法·计篇》「故经之以五事，校之以计而索其情」',
    translation: '把「能不能赢」拆成五个可检查的维度，代替拍脑袋的信心。',
    applyWhen: '竞争、投标、谈判等有明显对手的局面。',
    avoidWhen: '不把亲密关系、家庭关系当战争打；不打分时凭情绪给分。',
    scenes: ['negotiation', 'career'],
  },
  {
    id: 'sz-xiansheng', tradition: 'sunzi', title: '先胜后战',
    question: '动手之前，你的「不可胜」底牌是什么——最坏情况发生时你依然活得下去的那个保障？',
    source: '《孙子兵法·形篇》「昔之善战者，先为不可胜，以待敌之可胜」',
    translation: '先让自己输不起的部分变得输得起，再谈进攻。',
    applyWhen: '重仓投入、裸辞、all-in 创业之前。',
    avoidWhen: '不作为永不行动的借口；底牌齐备后仍要回答「何时动」。',
    scenes: ['career', 'negotiation'],
  },
  {
    id: 'sz-xushi', tradition: 'sunzi', title: '虚实',
    question: '对方的「实」（最强处）在哪里？你能不能完全不碰实、只在「虚」处拿结果？',
    source: '《孙子兵法·虚实篇》「兵之形，避实而击虚」',
    translation: '正面硬刚赢面低时，换战场比加兵力便宜。',
    applyWhen: '资源明显弱于对手、或对方有不可替代优势时。',
    avoidWhen: '「避实」不等于逃避核心问题；核心矛盾绕不开时必须直面。',
    scenes: ['negotiation', 'career'],
  },
  {
    id: 'sz-guijiu', tradition: 'sunzi', title: '久',
    question: '拖下去对谁有利？如果时间是对方的盟友，你的「速决方案」是什么？',
    source: '《孙子兵法·作战篇》「兵贵胜，不贵久」',
    translation: '拖延是一种隐性下注——押注时间站在你这边。先验证这个假设。',
    applyWhen: '谈判僵持、项目延期、犹豫观望超过两周时。',
    avoidWhen: '不把「速决」理解为草率；需要等的局（见「时」）不在此列。',
    scenes: ['negotiation', 'career', 'relationship'],
  },

  // ============ 毛选：逼拿事实、找杠杆点（不机械套用历史结论） ============
  {
    id: 'mao-maodun', tradition: 'mao', title: '主要矛盾',
    question: '你列出的所有问题里，哪一个是主要矛盾——它一解决，其他问题跟着松动？你现在几成精力在它上面？',
    source: '《矛盾论》（1937）「捉住了这个主要矛盾，一切问题就迎刃而解了」',
    translation: '精力错配是最大的浪费：先排序，再用力。',
    applyWhen: '问题成堆、头绪繁多、感觉到处着火时。',
    avoidWhen: '不机械套用历史结论；主要矛盾要在你自己的事实里找，不在书里找。',
    scenes: ['career', 'negotiation', 'relationship'],
  },
  {
    id: 'mao-diaocha', tradition: 'mao', title: '调查研究',
    question: '你的关键判断里，有几条是一手事实（亲眼见、亲耳听、亲手查）？比例不到一半就先别定。',
    source: '《反对本本主义》（1930）「没有调查，就没有发言权」',
    translation: '事实不足时，最优决策是「先做三天调查」，不是「先定了再说」。',
    applyWhen: '依据主要来自听说、推测、焦虑想象时。',
    avoidWhen: '调查要有截止线；不以「再查查」为名无限推迟。',
    scenes: ['career', 'negotiation', 'relationship'],
  },
  {
    id: 'mao-jieduan', tradition: 'mao', title: '阶段论',
    question: '这件事现在处在哪个阶段？进入下一阶段的客观标志是什么？你在用哪个阶段的打法？',
    source: '《矛盾论》关于事物发展过程分阶段的论述',
    translation: '打法要配得上阶段：探索期别搞执行期的 KPI，收尾期别用开局期的乐观。',
    applyWhen: '长周期项目、关系修复、转型过程过半失去方向感时。',
    avoidWhen: '阶段划分是工作假设，不是教条；标志没出现就别强行宣布进入下阶段。',
    scenes: ['career', 'relationship'],
  },
  {
    id: 'mao-shishi', tradition: 'mao', title: '实事求是',
    question: '此刻你是在「求」（研究事实与规律），还是在「许愿」（重复愿望与情绪）？',
    source: '《改造我们的学习》（1941）对「实事求是」的界定',
    translation: '把一小时「求是」和一小时「许愿」分开记账，比例会告诉你答案。',
    applyWhen: '反复纠结同一问题、原地打转超过一周时。',
    avoidWhen: '情绪也需要出口；本透镜管决策不管安慰，安慰请移步执镜。',
    scenes: ['career', 'negotiation', 'relationship'],
  },

  // ============ 道德经：识别妄为、做减法（不等于躺平） ============
  {
    id: 'ddj-ri-sun', tradition: 'daodejing', title: '日损',
    question: '这个局里，第一个该撤掉的动作是什么——不做它，局面反而变好的那个动作？',
    source: '《道德经》第四十八章「为学日益，为道日损」',
    translation: '很多局不是赢出来的，是停止添乱之后自己理顺的。',
    applyWhen: '动作很多但局面没有变好、越努力越乱时。',
    avoidWhen: '减法不等于躺平或逃避责任；撤的是妄为，不是本分。',
    scenes: ['career', 'relationship'],
  },
  {
    id: 'ddj-zhizhi', tradition: 'daodejing', title: '知止',
    question: '这局的「止线」在哪里——达到什么状态你就收手享受，而不是继续加码？写具体。',
    source: '《道德经》第四十四章「知足不辱，知止不殆，可以长久」',
    translation: '没有止线的胜利永远在路上，最后都变成新的困局。',
    applyWhen: '连续得手、开始加码、野心膨胀时。',
    avoidWhen: '止线不是低目标的遮羞布；定低了会后悔的线不是止线是借口。',
    scenes: ['career', 'negotiation'],
  },
  {
    id: 'ddj-shourou', tradition: 'daodejing', title: '守柔',
    question: '硬碰硬之外，「水一样的走法」是什么——绕开正面、先处下、以时间换空间？',
    source: '《道德经》第七十八章「天下莫柔弱于水，而攻坚强者莫之能胜」',
    translation: '柔不是软弱，是拒绝在对方选择的战场、用对方擅长的方式对决。',
    applyWhen: '正面冲突代价高、对方吃软不吃硬时。',
    avoidWhen: '原则问题不让步；柔是路径选择，不是立场放弃。',
    scenes: ['negotiation', 'relationship'],
  },
  {
    id: 'ddj-qizhe', tradition: 'daodejing', title: '企者不立',
    question: '你的计划里哪一步在「踮脚」——靠透支身体、人情或运气才能成立？',
    source: '《道德经》第二十四章「企者不立，跨者不行」',
    translation: '需要超常发挥才能成立的计划，是正常发挥就会失败的计划。',
    applyWhen: '计划排满、依赖借钱/加班/他人配合等脆弱环节时。',
    avoidWhen: '不否定合理杠杆；杠杆的代价写清楚就算数。',
    scenes: ['career', 'negotiation'],
  },

  // ============ 庄子：视角切换与情绪降级（不否定事实与专业） ============
  {
    id: 'zz-jingwa', tradition: 'zhuangzi', title: '井与视角',
    question: '你的判断里有多少来自你所在的「井」（位置、经历、信息源）？换一个人处在你的位置，会看见什么？',
    source: '《庄子·秋水》「井蛙不可以语于海者，拘于虚也」',
    translation: '先怀疑信息源的局限，再怀疑自己的判断。',
    applyWhen: '判断高度依赖单一信息源、身边都是同质声音时。',
    avoidWhen: '视角多元不否定事实；事实问题用调查研究解决，不用「换个角度看」和稀泥。',
    scenes: ['career', 'negotiation', 'relationship'],
  },
  {
    id: 'zz-feizhi', tradition: 'zhuangzi', title: '无观众假设',
    question: '如果没人会知道你的选择——没有观众、没有评价——你还这么选吗？',
    source: '《庄子·逍遥游》「且举世誉之而不加劝，举世非之而不加沮」',
    translation: '把「别人怎么看」从决策函数里暂时删掉，看剩下什么。',
    applyWhen: '面子、人设、他人期待明显参与决策时。',
    avoidWhen: '社会评价有时就是成本本身（如职业声誉），不能一律删除。',
    scenes: ['career', 'relationship'],
  },
  {
    id: 'zz-anshi', tradition: 'zhuangzi', title: '安时处顺',
    question: '这件事里哪些是「时」（不可控），哪些是「顺」（可顺势而为）？分栏写开。',
    source: '《庄子·养生主》「安时而处顺，哀乐不能入也」',
    translation: '对不可控的部分停止支付情绪，把预算全部转给可为的部分。',
    applyWhen: '为不可控之事持续内耗、反复反刍时。',
    avoidWhen: '「安」只针对真不可控；没试过的路径不算不可控。',
    scenes: ['career', 'relationship'],
  },
  {
    id: 'zz-zifeiyu', tradition: 'zhuangzi', title: '子非鱼',
    question: '你对对方动机的推断，证据是什么？「他就是这样的人」之外，还有哪些同样说得通的解释？',
    source: '《庄子·秋水》「子非鱼，安知鱼之乐」',
    translation: '动机推断是最廉价的假设，写三个替代解释再选动作。',
    applyWhen: '冲突、猜忌、读心式推断主导判断时。',
    avoidWhen: '理解动机不替代边界；对方行为越界时，先护边界再谈理解。',
    scenes: ['relationship', 'negotiation'],
  },
];

/** 按场景选 3–5 张透镜：每传统至多一张，优先场景匹配 */
export function lensesForScene(scene: Scene, max = 5): LensCard[] {
  const matched = LENS_CARDS.filter((c) => c.scenes.includes(scene));
  const picked: LensCard[] = [];
  const usedTradition = new Set<string>();
  for (const c of matched) {
    if (picked.length >= max) break;
    if (!usedTradition.has(c.tradition)) {
      picked.push(c);
      usedTradition.add(c.tradition);
    }
  }
  // 不足 max 张时从剩余里补齐
  for (const c of matched) {
    if (picked.length >= max) break;
    if (!picked.includes(c)) picked.push(c);
  }
  return picked;
}
