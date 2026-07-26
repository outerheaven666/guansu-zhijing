import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GIFT_TIERS, currentTermName, drawLotFor, estimatePayoutYuan, tierOfDiamond, type GiftTier } from './tiers';
import { QUOTES, THEME_LABELS, TRADITION_META, type Theme } from '@/shared/quotes';
import { JIEQI_INFO } from '@/shared/jieqi';
import { readCalendar } from '@/shared/ganzhi';
import { drawMirrorCard, drawShareCard, wrapText } from '@/shared/sharecard';
import { FIGURE_LOTS, NARRATIVE_LOTS, DAILY_LOTS, MIRROR_LOTS, PASTIME_LOTS, drawFromPool } from './pools';
import { trackEvent } from '@/shared/analytics';
import { ErrorBoundary } from '@/shared/ErrorBoundary';

/* ================= 礼物事件模型与适配器 ================= */

export interface GiftEvent {
  id: string;
  nickname: string;
  giftName: string;
  diamond: number; // 单件抖币价值 × 数量后的总值
  at: number;
}

declare global {
  interface Window {
    __gzLiveGift?: (e: Omit<GiftEvent, 'at'>) => void;
  }
}

const CHANNEL = 'gz-live-gifts';
const FANBOARD_KEY = 'gz.live.fanboard.v1';

/** 模拟礼物库 */
const SIM_GIFTS = [
  { giftName: '小心心', diamond: 1 },
  { giftName: '啤酒', diamond: 2 },
  { giftName: '你真好看', diamond: 52 },
  { giftName: '墨镜', diamond: 99 },
  { giftName: '热气球', diamond: 520 },
  { giftName: '火箭', diamond: 1000 },
  { giftName: '嘉年华', diamond: 3000 },
];
const SIM_NAMES = ['青梅煮酒', '终南过客', '采薇', '南山下', '听松', '一苇渡江', '知行合一'];

/** 待机暖场条目：当令节气 + 按日轮换的经典与功课，保证无人刷礼物时画面内容也在流动 */
interface WarmItem { tag: string; text: string; sub: string }
function buildWarmItems(): WarmItem[] {
  const term = JIEQI_INFO[currentTermName()];
  const daySeed = Math.floor(Date.now() / 86400000);
  const items: WarmItem[] = [
    {
      tag: `当令 · ${term.name}`,
      text: term.phenology.join('　'),
      sub: `「${term.poem.line}」—— ${term.poem.source}`,
    },
  ];
  for (let i = 0; i < 3; i++) {
    const q = QUOTES[(daySeed * 7 + i * 19) % QUOTES.length];
    items.push({ tag: `暖场 · ${TRADITION_META[q.tradition].name}`, text: q.text, sub: `${q.source} · ${q.ask}` });
  }
  for (let i = 0; i < 2; i++) {
    const d = DAILY_LOTS[(daySeed * 5 + i * 11) % DAILY_LOTS.length];
    items.push({ tag: `今日功课 · ${d.kind}`, text: d.text, sub: '刷个小心心，拈一张写着你名字的节气签' });
  }
  return items;
}

/* ================= 卡片生成 ================= */

function makeTermCard(nickname: string, cardNo: string): string {
  const termName = currentTermName();
  const info = JIEQI_INFO[termName];
  const today = new Date();
  const r = readCalendar(today.getFullYear(), today.getMonth() + 1, today.getDate());
  // 一人一签：三行全部从「与节气共享资料脱钩」的独立大池按昵称种子拈取，
  // 镜语 36 × 功课 26 × 雅趣 24 ≈ 2.2 万种组合——同人当天固定，异人异签
  const dayKey = `${r.year}-${r.month}-${r.day}::${termName}`;
  const { item: mj } = drawFromPool(MIRROR_LOTS, `${nickname}::${dayKey}::mirror`);
  const { item: gk } = drawFromPool(DAILY_LOTS, `${nickname}::${dayKey}::daily`);
  const { item: yq } = drawFromPool(PASTIME_LOTS, `${nickname}::${dayKey}::pastime`);
  const personal = [
    `镜语 · ${mj.text}`,
    `${gk.kind}功课 · ${gk.text}`,
    `雅趣 · ${yq.text}`,
  ];
  const canvas = document.createElement('canvas');
  drawShareCard(canvas, {
    termName: info.name,
    pinyin: info.pinyin,
    longitude: info.longitude,
    dateLabel: `${r.year} 年 ${r.month} 月 ${r.day} 日`,
    pillars: `${r.yearPillar}年  ${r.monthPillar}月  ${r.dayPillar}日`,
    daysText: `正值${info.name}时节`,
    phenology: info.phenology,
    customs: info.customs,
    poemLine: info.poem.line,
    poemSource: info.poem.source,
    nickname: truncNick(nickname),
    cardNo,
    personal,
  });
  return canvas.toDataURL('image/png');
}

