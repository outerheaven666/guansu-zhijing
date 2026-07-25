import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/shared/layout';
import { CRISIS_RESOURCES, respond, type CoachReply, type CrisisReply } from '@/shared/engine';
import { TRADITION_META } from '@/shared/quotes';

interface Msg {
  id: string;
  role: 'user' | 'mirror';
  text?: string;
  reply?: CoachReply | CrisisReply;
  time: number;
}

const STORAGE_KEY = 'zhijing.chat.v1';

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

function CoachCard({ reply }: { reply: CoachReply }) {
  return (
    <div className="space-y-4">
      {reply.themes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="ink-sub">我从你的话里读到的信号：</span>
          {reply.themes.slice(0, 3).map((t) => (
            <span key={t.theme} className="rounded-full border hairline px-2 py-0.5 ink-sub">
              {t.label}（{t.hits.slice(0, 2).join('、')}）
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
          {reply.confidenceNote}
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

export default function App() {
  const [msgs, setMsgs] = useState<Msg[]>(loadMsgs);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

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

    // 模拟「照镜子」的停顿，同时避免与最近回复重复引文
    const recentQuoteIds = msgs
      .flatMap((m) => (m.reply?.kind === 'coach' ? m.reply.quotes.map((q) => q.id) : []))
      .slice(-6);
    window.setTimeout(() => {
      const reply = respond(text, recentQuoteIds);
      setMsgs((m) => [...m, { id: `m${Date.now()}`, role: 'mirror', reply, time: Date.now() }]);
      setThinking(false);
    }, 500);
  };

  return (
    <AppShell appName="执镜" appMark="执镜" tagline="引用经典的苏格拉底式 AI 陪练 —— 不预测、不诊断、不承诺改命">
      {/* 护栏说明 */}
      <div className="paper-card-deep rounded-xl border-l-4 p-4 text-xs leading-relaxed ink-sub" style={{ borderLeftColor: 'hsl(var(--cinnabar))' }}>
        <span className="font-bold text-cinnabar">使用之前，请知悉：</span>
        执镜不是大师，也不给答案。它只做一件事：从你的倾诉里听出主题，然后举一面古人的「镜子」——
        用庄子换视角、用道德经做减法、用孙子评估代价、用毛选逼你拿事实。
        每次回应必附<span className="font-bold ink-title">引文出处、解释置信度、适用边界、一个可执行小实验</span>。
        它永远不会预测你的未来，也不会在危机话题上陪你「聊天」——遇到自伤风险、重大疾病、法律与财务危机，它会直接把你转给专业的人。
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
                if (window.confirm('清空本机保存的全部对话记录？')) setMsgs([]);
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
    </AppShell>
  );
}
