import { useCallback, useEffect, useRef, useState } from 'react';
import { GIFT_TIERS, currentTermName, drawQuoteFor, estimatePayoutYuan, tierOfDiamond, type GiftTier } from './tiers';
import { THEME_LABELS, TRADITION_META, type Theme } from '@/shared/quotes';
import { JIEQI_INFO } from '@/shared/jieqi';
import { readCalendar, STEMS, BRANCHES, jiaziName } from '@/shared/ganzhi';
import { drawMirrorCard, drawShareCard } from '@/shared/sharecard';
import { yunOfStem, LIUQI, QI_NARRATIVE } from '@/shared/wuyunliuqi';
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

/* ================= 卡片生成 ================= */

/** 昵称种子：同一昵称同一天同一节气，拈选结果可复现；不同昵称结果不同 */
function seedOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function makeTermCard(nickname: string, cardNo: string): string {
  const termName = currentTermName();
  const info = JIEQI_INFO[termName];
  const today = new Date();
  const r = readCalendar(today.getFullYear(), today.getMonth() + 1, today.getDate());
  // 个人拈选：以「昵称+日期+节气」为种，从三候与民俗中各拈一条——同一节气，一人一签
  const seed = seedOf(`${nickname}::${r.year}-${r.month}-${r.day}::${termName}`);
  const hou = info.phenology[seed % info.phenology.length];
  const customBits = info.customs.split(/[；;。]/).map((s) => s.trim()).filter((s) => s.length >= 4);
  const ya = customBits.length > 0 ? customBits[seed % customBits.length] : '';
  const personal = [`为你拈得 · ${hou}`];
  if (ya) personal.push(`今日雅事 · ${ya}`);
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
    nickname,
    cardNo,
    personal,
  });
  return canvas.toDataURL('image/png');
}

function makeMirrorCard(nickname: string, theme: Theme, cardNo: string, salt: string): string {
  // 种子 = 昵称 + 主题 + 礼物名：不同人、不同礼物，抽到的引文不同
  const q = drawQuoteFor(nickname, theme, salt);
  const meta = TRADITION_META[q.tradition];
  const canvas = document.createElement('canvas');
  drawMirrorCard(canvas, {
    nickname,
    serviceName: '执镜签',
    themeLabel: THEME_LABELS[theme],
    traditionName: meta.name,
    lens: meta.lens,
    quoteText: q.text,
    quoteSource: q.source,
    ask: q.ask,
    experiment: q.experiment,
    cardNo,
  });
  return canvas.toDataURL('image/png');
}

function makeYunqiCard(nickname: string, cardNo: string): string {
  const y = new Date().getFullYear();
  const idx = (((y - 4) % 60) + 60) % 60;
  const ganzhi = jiaziName(idx);
  const yun = yunOfStem(STEMS[idx % 10]);
  const qi = LIUQI[BRANCHES[idx % 12]];
  const canvas = document.createElement('canvas');
  const W = 720, H = 720;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const KAI = '"Kaiti SC","KaiTi","STKaiti","Noto Serif SC","Songti SC",serif';
  ctx.fillStyle = '#f6f1e5';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d8cdb4';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5c5548';
  ctx.font = `22px ${KAI}`;
  ctx.fillText('观 俗 · 五 运 六 气 文 化 卡', W / 2, 88);
  ctx.fillStyle = '#9e2b25';
  ctx.font = `26px ${KAI}`;
  ctx.fillText(`赠  @${nickname}`, W / 2, 134);
  if (cardNo) {
    ctx.textAlign = 'right';
    ctx.font = `20px ${KAI}`;
    ctx.fillText(cardNo, W - 52, 60);
    ctx.textAlign = 'center';
  }
  ctx.fillStyle = '#2b2620';
  ctx.font = `88px ${KAI}`;
  ctx.fillText(`${y} · ${ganzhi}`, W / 2, 268);
  ctx.font = `40px ${KAI}`;
  ctx.fillStyle = '#8a6d2f';
  ctx.fillText(`中运 ${yun.element}运${yun.excess}`, W / 2, 352);
  ctx.fillStyle = '#3d5a52';
  ctx.fillText(`${qi.sitian}司天 · ${qi.zaiquan}在泉`, W / 2, 416);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#5c5548';
  ctx.font = `24px ${KAI}`;
  const narrative = QI_NARRATIVE[qi.sitian];
  let line = '';
  let yy = 486;
  for (const ch of narrative) {
    if (ctx.measureText(line + ch).width > W - 160) {
      ctx.fillText(line, 80, yy);
      yy += 40;
      line = ch;
    } else line += ch;
  }
  if (line) ctx.fillText(line, 80, yy);
  ctx.textAlign = 'center';
  ctx.font = `20px ${KAI}`;
  ctx.fillText('医学史视角 · 不构成医疗建议 · 观俗 GUANSU', W / 2, H - 52);
  return canvas.toDataURL('image/png');
}

function cardsForEvent(e: GiftEvent, theme: Theme, seq: number): { tier: GiftTier; cards: string[] } {
  const tier = tierOfDiamond(e.diamond);
  const cardNo = `第 ${seq} 签 · 本场唯一`;
  const cards: string[] = [];
  if (tier.id === 't1') cards.push(makeTermCard(e.nickname, cardNo));
  if (tier.id === 't2') cards.push(makeMirrorCard(e.nickname, theme, cardNo, e.giftName));
  if (tier.id === 't3') cards.push(makeTermCard(e.nickname, cardNo), makeMirrorCard(e.nickname, theme, cardNo, e.giftName), makeYunqiCard(e.nickname, cardNo));
  if (tier.id === 't4') cards.push(makeTermCard(e.nickname, cardNo), makeMirrorCard(e.nickname, theme, cardNo, e.giftName), makeYunqiCard(e.nickname, cardNo));
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

  const ingest = useCallback((raw: Omit<GiftEvent, 'at'>) => {
    if (seen.current.has(raw.id)) return; // 幂等去重
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
        className="max-h-[68vh] rounded-lg border-2 shadow-xl"
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
    <div className="text-center">
      <div className="font-brush text-5xl ink-title">以文会友</div>
      <p className="mt-4 text-sm ink-sub">文化内容服务，不含预测、不含命理 · 签号唯一，昵称入卡</p>
      {/* 刷什么 → 得什么：待机时常驻展示，观众一眼看懂 */}
      <div className="mx-auto mt-6 max-w-md rounded-xl border-2 p-4 text-left" style={{ borderColor: 'hsl(var(--cinnabar))' }}>
        <div className="text-center text-sm font-bold text-cinnabar">刷什么 · 得什么</div>
        <div className="mt-3 space-y-2.5">
          {GIFT_TIERS.map((t) => (
            <div key={t.id} className="flex items-baseline gap-2 text-xs">
              <span className="w-36 shrink-0 ink-title font-bold">{t.examples}</span>
              <span className="shrink-0 text-cinnabar">→</span>
              <span className="shrink-0 font-bold text-cinnabar">{t.serviceName}</span>
              <span className="ink-sub leading-relaxed">{t.perks[0]}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center text-[10px] ink-sub">同一节气，一人一签：为你拈的候与雅事，和别人不一样</div>
      </div>
      {queue.length > 0 && <p className="mt-3 text-sm text-cinnabar">准备中……排队 {queue.length} 位</p>}
    </div>
  );

  if (clean) {
    return (
      <div className="ink-body flex min-h-screen flex-col items-center justify-center p-6">
        {stage}
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