/** 中文小写数字（1–99，用于签号） */
function cnNum(n: number): string {
  const d = '零一二三四五六七八九';
  if (n <= 10) return n === 10 ? '十' : d[n];
  if (n < 20) return `十${d[n % 10]}`;
  const t = Math.floor(n / 10);
  const r = n % 10;
  return `${d[t]}十${r ? d[r] : ''}`;
}

/** 卡面昵称安全截断（防长昵称出格） */
function truncNick(n: string): string {
  return n.length > 10 ? `${n.slice(0, 10)}…` : n;
}

function makeMirrorCard(nickname: string, theme: Theme, cardNo: string, salt: string): string {
  // 拈签：全库混抽，种子 = 昵称 + 话题 + 礼物——不同人、不同礼物，拈到的签不同
  const { quote: q, lotNo } = drawLotFor(nickname, `${theme}::${salt}`);
  const meta = TRADITION_META[q.tradition];
  const canvas = document.createElement('canvas');
  drawMirrorCard(canvas, {
    nickname: truncNick(nickname),
    serviceName: '执镜签',
    themeLabel: THEME_LABELS[theme],
    traditionName: meta.name,
    lens: meta.lens,
    quoteText: q.text,
    quoteSource: q.source,
    ask: q.ask,
    experiment: q.experiment,
    cardNo,
    lotName: `${meta.mirror} · 第${cnNum(lotNo)}号`,
    interpretation: meta.lensDesc,
  });
  return canvas.toDataURL('image/png');
}


function makeFigureCard(nickname: string, giftName: string, cardNo: string): string {
  const { item, no } = drawFromPool(FIGURE_LOTS, `${nickname}::${giftName}::figure`);
  const canvas = document.createElement('canvas');
  const W = 720, H = 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const KAI = '"Kaiti SC","KaiTi","STKaiti","Noto Serif SC","Songti SC",serif';
  ctx.fillStyle = '#f6f1e5';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d8cdb4';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 72, H - 72);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8a8070';
  ctx.font = `20px ${KAI}`;
  ctx.fillText('观 俗 · 故 人 签', W / 2, 104);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#3d5a52';
  ctx.font = `22px ${KAI}`;
  ctx.fillText(`故人镜 · 第${cnNum(no)}号`, 70, 88);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9e2b25';
  ctx.fillText(cardNo, W - 70, 88);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9e2b25';
  ctx.font = `26px ${KAI}`;
  ctx.fillText(`赠  @${truncNick(nickname)}`, W / 2, 156);
  ctx.fillStyle = '#2b2620';
  ctx.font = `64px ${KAI}`;
  ctx.fillText(item.name, W / 2, 268);
  ctx.fillStyle = '#9e2b25';
  ctx.fillRect(W / 2 - 40, 296, 80, 4);
  // 处境（史实）
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2b2620';
  ctx.font = `26px ${KAI}`;
  wrapText(ctx, item.story, W - 180).slice(0, 5).forEach((l, i) => ctx.fillText(l, 90, 380 + i * 44));
  // 他如何自处
  ctx.fillStyle = '#9e2b25';
  ctx.font = `26px ${KAI}`;
  wrapText(ctx, item.mirror, W - 180).slice(0, 3).forEach((l, i) => ctx.fillText(l, 90, 640 + i * 44));
  // 换作是你（限两行，给持签功课留出位置）
  ctx.fillStyle = '#3d5a52';
  ctx.font = `24px ${KAI}`;
  ctx.fillText('换 作 是 你', 90, 806);
  ctx.fillStyle = '#5c5548';
  wrapText(ctx, item.ask, W - 180).slice(0, 2).forEach((l, i) => ctx.fillText(l, 90, 850 + i * 40));
  // 持签功课：按昵称+礼物从功课池拈取——同一支故人签，不同人也有专属一行
  const { item: hw } = drawFromPool(DAILY_LOTS, `${nickname}::${giftName}::fig-hw`);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8a6d2f';
  ctx.font = `22px ${KAI}`;
  ctx.fillText(`持签功课 · ${hw.text}`, W / 2, 950);
  // 页脚（出处为每签不同，保留墨色；雷同提示行淡化）
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5c5548';
  ctx.font = `20px ${KAI}`;
  ctx.fillText(`—— ${item.source}`, W / 2, 986);
  ctx.fillStyle = '#8a8070';
  ctx.font = `18px ${KAI}`;
  ctx.fillText('他走过的路，是你的一面镜子 · 文化内容，非命运暗示', W / 2, 1024);
  ctx.fillText('观俗 GUANSU', W / 2, 1052);
  return canvas.toDataURL('image/png');
}

