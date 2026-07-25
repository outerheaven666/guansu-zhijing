/**
 * 执镜 · 经典引文库
 * 所有引文均给出篇名出处；「置信度」为针对当下情境匹配程度的主观估计，非科学测量。
 */

export type Tradition = 'zhuangzi' | 'daodejing' | 'sunzi' | 'mao';

export const TRADITION_META: Record<Tradition, { name: string; lens: string; color: string }> = {
  zhuangzi: { name: '庄子', lens: '换视角', color: 'text-pine' },
  daodejing: { name: '道德经', lens: '做减法', color: 'text-gold' },
  sunzi: { name: '孙子兵法', lens: '评估代价', color: 'text-cinnabar' },
  mao: { name: '毛泽东选集', lens: '逼拿事实', color: 'text-cinnabar' },
};

export type Theme =
  | 'pressure'     // 压力与焦虑
  | 'choice'       // 选择与纠结
  | 'anger'        // 愤怒与委屈
  | 'relationship' // 人际与冲突
  | 'action'       // 拖延与行动
  | 'gainloss'     // 得失与成败
  | 'meaning'      // 意义与迷茫
  | 'self';        // 自我怀疑

export const THEME_LABELS: Record<Theme, string> = {
  pressure: '压力与焦虑',
  choice: '选择与纠结',
  anger: '愤怒与委屈',
  relationship: '人际与冲突',
  action: '拖延与行动',
  gainloss: '得失与成败',
  meaning: '意义与迷茫',
  self: '自我怀疑',
};

export interface Quote {
  id: string;
  tradition: Tradition;
  text: string;
  source: string;
  themes: Theme[];
  /** 苏格拉底式追问 */
  ask: string;
  /** 一个可执行小实验 */
  experiment: string;
}

