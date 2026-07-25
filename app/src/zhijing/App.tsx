import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/shared/layout';
import { CRISIS_RESOURCES, respond, type CoachReply, type CrisisReply } from '@/shared/engine';
import { TRADITION_META } from '@/shared/quotes';
import { trackEvent } from '@/shared/analytics';
import { ErrorBoundary } from '@/shared/ErrorBoundary';

interface Msg {
  id: string;
  role: 'user' | 'mirror';
  text?: string;
  reply?: CoachReply | CrisisReply;
  time: number;
}

const STORAGE_KEY = 'zhijing.chat.v1';
const CONSENT_KEY = 'zhijing.consent.v1';

const SAMPLES = [
  '最近工作压力特别大，天天加班，感觉快撑不住了',
  '拿到了两个 offer，一个钱多一个更喜欢，纠结了半个月',
  '同事把锅甩给我，我越想越气，想当面跟他对质',
  '定了很多计划都坚持不下来，我是不是就这样了',
  '人到中年，突然不知道自己这么忙是为了什么',
];

function loadMsgs(): Msg[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

/** 全部专业求助资源（常驻入口用，合并三类） */
function AllResources() {
  return (
    <div className="space-y-4">
      {(Object.keys(CRISIS_RESOURCES) as Array<keyof typeof CRISIS_RESOURCES>).map((k) => {
        const res = CRISIS_RESOURCES[k];
        const label = { mental: '心理支持与危机干预', medical: '重大疾病相关', legal_finance: '法律与财务' }[k];
        return (
          <div key={k}>
            <div className="text-sm font-bold text-cinnabar">{label}</div>
            <ul className="mt-2 space-y-2">
              {res.items.map((r) => (
                <li key={r.name} className="rounded-md bg-[hsl(45_40%_98%)] p-3">
                  <div className="text-sm font-bold ink-title">{r.name}</div>
                  <div className="mt-0.5 text-xs leading-relaxed ink-sub">{r.detail}</div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose?: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="paper-card max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold ink-title">{title}</h3>
          {onClose && (
            <button className="btn-ink-outline !px-2.5 !py-1 text-xs" onClick={onClose} aria-label="关闭">
              关闭
            </button>
          )}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function CoachCard({ reply }: { reply: CoachReply }) {
  return (
    <div className="space-y-4">
      {reply.inherited && (
        <div className="text-[11px] text-pine">（延续了你上文的话题）</div>
      )}
      {reply.themes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="ink-sub">我从你的话里读到的信号：</span>
          {reply.themes.slice(0, 3).map((t) => (
            <span key={t.theme} className="rounded-full border hairline px-2 py-0.5 ink-sub">
              {t.label}
            </span>
          ))}
        </div>
      )}

      {reply.quotes.map((q) => {
        const meta = TRADITION_META[q.tradition];
        return (
          <div key={q.id} className="rounded-lg border hairline bg-[hsl(45_40%_97%)] p-4">
            <div className="flex items-center gap-2 text-[11px]">
              <span className={`font-bold ${meta.color}`}>{meta.name}</span>
              <span className="rounded-full bg-cinnabar px-2 py-0.5 text-[10px] text-[hsl(43_40%_96%)]">{meta.lens}</span>
            </div>
            <blockquote className="mt-2 border-l-2 pl-3" style={{ borderColor: 'hsl(var(--cinnabar))' }}>
              <div className="text-sm leading-relaxed ink-title">「{q.text}」</div>
              <div className="mt-1 text-xs ink-sub">出处：{q.source}</div>
            </blockquote>
            <div className="mt-3 text-sm leading-relaxed">
              <span className="font-bold text-cinnabar">镜问：</span>
              <span className="ink-title">{q.ask}</span>
            </div>
            <div className="mt-2 rounded-md bg-[hsl(var(--paper-deep))] p-3 text-xs leading-relaxed ink-sub">
              <span className="font-bold text-pine">可执行小实验：</span>
              {q.experiment}
            </div>
          </div>
        );
      })}

      <div className="grid gap-2 text-[11px] leading-relaxed sm:grid-cols-2">
        <div className="rounded-md border hairline p-2.5 ink-sub">
          <span className="font-bold ink-title">解释置信度：约 {Math.round(reply.confidence * 100)}%</span>
          <br />
          匹配置信度为主观估计，表示引文与情境的贴合程度，不代表预测准确率。
        </div>
        <div className="rounded-md border hairline p-2.5 ink-sub">
          <span className="font-bold ink-title">适用边界</span>
          <br />
          {reply.boundary}
        </div>
      </div>
    </div>
  );
}

function CrisisCard({ reply }: { reply: CrisisReply }) {
  const res = CRISIS_RESOURCES[reply.hit.category];
  return (
    <div className="rounded-lg border-2 p-4" style={{ borderColor: 'hsl(var(--cinnabar))', background: 'hsl(4 40% 96%)' }}>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cinnabar text-xs font-bold text-[hsl(43_40%_96%)]">!</span>
        <span className="text-sm font-bold text-cinnabar">检测到「{reply.hit.categoryLabel}」——执镜在此停下，转为转介</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed ink-sub">{res.intro}</p>
      <ul className="mt-3 space-y-2">
        {res.items.map((r) => (
          <li key={r.name} className="rounded-md bg-[hsl(45_40%_98%)] p-3">
            <div className="text-sm font-bold ink-title">{r.name}</div>
            <div className="mt-0.5 text-xs leading-relaxed ink-sub">{r.detail}</div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed ink-sub">
        等眼前的事情有专业的人接手之后，执镜随时可以继续陪你「把问题看清楚」。
      </p>
    </div>
  );
}

function ZhijingApp() {
  const [msgs, setMsgs] = useState<Msg[]>(loadMsgs);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [consented, setConsented] = useState(() => localStorage.getItem(CONSENT_KEY) === '1');
  const [showHelp, setShowHelp] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent('page_view', { app: 'zhijing' });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-50)));
  }, [msgs]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, thinking]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || thinking) return;
    setInput('');
    const userMsg: Msg = { id: `u${Date.now()}`, role: 'user', text, time: Date.now() };
    setMsgs((m) => [...m, userMsg]);
    setThinking(true);

    // 多轮上下文：最近 5 条用户输入；近 6 条已用引文避免重复
    const contextInputs = msgs.filter((m) => m.role === 'user').slice(-5).map((m) => m.text ?? '');
    const recentQuoteIds = msgs
      .flatMap((m) => (m.reply?.kind === 'coach' ? m.reply.quotes.map((q) => q.id) : []))
      .slice(-6);
    window.setTimeout(() => {
      const reply = respond(text, recentQuoteIds, contextInputs);
      trackEvent('zhijing_message', {
        crisis: reply.kind === 'crisis',
        theme: reply.kind === 'coach' ? (reply.themes[0]?.label ?? '无') : reply.hit.categoryLabel,
      });
      if (reply.kind === 'crisis') trackEvent('zhijing_crisis', { category: reply.hit.category });
      setMsgs((m) => [...m, { id: `m${Date.now()}`, role: 'mirror', reply, time: Date.now() }]);
      setThinking(false);
    }, 500);
  };

  return (
    <AppShell appName="执镜" appMark="执镜" tagline="引用经典的苏格拉底式 AI 陪练 —— 不预测、不诊断、不承诺改命">
      {/* 首次知情确认 */}
      {!consented && (
        <Modal title="使用之前，请先知悉">
          <div className="space-y-3 text-sm leading-relaxed ink-sub">
            <p>
              执镜是一面「引用经典的镜子」：它用庄子、道德经、孙子兵法、毛选中的原文帮你换角度看问题。
            </p>
            <ul className="space-y-1.5">
              <li className="flex gap-2"><span className="shrink-0 text-cinnabar">✕</span>它不预测未来，不测婚姻、财运、疾病、考试。</li>
              <li className="flex gap-2"><span className="shrink-0 text-cinnabar">✕</span>它不是医疗、心理、法律或财务建议。</li>
              <li className="flex gap-2"><span className="shrink-0 text-pine">✓</span>每次回应必附引文出处、解释置信度、适用边界和一个可执行小实验。</li>
              <li className="flex gap-2"><span className="shrink-0 text-pine">✓</span>遇到自伤风险、重大疾病、法律与财务危机，它会直接转介专业资源；右下角「需要帮助」入口随时可用。</li>
              <li className="flex gap-2"><span className="shrink-0 text-pine">✓</span>对话只保存在你自己的浏览器里，不要输入身份证号等隐私信息。</li>
            </ul>
            <button
              className="btn-cinnabar mt-2 w-full"
              onClick={() => {
                localStorage.setItem(CONSENT_KEY, '1');
                setConsented(true);
                trackEvent('consent_accept', { app: 'zhijing' });
              }}
            >
              我已知悉，开始使用
            </button>
          </div>
        </Modal>
      )}

      {/* 常驻求助入口弹层 */}
      {showHelp && (
        <Modal title="专业求助资源" onClose={() => setShowHelp(false)}>
          <p className="mb-4 text-xs leading-relaxed ink-sub">
            这些资源任何时候都为你敞开，不需要先和执镜聊。如果你或身边的人正处于即刻危险中，请直接拨打 110 / 120。
          </p>
          <AllResources />
        </Modal>
      )}

      {/* 护栏说明 */}
      <div className="paper-card-deep rounded-xl border-l-4 p-4 text-xs leading-relaxed ink-sub" style={{ borderLeftColor: 'hsl(var(--cinnabar))' }}>
        <span className="font-bold text-cinnabar">执镜不是大师，也不给答案。</span>
        它只做一件事：从你的倾诉里听出主题，然后举一面古人的「镜子」——
        用庄子换视角、用道德经做减法、用孙子评估代价、用毛选逼你拿事实。
        它记得这场对话的上下文；遇到危机话题，它会停下并把你转给专业的人。
      </div>

      {/* 对话区 */}
      <div ref={listRef} className="paper-card mt-4 h-[52vh] min-h-[360px] space-y-4 overflow-y-auto rounded-xl p-4 sm:p-5">
        {msgs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="font-brush text-4xl ink-title">执镜</div>
            <p className="mt-3 max-w-md text-sm leading-relaxed ink-sub">
              「执镜」之名，取「以古为镜，可以知兴替」之意，但照的是你自己的问题。
              <br />
              说说你最近卡住的地方，我来帮你换几个看它的角度。
            </p>
            <div className="mt-5 flex max-w-lg flex-wrap justify-center gap-2">
              {SAMPLES.map((s) => (
                <button key={s} className="btn-ink-outline text-xs" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            {m.role === 'user' ? (
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-cinnabar px-4 py-2.5 text-sm leading-relaxed text-[hsl(43_40%_96%)] sm:max-w-[70%]">
                {m.text}
              </div>
            ) : (
              <div className="w-full max-w-[95%] sm:max-w-[85%]">
                <div className="mb-1.5 flex items-center gap-2 text-[11px] ink-sub">
                  <span className="seal !h-7 !w-5 !p-0 text-[10px]">镜</span>
                  执镜 · 举镜不答
                </div>
                <div className="rounded-2xl rounded-tl-sm border hairline bg-[hsl(45_40%_98%)] p-4">
                  {m.reply?.kind === 'coach' && <CoachCard reply={m.reply} />}
                  {m.reply?.kind === 'crisis' && <CrisisCard reply={m.reply} />}
                </div>
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="flex items-center gap-2 text-xs ink-sub">
            <span className="seal !h-7 !w-5 !p-0 text-[10px]">镜</span>
            执镜正在擦镜子……
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="mt-4 flex gap-2">
        <textarea
          className="input-ink min-h-[52px] flex-1 resize-y"
          placeholder="说说你的处境和卡住你的那个问题（不要输入隐私信息与身份证号等）……"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="flex flex-col gap-2">
          <button className="btn-cinnabar h-full px-5" onClick={() => send()} disabled={thinking || !input.trim()}>
            举镜
          </button>
          {msgs.length > 0 && (
            <button
              className="btn-ink-outline text-xs"
              onClick={() => {
                if (window.confirm('清空本机保存的全部对话记录？')) {
                  setMsgs([]);
                  trackEvent('zhijing_clear', {});
                }
              }}
            >
              清空
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] leading-relaxed ink-sub">
        对话只保存在你自己的浏览器里。执镜是文化工具，不是医疗、法律或财务建议；重大决定请咨询专业人士。
      </p>

      {/* 常驻求助入口 */}
      <button
        className="fixed bottom-5 right-5 z-40 rounded-full bg-cinnabar px-4 py-3 text-sm font-bold text-[hsl(43_40%_96%)] shadow-lg transition-transform hover:-translate-y-0.5"
        style={{ boxShadow: '0 8px 24px hsl(4 62% 30% / 0.45)' }}
        onClick={() => {
          setShowHelp(true);
          trackEvent('help_open', { app: 'zhijing' });
        }}
        aria-label="打开专业求助资源"
      >
        🆘 需要帮助
      </button>
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary appName="执镜">
      <ZhijingApp />
    </ErrorBoundary>
  );
}