function makeNarrativeCard(nickname: string, giftName: string, cardNo: string): string {
  const { item, no } = drawFromPool(NARRATIVE_LOTS, `${nickname}::${giftName}::narrative`);
  const canvas = document.createElement('canvas');
  const W = 720, H = 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const KAI = '"Kaiti SC","KaiTi","STKaiti","Noto Serif SC","Songti SC",serif';
  ctx.fillStyle = '#f6f1e5';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d8cdb4';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 72, H - 72);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8a8070';
  ctx.font = `20px ${KAI}`;
  ctx.fillText('观 俗 · 观 心 签', W / 2, 104);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#3d5a52';
  ctx.font = `22px ${KAI}`;
  ctx.fillText(`叙事练习 · 第${cnNum(no)}号`, 70, 88);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9e2b25';
  ctx.fillText(cardNo, W - 70, 88);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9e2b25';
  ctx.font = `26px ${KAI}`;
  ctx.fillText(`赠  @${truncNick(nickname)}`, W / 2, 156);
  ctx.fillStyle = '#5c5548';
  ctx.font = `24px ${KAI}`;
  ctx.fillText('你为什么相信这句话——', W / 2, 232);
  ctx.fillStyle = '#2b2620';
  ctx.font = `54px ${KAI}`;
  ctx.fillText(`「${item.label}」`, W / 2, 316);
  ctx.fillStyle = '#9e2b25';
  ctx.fillRect(W / 2 - 40, 344, 80, 4);
  // 三问（每问限两行：防极端长文顶到页脚，并给持签功课留位）
  const steps: Array<[string, string, string]> = [
    ['一 问 · 溯源', item.q1, '#9e2b25'],
    ['二 问 · 代价', item.q2, '#8a6d2f'],
    ['三 问 · 重写', item.q3, '#3d5a52'],
  ];
  let y = 428;
  ctx.textAlign = 'left';
  for (const [title, text, color] of steps) {
    ctx.fillStyle = color;
    ctx.font = `24px ${KAI}`;
    ctx.fillText(title, 90, y);
    ctx.fillStyle = '#2b2620';
    ctx.font = `24px ${KAI}`;
    const lines: string[] = wrapText(ctx, text, W - 180).slice(0, 2);
    lines.forEach((l: string, i: number) => ctx.fillText(l, 90, y + 44 + i * 38));
    y += 44 + lines.length * 38 + 36;
  }
  // 持签功课：按昵称+礼物从功课池拈取——同一套练习，不同人也有专属一行
  const { item: hw } = drawFromPool(DAILY_LOTS, `${nickname}::${giftName}::nv-hw`);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8a6d2f';
  ctx.font = `22px ${KAI}`;
  ctx.fillText(`持签功课 · ${hw.text}`, W / 2, Math.min(y + 46, 950));
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8a8070';
  ctx.font = `18px ${KAI}`;
  ctx.fillText('自我叙事练习 · 不是推算 · 答案写不写，由你', W / 2, 1014);
  ctx.fillText('观俗 GUANSU', W / 2, 1046);
  return canvas.toDataURL('image/png');
}

function cardsForEvent(e: GiftEvent, theme: Theme, seq: number): { tier: GiftTier; cards: string[] } {
  const tier = tierOfDiamond(e.diamond);
  const cardNo = `第 ${seq} 签 · 本场唯一`;
  const cards: string[] = [];
  // 四档四池，互不叠加：每一档从自己规格的签池中独立随机
  if (tier.id === 't1') cards.push(makeTermCard(e.nickname, cardNo));
  if (tier.id === 't2') cards.push(makeMirrorCard(e.nickname, theme, cardNo, e.giftName));
  if (tier.id === 't3') cards.push(makeFigureCard(e.nickname, e.giftName, cardNo));
  if (tier.id === 't4') cards.push(makeNarrativeCard(e.nickname, e.giftName, cardNo));
  return { tier, cards };
}

/* ================= 主界面 ================= */

interface ActiveShow {
  event: GiftEvent;
  tier: GiftTier;
  cards: string[];
  cardIndex: number;
  remaining: number;
}

const THEMES = Object.keys(THEME_LABELS) as Theme[];