export const QUOTES: Quote[] = [
  // ============ 庄子 · 换视角 ============
  {
    id: 'zz-qiushui-jingwa',
    tradition: 'zhuangzi',
    text: '井蛙不可以语于海者，拘于虚也；夏虫不可以语于冰者，笃于时也。',
    source: '《庄子·秋水》',
    themes: ['meaning', 'choice', 'self'],
    ask: '你此刻坚信的这个判断，有多少来自你所在的「井」——你的位置、经历和信息源？换一个位置，它还是事实吗？',
    experiment: '本周找一个与你处境不同的人，请他完整讲一遍对你这件事的看法，你只记录不反驳，圈出三个你从未想到的角度。',
  },
  {
    id: 'zz-qiushui-yu',
    tradition: 'zhuangzi',
    text: '子非鱼，安知鱼之乐？',
    source: '《庄子·秋水》',
    themes: ['relationship', 'anger'],
    ask: '你在推断对方动机时，依据的是证据，还是你自己的感受？如果对方的快乐与委屈你都无法直接知道，你能确认的到底是什么？',
    experiment: '下次与人冲突时，先写下三句话：「我观察到的事实」「我的推测」「我的感受」，分清三者再回应。',
  },
  {
    id: 'zz-xiaoyao-zhiyu',
    tradition: 'zhuangzi',
    text: '且举世誉之而不加劝，举世非之而不加沮。',
    source: '《庄子·逍遥游》',
    themes: ['self', 'pressure', 'gainloss'],
    ask: '你现在的动力里，有多少来自别人的评价？如果全世界既不夸你也不骂你，这件事你还做不做？',
    experiment: '挑一件你只为「别人的眼光」而做的事，这周假装没有任何观众做一次，记录感受的差别。',
  },
  {
    id: 'zz-renjianshi-wuyong',
    tradition: 'zhuangzi',
    text: '人皆知有用之用，而莫知无用之用也。',
    source: '《庄子·人间世》',
    themes: ['meaning', 'pressure', 'gainloss'],
    ask: '你急着证明「有用」的这段时间里，丢掉了什么「无用」的东西？那些无用的东西，曾经给过你什么？',
    experiment: '这周日留出两小时做一件完全「无用」的事（散步、发呆、乱画），事后写下它有没有悄悄改变你对主业的想法。',
  },
  {
    id: 'zz-yangshengzhu-anshi',
    tradition: 'zhuangzi',
    text: '安时而处顺，哀乐不能入也。',
    source: '《庄子·养生主》',
    themes: ['gainloss', 'pressure', 'meaning'],
    ask: '你现在痛苦的这件事里，哪一部分是「时」——时机未到或时机已过，不以你的意志为转移？把它和「你能做的部分」分开。',
    experiment: '把困扰你的事写成两列清单：「时」（不可控）与「顺」（可顺势而做）。未来一周只处理右列，左列每天只看一眼。',
  },
  {
    id: 'zz-xiaoyao-jiaoliao',
    tradition: 'zhuangzi',
    text: '鹪鹩巢于深林，不过一枝；偃鼠饮河，不过满腹。',
    source: '《庄子·逍遥游》',
    themes: ['pressure', 'gainloss', 'choice'],
    ask: '你想要的总量里，多少是「一枝」「满腹」的真实需要，多少是整条大河般的焦虑性囤积？',
    experiment: '写下你当前目标对应的「最小够用版本」，标注：达成最小版之后，剩下的部分是想要还是需要？',
  },
  {
    id: 'zz-renjianshi-xushi',
    tradition: 'zhuangzi',
    text: '虚室生白，吉祥止止。',
    source: '《庄子·人间世》',
    themes: ['pressure', 'meaning'],
    ask: '你的脑子最近是不是塞得太满了？如果清空一角，什么东西会自己浮现出来？',
    experiment: '明天起床后先做 15 分钟「空室练习」：不看手机，只是坐着，让想法自己冒出来，把第一个反复出现的想法记下来。',
  },
  {
    id: 'zz-renjianshi-naihe',
    tradition: 'zhuangzi',
    text: '知其不可奈何而安之若命，德之至也。',
    source: '《庄子·人间世》',
    themes: ['gainloss', 'meaning', 'pressure'],
    ask: '区分一下：这件事里什么是「不可奈何」（真的改不了），什么是你还没试过的？庄子的「安」，只针对前者。',
    experiment: '选一件你认定「没办法」的事，列出三条你从未试过的路径，哪怕看起来笨拙，本周试其中一条。',
  },

  // ============ 道德经 · 做减法 ============
  {
    id: 'ddj-48',
    tradition: 'daodejing',
    text: '为学日益，为道日损。损之又损，以至于无为。',
    source: '《道德经》第四十八章',
    themes: ['pressure', 'choice', 'meaning'],
    ask: '你现在的问题，是「知道的还不够」，还是「背着的太多」？如果答案是后者，第一个该扔掉的是什么？',
    experiment: '列出你正在同时推进的所有事项，按「不做会怎样」排序，本周正式停掉排在最后的两项，并告知相关的人。',
  },
  {
    id: 'ddj-22-shao',
    tradition: 'daodejing',
    text: '少则得，多则惑。',
    source: '《道德经》第二十二章',
    themes: ['choice', 'pressure', 'action'],
    ask: '你纠结的选项里，是不是有几个其实只是「看起来不甘心放弃」？只留一个，你会留哪个？为什么？',
    experiment: '把当前纠结的选项全部写下，划到只剩一个。把被划掉的选项各写一句「放弃它的代价」，看哪个代价其实最小。',
  },
  {
    id: 'ddj-44-zhizu',
    tradition: 'daodejing',
    text: '知足不辱，知止不殆，可以长久。',
    source: '《道德经》第四十四章',
    themes: ['gainloss', 'pressure'],
    ask: '这条赛道上，「止」线在哪里——达到什么状态你就可以停下来享受，而不是继续加码？你定义过这条线吗？',
    experiment: '为你当前最用力的一件事写一条「止线」（具体的、可观察的状态），把它贴在看得见的地方，一周后回看你是否越过了它。',
  },
  {
    id: 'ddj-58-huofu',
    tradition: 'daodejing',
    text: '祸兮福之所倚，福兮祸之所伏。',
    source: '《道德经》第五十八章',
    themes: ['gainloss', 'meaning'],
    ask: '这件「坏事」里藏着什么资源（时间、教训、新关系）？那件「好事」里又埋着什么代价？',
    experiment: '取最近一好一坏两件事，各写三条「反向清单」：坏事带来的三个意外收获，好事附带的三个隐患。',
  },
  {
    id: 'ddj-63-nanshi',
    tradition: 'daodejing',
    text: '天下难事，必作于易；天下大事，必作于细。',
    source: '《道德经》第六十三章',
    themes: ['action', 'pressure', 'self'],
    ask: '这件「难事」最容易的那个切口是什么？小到不可能失败的第一步，长什么样？',
    experiment: '把目标切成一个「两分钟版本」今天执行（写两行字、发一条消息、打开一个文档），只要求自己做到最小版。',
  },
  {
    id: 'ddj-24-qizhe',
    tradition: 'daodejing',
    text: '企者不立，跨者不行。',
    source: '《道德经》第二十四章',
    themes: ['action', 'gainloss', 'self'],
    ask: '踮脚站不稳，跨步走不远——你现在的计划里，哪一步是在「踮脚」：靠透支、靠运气、靠别人配合才能成立？',
    experiment: '检查你本周计划，找出最依赖「超常发挥」的一环，把它改成「正常发挥也能完成」的版本。',
  },
  {
    id: 'ddj-33-zhiren',
    tradition: 'daodejing',
    text: '知人者智，自知者明。胜人者有力，自胜者强。',
    source: '《道德经》第三十三章',
    themes: ['self', 'relationship'],
    ask: '你对那个人的判断很清晰——那你自己在这件事里的角色呢？用同样清晰的话说一遍。',
    experiment: '用你评价对方的同一套标准，给自己写一段「第三方评价」，不辩护、不美化，写完对比两段的措辞差异。',
  },
  {
    id: 'ddj-8-shuishan',
    tradition: 'daodejing',
    text: '上善若水。水善利万物而不争，处众人之所恶，故几于道。',
    source: '《道德经》第八章',
    themes: ['relationship', 'anger', 'meaning'],
    ask: '这场冲突里，「争」赢了你能得到什么？如果像水一样先流向低处、绕开正面，三周后局面会变成什么样？',
    experiment: '选一处你正在僵持的争执，本周主动做一次「不争」的让步（无关原则的），观察对方的反应与你自己的损失。',
  },

  // ============ 孙子兵法 · 评估代价 ============
  {
    id: 'sz-jipian-duosuan',
    tradition: 'sunzi',
    text: '夫未战而庙算胜者，得算多也；未战而庙算不胜者，得算少也。多算胜，少算不胜，而况于无算乎！',
    source: '《孙子兵法·计篇》',
    themes: ['choice', 'action', 'gainloss'],
    ask: '动手之前你「算」过吗：成本、胜率、退路各是什么？如果答案是没算，你是在做决定还是在掷骰子？',
    experiment: '为你纠结的事画一张「庙算表」：投入（钱/时间/关系）、最好结果、最坏结果、退路。四项都填不出具体数字的部分，就是你要先去侦察的地方。',
  },
  {
    id: 'sz-mougong-zhizhi',
    tradition: 'sunzi',
    text: '知彼知己，百战不殆。',
    source: '《孙子兵法·谋攻篇》',
    themes: ['choice', 'relationship', 'self'],
    ask: '你对「彼」（对手、环境、市场、对方）的了解，有多少是一手信息？对「己」的盘点，有没有水分？',
    experiment: '本周补一次「知彼」功课：找三个真正处于「彼」位置的人聊，或读三份一手材料，修正你的判断后再决定。',
  },
  {
    id: 'sz-xingpian-xianwei',
    tradition: 'sunzi',
    text: '昔之善战者，先为不可胜，以待敌之可胜。',
    source: '《孙子兵法·形篇》',
    themes: ['action', 'gainloss', 'pressure'],
    ask: '你现在是在「求胜」，还是先「立于不败」？如果最坏情况明天就发生，你扛得住吗？',
    experiment: '写下你的「不可胜清单」：现金流能撑几个月、技能离开平台还值多少、关系里谁一定接你电话。薄弱项选一个，本周加固。',
  },
  {
    id: 'sz-jiudi-heli',
    tradition: 'sunzi',
    text: '合于利而动，不合于利而止。',
    source: '《孙子兵法·九地篇》',
    themes: ['anger', 'choice', 'relationship'],
    ask: '你现在想做的这个反击／决定，是「合于利」还是「合于气」？情绪退掉之后，利还在吗？',
    experiment: '把想发的火、想做的决定先写下来放进抽屉，48 小时后重读，问自己：这条行动的收益表变了吗？没变再执行。',
  },
  {
    id: 'sz-huogong-zhu',
    tradition: 'sunzi',
    text: '主不可以怒而兴师，将不可以愠而致战。',
    source: '《孙子兵法·火攻篇》',
    themes: ['anger', 'relationship'],
    ask: '怒可以复息，愠可以复悦，但亡国不可以复存、死者不可以复生——你这一仗打出去，有没有不可逆的东西在里面？',
    experiment: '列出这场冲突中「不可逆清单」（说了收不回的话、删了找不回的数据、伤了难修复的关系），凡在清单上的动作，一律先冷却 72 小时。',
  },
  {
    id: 'sz-jiudi-wangdi',
    tradition: 'sunzi',
    text: '投之亡地然后存，陷之死地然后生。',
    source: '《孙子兵法·九地篇》',
    themes: ['action', 'self', 'meaning'],
    ask: '你是一直在等「更安全」的时机，还是其实已经把自己放进了「不行动才最危险」的境地？',
    experiment: '定义你的「死地」：再拖三个月，具体会失去什么？把这个损失写清楚贴在桌前，比打鸡血有效。',
  },

  // ============ 毛泽东选集 · 逼拿事实 ============
  {
    id: 'mao-benben-diaocha',
    tradition: 'mao',
    text: '没有调查，就没有发言权。',
    source: '《反对本本主义》（1930 年 5 月）',
    themes: ['choice', 'relationship', 'gainloss'],
    ask: '你这个判断背后，有几条是你亲自调查来的事实？有几条是听来的、刷到的、想象的？比例是多少？',
    experiment: '把你的结论写在纸上方，下方列「事实栏」：只写你亲眼所见、亲耳所闻、亲手查到的。填不满五行，就先去做调查再谈决定。',
  },
  {
    id: 'mao-shijian-shili',
    tradition: 'mao',
    text: '你要知道梨子的滋味，你就得变革梨子，亲口吃一吃。',
    source: '《实践论》（1937 年 7 月）',
    themes: ['action', 'choice', 'self'],
    ask: '关于这件事，你已经「研究」多久了？有没有一种成本可承受的方式，直接「咬一口」试试？',
    experiment: '设计一个 7 天内的「最小实践」：兼职体验一天、约行业内的人聊一小时、做一个样品出来。用嘴尝，不用脑补。',
  },
  {
    id: 'mao-shijian-zhenli',
    tradition: 'mao',
    text: '马克思主义者认为，只有人们的社会实践，才是人们对于外界认识的真理性的标准。',
    source: '《实践论》（1937 年 7 月）',
    themes: ['self', 'meaning', 'gainloss'],
    ask: '你说「我不行」「这事成不了」——这个认识的检验标准是什么？你拿实践验过它，还是拿想象供着它？',
    experiment: '挑一个你长期相信的自我判断（如「我不擅长表达」），设计一次公开的小实践去检验它，让结果而不是想象说话。',
  },
  {
    id: 'mao-maodun-zhuyao',
    tradition: 'mao',
    text: '捉住了这个主要矛盾，一切问题就迎刃而解了。',
    source: '《矛盾论》（1937 年 8 月）',
    themes: ['pressure', 'choice', 'meaning'],
    ask: '你面临的十个问题里，哪一个是「主要矛盾」——它一解决，其他九个会跟着松动？你现在 80% 的精力花在哪一个上？',
    experiment: '列出所有困扰，两两比较「解决 A 会不会顺带缓解 B」，找出被缓解次数最多的那个，下周把最好的时段只给它。',
  },
  {
    id: 'mao-gaizao-shishi',
    tradition: 'mao',
    text: '「实事」就是客观存在着的一切事物，「是」就是客观事物的内部联系，即规律性，「求」就是我们去研究。',
    source: '《改造我们的学习》（1941 年 5 月）',
    themes: ['meaning', 'self', 'choice'],
    ask: '你是在「求」（研究事实与规律），还是在「许愿」（重复愿望和情绪）？这两种状态在一天里各占几小时？',
    experiment: '连续三天记录时间开销：标注每一小时属于「求是」（获取事实、验证假设）还是「许愿」（焦虑、空想、抱怨）。第四天调整比例。',
  },
  {
    id: 'mao-zhanlue-mieshi',
    tradition: 'mao',
    text: '在战略上藐视敌人，在战术上重视敌人。',
    source: '《关于目前党的政策中的几个重要问题》（1948 年 1 月）',
    themes: ['self', 'pressure', 'action'],
    ask: '你对这件事的态度是不是反过来了——战略上被吓住（「我不可能做到」），战术上又很轻视（从不拆解步骤）？',
    experiment: '写两段话：第一段用最大胆的战略口吻说「这事本质上没什么了不起」；第二段用最务实的战术口吻列出全部细节步骤。两段都写完才算数。',
  },
];