function LiveApp() {
  const [mode, setMode] = useState<'sim' | 'hook'>('sim');
  const [theme, setTheme] = useState<Theme>('choice');
  const [events, setEvents] = useState<GiftEvent[]>([]);
  const [queue, setQueue] = useState<GiftEvent[]>([]);
  const [active, setActive] = useState<ActiveShow | null>(null);
  const [fanboard, setFanboard] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FANBOARD_KEY) ?? '[]');
    } catch {
      return [];
    }
  });
  const seen = useRef(new Set<string>());
  const recentContent = useRef(new Map<string, number>()); // giftName|diamond → 时间戳（「观众」兜底事件去重用）

  const ingest = useCallback((raw: Omit<GiftEvent, 'at'>) => {
    if (seen.current.has(raw.id)) return; // 幂等去重
    const now = Date.now();
    // 「观众」兜底昵称 = 连接器昵称解析失败。30s 内已有同礼物同数量事件时，
    // 大概率是连击动画/聊天重渲染的重复上报，直接丢弃（真礼物的昵称一般能解析出来）
    const ck = `${raw.giftName}|${raw.diamond}`;
    if (raw.nickname === '观众') {
      const last = recentContent.current.get(ck) ?? 0;
      if (now - last < 30000) return;
    }
    recentContent.current.set(ck, now);
    seen.current.add(raw.id);
    const e: GiftEvent = { ...raw, at: Date.now() };
    setEvents((prev) => [e, ...prev].slice(0, 30));
    setQueue((prev) => (prev.length >= 50 ? prev : [...prev, e]));
    trackEvent('live_gift', { tier: tierOfDiamond(e.diamond).id, diamond: e.diamond });
    if (tierOfDiamond(e.diamond).id === 't4') {
      setFanboard((prev) => {
        const next = [e.nickname, ...prev.filter((n) => n !== e.nickname)].slice(0, 12);
        localStorage.setItem(FANBOARD_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, []);

  // 对接模式：① 本地直播服务 SSE（同源 /api/events） ② BroadcastChannel ③ window.__gzLiveGift
  const [relayOk, setRelayOk] = useState(false);

  // 待机暖场轮播：每 8 秒换一条，画面始终有内容流动
  const warmItems = useMemo(buildWarmItems, []);
  const [warmIdx, setWarmIdx] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setWarmIdx((i) => (i + 1) % warmItems.length), 8000);
    return () => window.clearInterval(t);
  }, [warmItems.length]);
  const warm = warmItems[warmIdx];
  useEffect(() => {
    window.__gzLiveGift = (e) => ingest(e);
    const bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (msg) => {
      const d = msg.data;
      if (d && d.type === 'gift' && d.id && d.nickname) {
        ingest({ id: String(d.id), nickname: String(d.nickname), giftName: String(d.giftName ?? '礼物'), diamond: Number(d.diamond) || 0 });
      }
    };
    trackEvent('page_view', { app: 'live' });

    // 探测本地直播服务：页面由 live-relay 托管时同源可用
    let es: EventSource | null = null;
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no relay'))))
      .then(() => {
        setRelayOk(true);
        es = new EventSource('/api/events');
        es.addEventListener('gift', (ev) => {
          try {
            const d = JSON.parse((ev as MessageEvent).data);
            ingest({ id: String(d.id), nickname: String(d.nickname), giftName: String(d.giftName), diamond: Number(d.diamond) || 0 });
          } catch {
            /* 忽略坏帧 */
          }
        });
      })
      .catch(() => setRelayOk(false));

    return () => {
      bc.close();
      es?.close();
    };
  }, [ingest]);

  // 队列调度：无活动时取下一个，按档位展示
  useEffect(() => {
    if (active || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    const { tier, cards } = cardsForEvent(next, theme, events.length || 1);
    setActive({ event: next, tier, cards, cardIndex: 0, remaining: tier.displaySeconds });
  }, [active, queue, theme, events.length]);

  // 倒计时与多卡轮播
  useEffect(() => {
    if (!active) return;
    if (active.remaining <= 0) {
      setActive(null);
      return;
    }
    const t = window.setTimeout(() => {
      setActive((a) => {
        if (!a) return a;
        const remaining = a.remaining - 1;
        const per = Math.max(1, Math.floor(a.tier.displaySeconds / a.cards.length));
        return { ...a, remaining, cardIndex: Math.min(a.cards.length - 1, Math.floor((a.tier.displaySeconds - remaining) / per)) };
      });
    }, 1000);
    return () => window.clearTimeout(t);
  }, [active]);

  const simulate = (gift: (typeof SIM_GIFTS)[number], count = 1) => {
    const nickname = SIM_NAMES[Math.floor(Math.random() * SIM_NAMES.length)];
    ingest({
      id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nickname,
      giftName: count > 1 ? `${gift.giftName}×${count}` : gift.giftName,
      diamond: gift.diamond * count,
    });
  };

  const totalDiamond = events.reduce((s, e) => s + e.diamond, 0);

  // 观众纯净模式：?clean=1 只保留上屏舞台（OBS 浏览器源专用，无主播控件）
  const clean = new URLSearchParams(window.location.search).has('clean');

  // 上屏舞台（观众可见部分，普通模式与纯净模式共用）
  const stage = active ? (
    <div className="flex w-full flex-col items-center">
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-full bg-cinnabar px-3 py-1 text-sm font-bold text-[hsl(43_40%_96%)]">
          {active.tier.serviceName}
        </span>
        <span className="text-lg font-bold ink-title">@{active.event.nickname}</span>
        <span className="text-sm ink-sub">送出 {active.event.giftName}</span>
        <span className="rounded-full border hairline px-2 py-0.5 text-xs ink-sub">{active.remaining}s</span>
      </div>
      <img
        src={active.cards[active.cardIndex]}
        alt={`${active.tier.serviceName}卡片`}
        className={`${clean ? 'max-h-[82vh]' : 'max-h-[68vh]'} rounded-lg border-2 shadow-xl`}
        style={{ borderColor: 'hsl(var(--cinnabar))' }}
      />
      {active.cards.length > 1 && (
        <div className="mt-3 flex gap-1.5">
          {active.cards.map((_, i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full ${i === active.cardIndex ? 'bg-cinnabar' : 'bg-[hsl(var(--line))]'}`} />
          ))}
        </div>
      )}
      <div className="mt-3 text-xs ink-sub">长按 / 截图即可带走你的专属卡 · 排队 {queue.length} 位</div>
    </div>
  ) : (
    <div className="relative text-center">
      {/* 待机粒子：缓慢漂移，画面持续微动，防平台误判静止 */}
      <div aria-hidden className="pointer-events-none absolute -inset-12">
        <span className="anim-drift-a absolute left-[6%] top-[10%] h-3 w-3 rounded-full bg-cinnabar opacity-20" />
        <span className="anim-drift-b absolute right-[8%] top-[22%] h-2 w-2 rounded-full bg-pine opacity-25" />
        <span className="anim-drift-c absolute left-[14%] bottom-[16%] h-2.5 w-2.5 rounded-full bg-gold opacity-25" />
        <span className="anim-drift-b absolute right-[16%] bottom-[8%] h-3 w-3 rounded-full bg-cinnabar opacity-15" />
        <span className="anim-ember absolute left-[46%] top-[4%] h-1.5 w-1.5 rounded-full bg-cinnabar opacity-30" />
        <span className="anim-ember absolute right-[38%] bottom-[24%] h-1.5 w-1.5 rounded-full bg-pine opacity-30" />
      </div>
      <div className="anim-breathe font-brush text-6xl ink-title">以文会友</div>
      <p className="mt-4 text-base ink-sub">拈一段传统智慧，照一照当下的自己 · 签无吉凶，皆是镜子</p>
      {/* 暖场轮播：每 8 秒自动换一条，待机也有内容在流动 */}
      <div className="mx-auto mt-6 max-w-xl" key={warmIdx}>
        <div className="anim-fade-in rounded-xl border hairline px-6 py-4">
          <div className="text-xs font-bold text-cinnabar">{warm.tag}</div>
          <div className="mt-1.5 text-lg leading-relaxed ink-title">{warm.text}</div>
          <div className="mt-1 line-clamp-2 text-xs ink-sub">{warm.sub}</div>
        </div>
      </div>
      {/* 刷什么 → 得什么：普通模式待机时常驻展示；clean 模式移入左栏常驻，此处不再重复 */}
      {!clean && (
      <div className="mx-auto mt-6 max-w-lg rounded-xl border-2 p-5 text-left" style={{ borderColor: 'hsl(var(--cinnabar))' }}>
        <div className="text-center text-lg font-bold text-cinnabar">刷什么 · 得什么</div>
        <div className="mt-3 space-y-3">
          {GIFT_TIERS.map((t) => (
            <div key={t.id} className="text-sm">
              <div className="flex items-baseline gap-2">
                <span className="w-44 shrink-0 ink-title font-bold">{t.examples}</span>
                <span className="shrink-0 text-cinnabar">→</span>
                <span className="shrink-0 font-bold text-cinnabar">{t.serviceName}</span>
                <span className="ink-sub text-xs">（约 {t.minDiamond}–{t.maxDiamond === Infinity ? '∞' : t.maxDiamond} 币）</span>
              </div>
              <div className="mt-1 pl-1 text-[13px] leading-relaxed ink-sub">{t.plainDesc}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center text-xs ink-sub">
          随机拈取的文化内容，可复现可核对 · 签号唯一，昵称入卡 · 不预测、不占卜、不承诺改运
        </div>
      </div>
      )}
      {queue.length > 0 && <p className="mt-3 text-base text-cinnabar">准备中……排队 {queue.length} 位</p>}
    </div>
  );

  // 排队公示：刷礼物的人实时看到自己排第几、前面还有谁
  const queueStrip = active || queue.length > 0 ? (
    <div className="mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs">
      {active && (
        <span className="rounded-full bg-cinnabar px-2.5 py-1 font-bold text-[hsl(43_40%_96%)]">
          正在展示 @{active.event.nickname} · 剩 {active.remaining}s
        </span>
      )}
      {queue.slice(0, 8).map((e, i) => {
        // 预估等待 = 当前展示剩余 + 前面每个人签档的展示时长
        const waitSec = (active?.remaining ?? 0)
          + queue.slice(0, i).reduce((s, q) => s + tierOfDiamond(q.diamond).displaySeconds, 0);
        const waitLabel = waitSec >= 60 ? `约等 ${Math.round(waitSec / 60)} 分钟` : `约等 ${waitSec}s`;
        return (
          <span key={e.id} className="rounded-full border hairline px-2.5 py-1 ink-sub">
            #{i + 1} @{e.nickname} · {tierOfDiamond(e.diamond).serviceName} · {waitLabel}
          </span>
        );
      })}
      {queue.length > 8 && <span className="ink-sub">…共 {queue.length} 位在排</span>}
    </div>
  ) : null;

  if (clean) {
    // 观众纯净模式（OBS 浏览器源）：左栏上=刷什么得什么（常驻大字），左栏下=排队公示，右栏=签图舞台
    return (
      <div className="ink-body flex min-h-screen gap-5 p-5">
        {/* 左栏 */}
        <aside className="flex w-[360px] shrink-0 flex-col gap-4">
          {/* 刷什么 · 得什么（常驻，手机上也能看清的字号） */}
          <div className="rounded-xl border-2 p-4" style={{ borderColor: 'hsl(var(--cinnabar))' }}>
            <div className="text-center text-2xl font-bold text-cinnabar">刷什么 · 得什么</div>
            <div className="mt-3 space-y-3.5">
              {GIFT_TIERS.map((t) => (
                <div key={t.id}>
                  <div className="flex flex-wrap items-baseline gap-x-2 text-lg">
                    <span className="ink-title font-bold">{t.examples}</span>
                    <span className="text-cinnabar">→</span>
                    <span className="font-bold text-cinnabar">{t.serviceName}</span>
                  </div>
                  <div className="mt-1 text-[15px] leading-relaxed ink-sub">{t.plainDesc}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t hairline pt-2 text-center text-xs ink-sub">
              随机拈取 · 可复现可核对 · 签号唯一，昵称入卡 · 不预测、不占卜
            </div>
          </div>

          {/* 排队公示（竖排：谁在排、排第几、约等多久） */}
          <div className="paper-card flex-1 overflow-hidden rounded-xl p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold ink-title">排队公示</span>
              <span className="text-sm ink-sub">
                {active || queue.length > 0 ? `${queue.length + (active ? 1 : 0)} 位` : '虚位以待'}
              </span>
            </div>
            <div className="mt-2 space-y-1.5 overflow-y-auto">
              {active && (
                <div className="rounded-lg bg-cinnabar px-3 py-2 text-sm font-bold text-[hsl(43_40%_96%)]">
                  ▶ @{active.event.nickname} · {active.tier.serviceName} · 剩 {active.remaining}s
                </div>
              )}
              {queue.slice(0, 10).map((e, i) => {
                const waitSec = (active?.remaining ?? 0)
                  + queue.slice(0, i).reduce((s, q) => s + tierOfDiamond(q.diamond).displaySeconds, 0);
                const waitLabel = waitSec >= 60 ? `约等 ${Math.round(waitSec / 60)} 分钟` : `约等 ${waitSec}s`;
                return (
                  <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border hairline px-3 py-1.5 text-sm">
                    <span className="truncate ink-title font-bold">#{i + 1} @{e.nickname}</span>
                    <span className="shrink-0 text-xs ink-sub">{tierOfDiamond(e.diamond).serviceName} · {waitLabel}</span>
                  </div>
                );
              })}
              {queue.length > 10 && <div className="pt-1 text-center text-xs ink-sub">…共 {queue.length} 位在排</div>}
              {!active && queue.length === 0 && (
                <div className="pt-2 text-sm ink-sub">刷礼物即上屏，先到先得</div>
              )}
            </div>
          </div>
        </aside>

        {/* 右栏：签图舞台（视觉焦点，占满剩余空间） */}
        <main className="flex min-w-0 flex-1 flex-col items-center justify-center">
          {stage}
        </main>

        {/* 底部滚动条：持续横向滚动，随时有像素变化 */}
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 overflow-hidden border-t hairline bg-[hsl(var(--paper))] py-1.5">
          <div className="anim-marquee flex w-max whitespace-nowrap text-xs ink-sub">
            {[0, 1].map((k) => (
              <span key={k}>
                {'刷礼物即上屏 · 先到先得　▏　节气签 ← 小心心 / 玫瑰　▏　执镜签 ← 你真好看 / 墨镜　▏　故人签 ← 热气球 / 马车　▏　观心签 ← 火箭 / 嘉年华　▏　签无吉凶，皆是镜子　▏　文化内容 · 不预测 · 不占卜 · 不承诺改运　▏　'}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ink-body min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        {/* 顶栏 */}
        <header className="flex flex-wrap items-center gap-3 border-b hairline pb-3">
          <span className="seal h-12 w-7 text-xs">直播</span>
          <div className="min-w-0 flex-1">
            <h1 className="ink-title text-lg font-bold">观俗 · 执镜 直播互动台</h1>
            <p className="text-[11px] ink-sub">礼物分档 → 差异化文化内容服务 · OBS 浏览器源直接上屏 · 文化内容，不含预测</p>
          </div>
          <div className="flex gap-2 text-xs">
            <button className="tab-ink" data-active={mode === 'sim'} onClick={() => setMode('sim')}>演示模式</button>
            <button className="tab-ink" data-active={mode === 'hook'} onClick={() => setMode('hook')}>对接模式</button>
            <a className="btn-ink-outline" href="?clean=1" target="_blank" rel="noreferrer">观众模式（OBS 用）</a>
            <a className="btn-ink-outline" href="../index.html">返回门户</a>
          </div>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-[340px_1fr]">
          {/* 左栏 */}
          <div className="space-y-4">
            {/* 本周主题 */}
            <div className="paper-card rounded-xl p-4">
              <div className="text-sm font-bold ink-title">本周执镜主题</div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {THEMES.map((t) => (
                  <button key={t} className="tab-ink !px-2 !py-1.5 text-xs" data-active={theme === t} onClick={() => setTheme(t)}>
                    {THEME_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* 分档规则 */}
            <div className="paper-card rounded-xl p-4">
              <div className="text-sm font-bold ink-title">礼物 → 服务 分档</div>
              <div className="mt-2 space-y-2">
                {GIFT_TIERS.map((t) => (
                  <div key={t.id} className="rounded-lg border hairline p-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-cinnabar">{t.serviceName}</span>
                      <span className="text-[10px] ink-sub">
                        {t.minDiamond}–{t.maxDiamond === Infinity ? '∞' : t.maxDiamond} 抖币 · {t.examples}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] leading-relaxed ink-sub">{t.serviceDesc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 模拟面板 */}
            {mode === 'sim' && (
              <div className="paper-card rounded-xl p-4">
                <div className="text-sm font-bold ink-title">模拟刷礼物</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SIM_GIFTS.map((g) => (
                    <button key={g.giftName} className="btn-ink-outline !px-2.5 !py-1 text-xs" onClick={() => simulate(g)}>
                      {g.giftName}（{g.diamond}币）
                    </button>
                  ))}
                  <button className="btn-cinnabar !px-2.5 !py-1 text-xs" onClick={() => simulate(SIM_GIFTS[4], 3)}>
                    热气球×3 连击
                  </button>
                </div>
              </div>
            )}

            {/* 对接说明 */}
            {mode === 'hook' && (
              <div className="paper-card rounded-xl p-4 text-[11px] leading-relaxed ink-sub">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${relayOk ? 'bg-green-600' : 'bg-gray-400'}`} />
                  <span className="text-sm font-bold ink-title">
                    本地直播服务{relayOk ? '已连接（真实事件流）' : '未连接（运行 npm run live 启动）'}
                  </span>
                </div>
                <p className="mt-2">
                  <span className="font-bold text-pine">① 真实直播间（测试号先行）：</span>
                  本机运行 <code className="rounded bg-[hsl(var(--paper-deep))] px-1">npm run live</code>，
                  OBS 浏览器源指向 <code className="rounded bg-[hsl(var(--paper-deep))] px-1">http://localhost:7210/live/</code>，
                  再按《真实直播间接入指南》安装礼物连接器（油猴脚本），礼物事件即实时上屏并落盘存档。
                </p>
                <p className="mt-2">
                  <span className="font-bold text-pine">② 官方路径（正式经营）：</span>
                  企业主体申请抖音开放平台「直播小玩法 / 互动工具」，审核后将事件 POST 到本页。本页监听：
                </p>
                <pre className="paper-card-deep mt-1 overflow-x-auto rounded-md p-2 text-[10px]">
{`// 方式 A：HTTP POST（直播服务）
POST http://localhost:7210/api/gift
{ "id":"...", "nickname":"...", "giftName":"...", "diamond":99 }
// 方式 B：同浏览器 BroadcastChannel
new BroadcastChannel('gz-live-gifts')
  .postMessage({ type:'gift', id, nickname, giftName, diamond });
// 方式 C：页内函数（浏览器源注入 JS）
window.__gzLiveGift({ id, nickname, giftName, diamond });`}
                </pre>
                <p className="mt-2">
                  <span className="font-bold text-cinnabar">风险提示：</span>
                  非官方抓取方式违反平台协议风险高、可能封号，仅建议测试号验证流程，正式经营请走官方路径。
                  事件字段：id（去重键）、nickname、giftName、diamond（总抖币）。队列上限 50，超出丢弃；同一 id 幂等。
                </p>
              </div>
            )}

            {/* 数据栏 */}
            <div className="paper-card rounded-xl p-4">
              <div className="text-sm font-bold ink-title">本场数据</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                <div className="paper-card-deep rounded-lg p-2">
                  <div className="text-xl font-bold text-cinnabar">{events.length}</div>
                  <div className="text-[10px] ink-sub">礼物事件</div>
                </div>
                <div className="paper-card-deep rounded-lg p-2">
                  <div className="text-xl font-bold text-cinnabar">{totalDiamond}</div>
                  <div className="text-[10px] ink-sub">总抖币</div>
                </div>
                <div className="paper-card-deep rounded-lg p-2">
                  <div className="text-xl font-bold text-cinnabar">≈¥{estimatePayoutYuan(totalDiamond).toFixed(1)}</div>
                  <div className="text-[10px] ink-sub">估算分成（50%）</div>
                </div>
                <div className="paper-card-deep rounded-lg p-2">
                  <div className="text-xl font-bold text-cinnabar">{queue.length}</div>
                  <div className="text-[10px] ink-sub">排队中</div>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed ink-sub">1 元 ≈ 10 抖币；个人主播分成通常约为打赏流水 50%（平台分成后，公会另计）。</p>
            </div>

            {/* 知音榜 */}
            {fanboard.length > 0 && (
              <div className="paper-card rounded-xl p-4">
                <div className="text-sm font-bold ink-title">本周知音榜（典藏礼）</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {fanboard.map((n, i) => (
                    <span key={n} className="rounded-full border border-cinnabar px-2.5 py-1 text-[11px] text-cinnabar">
                      {i + 1}. @{n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 事件流 */}
            <div className="paper-card rounded-xl p-4">
              <div className="text-sm font-bold ink-title">礼物事件流</div>
              <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto">
                {events.length === 0 && <div className="text-xs ink-sub">暂无事件——用左侧模拟面板刷一个试试。</div>}
                {events.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-cinnabar px-1.5 py-0.5 text-[9px] text-[hsl(43_40%_96%)]">
                      {tierOfDiamond(e.diamond).serviceName}
                    </span>
                    <span className="ink-title font-bold">@{e.nickname}</span>
                    <span className="ink-sub">送出 {e.giftName}（{e.diamond}币）</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右栏：上屏区（OBS 浏览器源截取此区域，或直接用 ?clean=1 纯净模式） */}
          <div className="paper-card relative flex min-h-[560px] flex-col items-center justify-center overflow-hidden rounded-xl p-6">
            <div className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-[10px] text-white/80">
              OBS 上屏区 · 浏览器源截取本卡片
            </div>
            {stage}
            {queueStrip}
          </div>
        </div>

        {/* 合规页脚 */}
        <footer className="mt-4 rounded-lg border-l-4 p-3 text-[11px] leading-relaxed ink-sub" style={{ borderLeftColor: 'hsl(var(--cinnabar))', background: 'hsl(4 40% 96%)' }}>
          <span className="font-bold text-cinnabar">合规底线：</span>
          本互动台交付物全部为文化内容（节气民俗、经典引文、叙事练习），不提供任何预测、算命、占卜服务；
          直播口播请勿承诺「改运」「灵验」；须按平台规则提示「未成年人禁止打赏」；
          礼物数据正式经营请使用抖音开放平台官方能力，非官方抓取方式有封号风险。
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary appName="直播互动台">
      <LiveApp />
    </ErrorBoundary>
  );
}
