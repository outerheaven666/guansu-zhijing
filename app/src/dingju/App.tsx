import { useEffect, useState } from 'react';
import { AppShell, SectionTitle } from '@/shared/layout';
import { ErrorBoundary } from '@/shared/ErrorBoundary';
import { trackEvent } from '@/shared/analytics';
import { CRISIS_RESOURCES } from '@/shared/engine';
import { LENS_TRADITION_NAMES, SCENE_LABELS, lensesForScene, type Scene } from './lenses';
import {
  ATTRIBUTION_LABELS,
  DEFAULT_DONT_LIST,
  ENTRY_TYPE_LABELS,
  PATH_NAMES,
  checkDecisionRedFlags,
  detectScene,
  emptyPaths,
  newDecisionId,
  onePageMarkdown,
  reviewDue,
  splitAndClassify,
  store,
  type Attribution,
  type Decision,
  type EntryType,
  type Principle,
} from './model';

type Step = 'home' | 'input' | 'entries' | 'lenses' | 'paths' | 'report' | 'review';
const STEPS: Array<{ id: Step; name: string }> = [
  { id: 'input', name: '① 输入' },
  { id: 'entries', name: '② 事实分层' },
  { id: 'lenses', name: '③ 经典透镜' },
  { id: 'paths', name: '④ 路径比较' },
  { id: 'report', name: '⑤ 一页纸' },
];

const ENTRY_TYPES = Object.keys(ENTRY_TYPE_LABELS) as EntryType[];
const uid = () => Math.random().toString(36).slice(2, 10);

function blankDecision(): Decision {
  return {
    id: newDecisionId(),
    title: '',
    scene: 'career',
    what: '',
    want: '',
    fear: '',
    deadline: '',
    reversibility: '',
    maxLoss: '',
    entries: [],
    lensNotes: {},
    paths: emptyPaths(),
    dontList: [...DEFAULT_DONT_LIST],
    minAction: '',
    successSignal: '',
    stopSignal: '',
    status: 'active',
    createdAt: Date.now(),
  };
}

function DingjuApp() {
  const [step, setStep] = useState<Step>('home');
  const [decisions, setDecisions] = useState<Decision[]>(() => store.decisions());
  const [principles, setPrinciples] = useState<Principle[]>(() => store.principles());
  const [draft, setDraft] = useState<Decision | null>(null);
  const [redFlag, setRedFlag] = useState<ReturnType<typeof checkDecisionRedFlags>>(null);
  const [investAck, setInvestAck] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ decision: Decision; kind: '7' | '30' } | null>(null);

  useEffect(() => {
    trackEvent('page_view', { app: 'dingju' });
  }, []);

  const refresh = () => {
    setDecisions(store.decisions());
    setPrinciples(store.principles());
  };

  const dueReviews = decisions.map((d) => ({ d, due: reviewDue(d) })).filter((x) => x.due);
  const activeDecisions = decisions.filter((d) => d.status === 'active');

  /* ---------- 步骤流转 ---------- */

  const startNew = () => {
    setDraft(blankDecision());
    setInvestAck(false);
    setStep('input');
    trackEvent('dingju_new', {});
  };

  const inputToEntries = () => {
    if (!draft) return;
    const combined = [draft.title, draft.what, draft.want, draft.fear].join('。');
    const flag = checkDecisionRedFlags(combined);
    if (flag) {
      setRedFlag(flag);
      trackEvent('dingju_redflag', { kind: flag.kind, keyword: flag.keyword });
      if (flag.kind === 'crisis') return; // 硬阻断
      if (!investAck) return; // 投资类需确认后继续
    }
    // 自动拆句分类（首次进入时）
    if (draft.entries.length === 0) {
      const auto = splitAndClassify([draft.what, draft.want, draft.fear].join('\n')).map((x) => ({
        id: uid(),
        text: x.text,
        type: x.type,
      }));
      setDraft({ ...draft, entries: auto });
    }
    setRedFlag(null);
    setStep('entries');
  };

  const finish = () => {
    if (!draft) return;
    store.saveDecision(draft);
    refresh();
    setStep('report');
    trackEvent('dingju_complete', { scene: draft.scene });
  };

  const exportMd = () => {
    if (!draft) return;
    const blob = new Blob([onePageMarkdown(draft)], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `定局-${draft.title || '决策'}-一页纸.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    trackEvent('dingju_export_md', {});
  };

  /* ---------- 渲染 ---------- */

  return (
    <AppShell appName="定局" appMark="定局" tagline="决策工作台 —— 不做「告诉你命」的应用，做「让你更不容易自欺」的工具">
      {/* 步骤条 */}
      {draft && step !== 'home' && step !== 'review' && (
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs">
          {STEPS.map((s) => (
            <button
              key={s.id}
              className="tab-ink !px-2.5 !py-1.5"
              data-active={step === s.id}
              onClick={() => setStep(s.id)}
            >
              {s.name}
            </button>
          ))}
          <button className="btn-ink-outline ml-auto !px-2.5 !py-1 text-xs" onClick={() => { store.saveDecision(draft); refresh(); setStep('home'); }}>
            存草稿回家
          </button>
        </nav>
      )}

      {/* 红线弹层 */}
      {redFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="paper-card w-full max-w-lg rounded-xl p-5" role="dialog" aria-modal="true">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cinnabar text-xs font-bold text-[hsl(43_40%_96%)]">!</span>
              <span className="text-sm font-bold text-cinnabar">
                {redFlag.kind === 'crisis' ? `检测到「${redFlag.label}」——定局在此停下` : '检测到高风险财务动作信号'}
              </span>
            </div>
            {redFlag.kind === 'crisis' && redFlag.crisis ? (
              <div className="mt-3">
                <p className="text-sm leading-relaxed ink-sub">{CRISIS_RESOURCES[redFlag.crisis.category].intro}</p>
                <ul className="mt-3 space-y-2">
                  {CRISIS_RESOURCES[redFlag.crisis.category].items.map((r) => (
                    <li key={r.name} className="rounded-md bg-[hsl(45_40%_98%)] p-3">
                      <div className="text-sm font-bold ink-title">{r.name}</div>
                      <div className="mt-0.5 text-xs ink-sub">{r.detail}</div>
                    </li>
                  ))}
                </ul>
                <button className="btn-ink mt-4 w-full" onClick={() => { setRedFlag(null); setStep('home'); }}>
                  我明白了，先去找专业的人
                </button>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm leading-relaxed ink-sub">
                  检测到「{redFlag.keyword}」一类的高风险财务动作。「孤注一掷」不是决策，是情绪的具名——这类动作的伤害一旦发生不可逆。
                </p>
                <ul className="mt-2 space-y-1 text-xs leading-relaxed ink-sub">
                  <li>· 任何「输不起」的钱不进场：生活费、借款、他人物业。</li>
                  <li>· 把最大可承受损失写成具体数字之后，再回来走决策流程。</li>
                  <li>· 涉及投资、借贷，请咨询持牌财务/法律专业人士。</li>
                </ul>
                <label className="mt-3 flex items-start gap-2 text-xs ink-sub">
                  <input type="checkbox" className="mt-0.5" checked={investAck} onChange={(e) => setInvestAck(e.target.checked)} />
                  我理解上述风险，本次决策仅评估「可承受损失内」的方案，不包含孤注一掷式投入
                </label>
                <div className="mt-3 flex gap-2">
                  <button className="btn-ink-outline flex-1" onClick={() => setRedFlag(null)}>返回修改表述</button>
                  <button className="btn-cinnabar flex-1" disabled={!investAck} onClick={inputToEntries}>确认并继续</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ 首页 / 今日一决 ============ */}
      {step === 'home' && (
        <div className="space-y-6">
          <div className="paper-card rounded-xl p-5 sm:p-6">
            <SectionTitle title="今日一决" sub="只展示当前最值得复盘、最需要决定的事。经典在这里不是权威答案，而是迫使提问更锋利的工具。" />
            <button className="btn-cinnabar" onClick={startNew}>＋ 新建决策</button>
          </div>

          {dueReviews.length > 0 && (
            <div className="paper-card rounded-xl border-l-4 p-5" style={{ borderLeftColor: 'hsl(var(--cinnabar))' }}>
              <div className="text-sm font-bold text-cinnabar">到期该复盘了（{dueReviews.length}）</div>
              <div className="mt-3 space-y-2">
                {dueReviews.map(({ d, due }) => (
                  <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-lg border hairline p-3">
                    <span className="rounded-full bg-cinnabar px-2 py-0.5 text-[10px] text-[hsl(43_40%_96%)]">{due} 天复盘</span>
                    <span className="text-sm font-bold ink-title">{d.title}</span>
                    <span className="text-xs ink-sub">{SCENE_LABELS[d.scene]}</span>
                    <button className="btn-cinnabar ml-auto !px-3 !py-1 text-xs" onClick={() => { setReviewTarget({ decision: d, kind: due! }); setStep('review'); }}>
                      去回填
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="paper-card rounded-xl p-5">
              <div className="text-sm font-bold ink-title">进行中的决策（{activeDecisions.length}）</div>
              <div className="mt-3 space-y-2">
                {activeDecisions.length === 0 && <p className="text-xs ink-sub">还没有决策。从「新建决策」开始你的第一张一页纸。</p>}
                {activeDecisions.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg border hairline p-3">
                    <span className="text-sm font-bold ink-title">{d.title || '（未命名）'}</span>
                    <span className="rounded-full border hairline px-2 py-0.5 text-[10px] ink-sub">{SCENE_LABELS[d.scene]}</span>
                    <span className="text-[10px] ink-sub">{new Date(d.createdAt).toLocaleDateString('zh-CN')}</span>
                    <div className="ml-auto flex gap-1.5">
                      <button className="btn-ink-outline !px-2.5 !py-1 text-xs" onClick={() => { setDraft(d); setStep('report'); }}>一页纸</button>
                      <button className="btn-ink-outline !px-2.5 !py-1 text-xs" onClick={() => { setDraft(d); setInvestAck(false); setStep('input'); }}>编辑</button>
                      <button className="btn-ink-outline !px-2.5 !py-1 text-xs" onClick={() => { if (window.confirm('删除这条决策及其复盘？')) { store.deleteDecision(d.id); refresh(); } }}>删</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="paper-card rounded-xl p-5">
              <div className="text-sm font-bold ink-title">个人原则库（{principles.length}）</div>
              <p className="mt-1 text-[11px] ink-sub">复盘后沉淀的「下次遇到同类局面，我先检查……」——这是定局真正的资产。</p>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {principles.length === 0 && <p className="text-xs ink-sub">完成一次 7/30 天复盘后，你的第一条原则会出现在这里。</p>}
                {principles.map((p) => (
                  <div key={p.id} className="rounded-lg border-l-2 p-2.5 text-xs leading-relaxed" style={{ borderColor: 'hsl(var(--pine))', background: 'hsl(45 40% 97%)' }}>
                    <div className="ink-title">{p.text}</div>
                    <div className="mt-1 text-[10px] ink-sub">来自《{p.fromTitle}》· 归因：{ATTRIBUTION_LABELS[p.attribution]} · {new Date(p.at).toLocaleDateString('zh-CN')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ ① 输入 ============ */}
      {step === 'input' && draft && (
        <div className="paper-card space-y-4 rounded-xl p-5 sm:p-6">
          <SectionTitle title="三段式输入" sub="发生什么 / 你想要什么 / 你怕什么。写句子就行，下一步帮你分层。" />
          <input className="input-ink" placeholder="决策标题（如：要不要接受上海的 offer）" value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          {(['what', 'want', 'fear'] as const).map((k) => (
            <div key={k}>
              <label className="text-sm font-bold ink-title">{{ what: '① 发生了什么（事实经过，多写几句）', want: '② 你想要什么（目标与期限）', fear: '③ 你怕什么（最坏画面）' }[k]}</label>
              <textarea className="input-ink mt-1.5 min-h-[72px]" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
            </div>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold ink-title">场景（自动识别，可改）</label>
              <select className="input-ink mt-1" value={draft.scene} onChange={(e) => setDraft({ ...draft, scene: e.target.value as Scene })}>
                {(Object.keys(SCENE_LABELS) as Scene[]).map((s) => <option key={s} value={s}>{SCENE_LABELS[s]}</option>)}
              </select>
              <div className="mt-1 text-[10px] ink-sub">
                识别到：{detectScene([draft.title, draft.what].join('。')).hits.join('、') || '（输入更多文本后自动识别）'}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold ink-title">期限</label>
              <input className="input-ink mt-1" placeholder="如：两周内答复" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold ink-title">可逆性</label>
              <input className="input-ink mt-1" placeholder="如：试用期可退出 / 不可逆" value={draft.reversibility} onChange={(e) => setDraft({ ...draft, reversibility: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold ink-title">最大可承受损失（写具体数字）</label>
              <input className="input-ink mt-1" placeholder="如：3 个月工资 / ¥20,000" value={draft.maxLoss} onChange={(e) => setDraft({ ...draft, maxLoss: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-cinnabar" disabled={!draft.title.trim() || !draft.what.trim()} onClick={inputToEntries}>
              下一步：事实分层 →
            </button>
          </div>
        </div>
      )}

      {/* ============ ② 事实分层 ============ */}
      {step === 'entries' && draft && (
        <div className="paper-card space-y-4 rounded-xl p-5 sm:p-6">
          <SectionTitle title="事实分层器" sub="系统自动预分类（橙色为存疑项）。逐条校对：哪些是事实、哪些只是感受、假设、传闻、愿望或未知。决策的力气只该花在事实上。" />
          <div className="flex flex-wrap gap-2 text-[11px]">
            {ENTRY_TYPES.map((t) => (
              <span key={t} className="rounded-full border hairline px-2 py-0.5 ink-sub">
                {ENTRY_TYPE_LABELS[t]} {draft.entries.filter((e) => e.type === t).length}
              </span>
            ))}
          </div>
          <div className="space-y-2">
            {draft.entries.map((e) => (
              <div key={e.id} className={`flex flex-wrap items-center gap-2 rounded-lg border p-2.5 ${e.type === 'fact' ? 'hairline' : 'border-[hsl(var(--gold)/0.6)] bg-[hsl(45_45%_96%)]'}`}>
                <span className="min-w-0 flex-1 text-sm ink-title">{e.text}</span>
                <select className="input-ink !w-24 !py-1 text-xs" value={e.type}
                  onChange={(ev) => setDraft({ ...draft, entries: draft.entries.map((x) => (x.id === e.id ? { ...x, type: ev.target.value as EntryType } : x)) })}>
                  {ENTRY_TYPES.map((t) => <option key={t} value={t}>{ENTRY_TYPE_LABELS[t]}</option>)}
                </select>
                <button className="btn-ink-outline !px-2 !py-1 text-xs" onClick={() => setDraft({ ...draft, entries: draft.entries.filter((x) => x.id !== e.id) })}>删</button>
              </div>
            ))}
          </div>
          <AddEntry onAdd={(text, type) => setDraft({ ...draft, entries: [...draft.entries, { id: uid(), text, type }] })} />
          {draft.entries.filter((e) => e.type === 'fact').length === 0 && (
            <p className="text-xs text-cinnabar">⚠ 目前还没有一条「事实」。没有事实的决策只是情绪的搬运工——建议先补调查（见透镜「调查研究」）。</p>
          )}
          <div className="flex justify-between">
            <button className="btn-ink-outline" onClick={() => setStep('input')}>← 返回</button>
            <button className="btn-cinnabar" onClick={() => setStep('lenses')}>下一步：经典透镜 →</button>
          </div>
        </div>
      )}

      {/* ============ ③ 经典透镜 ============ */}
      {step === 'lenses' && draft && (
        <div className="space-y-4">
          <div className="paper-card rounded-xl p-5">
            <SectionTitle title="经典透镜" sub="每张卡回答一个尖锐问题。引文都有来源、转译、适用与禁用条件——它不是答案，是逼你把问题答清楚的工具。" />
          </div>
          {lensesForScene(draft.scene).map((lens) => (
            <div key={lens.id} className="paper-card rounded-xl p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cinnabar px-2.5 py-0.5 text-[11px] text-[hsl(43_40%_96%)]">{LENS_TRADITION_NAMES[lens.tradition]}</span>
                <span className="text-base font-bold ink-title">{lens.title}</span>
                <span className="text-xs ink-sub">{lens.source}</span>
              </div>
              <div className="mt-3 text-sm font-bold leading-relaxed text-cinnabar">{lens.question}</div>
              <p className="mt-1 text-xs leading-relaxed ink-sub">{lens.translation}</p>
              <div className="mt-2 grid gap-2 text-[11px] ink-sub sm:grid-cols-2">
                <div className="rounded-md border hairline p-2"><span className="font-bold text-pine">适用：</span>{lens.applyWhen}</div>
                <div className="rounded-md border hairline p-2"><span className="font-bold text-cinnabar">禁用：</span>{lens.avoidWhen}</div>
              </div>
              <textarea
                className="input-ink mt-3 min-h-[56px]"
                placeholder="写下你对这个尖锐问题的回答……"
                value={draft.lensNotes[lens.id] ?? ''}
                onChange={(e) => setDraft({ ...draft, lensNotes: { ...draft.lensNotes, [lens.id]: e.target.value } })}
              />
            </div>
          ))}
          <div className="flex justify-between">
            <button className="btn-ink-outline" onClick={() => setStep('entries')}>← 返回</button>
            <button className="btn-cinnabar" onClick={() => setStep('paths')}>下一步：路径比较 →</button>
          </div>
        </div>
      )}

      {/* ============ ④ 路径比较 ============ */}
      {step === 'paths' && draft && (
        <div className="paper-card space-y-4 rounded-xl p-5 sm:p-6">
          <SectionTitle title="路径生成：A 进攻 / B 等待 / C 撤退 / D 换局" sub="四条都填，再比较。胜率是主观估计，写下来是为了 7 天后能校验——不是为了显得精确。" />
          <div className="grid gap-3 lg:grid-cols-2">
            {draft.paths.map((p, i) => (
              <div key={p.key} className="rounded-lg border hairline p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cinnabar text-sm font-bold text-[hsl(43_40%_96%)]">{p.key}</span>
                  <span className="text-sm font-bold ink-title">{PATH_NAMES[p.key]}</span>
                  <label className="ml-auto text-xs ink-sub">胜率 {p.winRate}%</label>
                </div>
                <input type="range" min={0} max={100} value={p.winRate} className="mt-2 w-full accent-[hsl(var(--cinnabar))]"
                  onChange={(e) => updatePath(draft, setDraft, i, { winRate: Number(e.target.value) })} />
                <div className="mt-2 space-y-1.5">
                  <input className="input-ink !py-1.5 text-xs" placeholder="成本（钱 / 时间 / 关系）" value={p.cost} onChange={(e) => updatePath(draft, setDraft, i, { cost: e.target.value })} />
                  <input className="input-ink !py-1.5 text-xs" placeholder="可逆性（能退到哪一步）" value={p.reversibility} onChange={(e) => updatePath(draft, setDraft, i, { reversibility: e.target.value })} />
                  <input className="input-ink !py-1.5 text-xs" placeholder="触发条件（什么信号出现就执行）" value={p.trigger} onChange={(e) => updatePath(draft, setDraft, i, { trigger: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold ink-title">未来 72 小时最小动作</label>
              <textarea className="input-ink mt-1 min-h-[56px]" value={draft.minAction} onChange={(e) => setDraft({ ...draft, minAction: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold ink-title">成功信号</label>
              <textarea className="input-ink mt-1 min-h-[56px]" value={draft.successSignal} onChange={(e) => setDraft({ ...draft, successSignal: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold ink-title">止损信号</label>
              <textarea className="input-ink mt-1 min-h-[56px]" value={draft.stopSignal} onChange={(e) => setDraft({ ...draft, stopSignal: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-between">
            <button className="btn-ink-outline" onClick={() => setStep('lenses')}>← 返回</button>
            <button className="btn-cinnabar" onClick={finish}>生成一页纸 →</button>
          </div>
        </div>
      )}

      {/* ============ ⑤ 一页纸 ============ */}
      {step === 'report' && draft && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button className="btn-cinnabar" onClick={exportMd}>导出 Markdown</button>
            <button className="btn-ink-outline" onClick={() => window.print()}>打印 / 存为 PDF</button>
            <button className="btn-ink-outline" onClick={() => setStep('paths')}>← 返回修改</button>
            <button className="btn-ink-outline ml-auto" onClick={() => { store.saveDecision(draft); refresh(); setStep('home'); }}>完成，回首页</button>
          </div>
          <OnePage decision={draft} />
        </div>
      )}

      {/* ============ 复盘 ============ */}
      {step === 'review' && reviewTarget && (
        <ReviewForm
          decision={reviewTarget.decision}
          kind={reviewTarget.kind}
          onDone={() => { refresh(); setReviewTarget(null); setStep('home'); trackEvent('dingju_review', { kind: reviewTarget.kind }); }}
          onCancel={() => { setReviewTarget(null); setStep('home'); }}
        />
      )}
    </AppShell>
  );
}

/* ---------- 子组件 ---------- */

function AddEntry({ onAdd }: { onAdd: (text: string, type: EntryType) => void }) {
  const [text, setText] = useState('');
  const [type, setType] = useState<EntryType>('fact');
  return (
    <div className="flex flex-wrap gap-2">
      <input className="input-ink min-w-0 flex-1" placeholder="手动补一条（如：上次谈薪对方说预算冻结——这是事实还是传闻？）" value={text} onChange={(e) => setText(e.target.value)} />
      <select className="input-ink !w-24" value={type} onChange={(e) => setType(e.target.value as EntryType)}>
        {ENTRY_TYPES.map((t) => <option key={t} value={t}>{ENTRY_TYPE_LABELS[t]}</option>)}
      </select>
      <button className="btn-ink-outline" onClick={() => { if (text.trim()) { onAdd(text.trim(), type); setText(''); } }}>＋ 添加</button>
    </div>
  );
}

function updatePath(draft: Decision, setDraft: (d: Decision) => void, i: number, patch: Partial<Decision['paths'][number]>) {
  const paths = draft.paths.map((p, j) => (j === i ? { ...p, ...patch } : p));
  setDraft({ ...draft, paths });
}

function OnePage({ decision: d }: { decision: Decision }) {
  const facts = d.entries.filter((e) => e.type === 'fact');
  const assumptions = d.entries.filter((e) => ['assumption', 'rumor', 'wish'].includes(e.type));
  const unknowns = d.entries.filter((e) => e.type === 'unknown');
  return (
    <div className="paper-card rounded-xl p-6 sm:p-8 print:shadow-none" id="onepage">
      <div className="border-b-2 pb-4" style={{ borderColor: 'hsl(var(--ink))' }}>
        <h2 className="font-brush text-3xl ink-title">决策：{d.title}</h2>
        <p className="mt-2 text-xs ink-sub">
          场景：{SCENE_LABELS[d.scene]} ｜ 期限：{d.deadline || '—'} ｜ 可逆性：{d.reversibility || '—'} ｜ 最大可承受损失：{d.maxLoss || '—'}
        </p>
      </div>
      <ReportSection title="1) 局面判断">
        <KV k="主要矛盾" v={d.lensNotes['mao-maodun']} />
        <KV k="被高估的变量" v={d.lensNotes['zz-feizhi'] ?? d.lensNotes['yj-wei']} />
        <KV k="被低估的风险" v={d.lensNotes['yj-xian'] ?? d.lensNotes['sz-xiansheng']} />
      </ReportSection>
      <ReportSection title="2) 事实 / 假设">
        <KV k="已证实事实" v={facts.map((e) => e.text).join('；') || '（无）'} />
        <KV k="关键假设" v={assumptions.map((e) => `[${ENTRY_TYPE_LABELS[e.type]}] ${e.text}`).join('；') || '（无）'} />
        <KV k="必须补的调研" v={unknowns.map((e) => e.text).join('；') || '（无）'} />
      </ReportSection>
      <ReportSection title="3) 路径比较">
        <div className="space-y-1.5">
          {d.paths.map((p) => (
            <div key={p.key} className="text-sm leading-relaxed ink-sub">
              <span className="font-bold ink-title">{p.key} {PATH_NAMES[p.key]}：</span>
              胜率 {p.winRate}% ｜ 成本：{p.cost || '—'} ｜ 可逆性：{p.reversibility || '—'} ｜ 触发：{p.trigger || '—'}
            </div>
          ))}
        </div>
      </ReportSection>
      <ReportSection title="4) 不做清单">
        <ul className="space-y-1 text-sm ink-sub">{d.dontList.map((x) => <li key={x}>· {x}</li>)}</ul>
      </ReportSection>
      <ReportSection title="5) 最小试错">
        <KV k="未来 72 小时动作" v={d.minAction} />
        <KV k="成功信号" v={d.successSignal} />
        <KV k="止损信号" v={d.stopSignal} />
      </ReportSection>
      <ReportSection title="6) 复盘">
        <KV k="7 天看" v={d.review7 ? `${d.review7.result}（归因：${ATTRIBUTION_LABELS[d.review7.attribution]}）` : '（到期回填）'} />
        <KV k="30 天看" v={d.review30 ? `${d.review30.result}（归因：${ATTRIBUTION_LABELS[d.review30.attribution]}）` : '（到期回填）'} />
      </ReportSection>
      <p className="mt-6 border-t hairline pt-3 text-[10px] ink-sub">
        生成于定局 · 经典透镜仅提供思维框架，不构成医疗、法律、投资、心理建议。
      </p>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-bold text-cinnabar">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex gap-2 text-sm leading-relaxed">
      <span className="shrink-0 font-bold ink-title">{k}：</span>
      <span className="ink-sub">{v?.trim() ? v : '（未填写）'}</span>
    </div>
  );
}

function ReviewForm({ decision, kind, onDone, onCancel }: { decision: Decision; kind: '7' | '30'; onDone: () => void; onCancel: () => void }) {
  const [result, setResult] = useState('');
  const [attribution, setAttribution] = useState<Attribution>('judgment');
  const [principle, setPrinciple] = useState('');
  const save = () => {
    const review = { result, attribution, principle, at: Date.now() };
    const updated: Decision = kind === '7' ? { ...decision, review7: review } : { ...decision, review30: review };
    store.saveDecision(updated);
    if (principle.trim()) {
      store.addPrinciple({
        id: Math.random().toString(36).slice(2, 10),
        text: principle.trim(),
        fromDecisionId: decision.id,
        fromTitle: decision.title,
        attribution,
        at: Date.now(),
      });
    }
    onDone();
  };
  return (
    <div className="paper-card space-y-4 rounded-xl p-5 sm:p-6">
      <SectionTitle title={`${kind} 天复盘：《${decision.title}》`} sub="对比「当初以为」和「实际发生」，强制写一条修正。假设被推翻不是失败，是学习在发生。" />
      <div className="rounded-lg border hairline p-3 text-xs leading-relaxed ink-sub">
        <span className="font-bold ink-title">当初的最小动作：</span>{decision.minAction || '—'}
        <br />
        <span className="font-bold ink-title">成功信号：</span>{decision.successSignal || '—'}　<span className="font-bold ink-title">止损信号：</span>{decision.stopSignal || '—'}
      </div>
      <div>
        <label className="text-sm font-bold ink-title">实际发生了什么？</label>
        <textarea className="input-ink mt-1.5 min-h-[80px]" value={result} onChange={(e) => setResult(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-bold ink-title">归因（哪一环错了）</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {(Object.keys(ATTRIBUTION_LABELS) as Attribution[]).map((a) => (
            <button key={a} className="tab-ink !px-2.5 !py-1.5 text-xs" data-active={attribution === a} onClick={() => setAttribution(a)}>
              {ATTRIBUTION_LABELS[a]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-bold ink-title">沉淀一条原则（下次遇到同类局面，我先检查……）</label>
        <textarea className="input-ink mt-1.5 min-h-[56px]" value={principle} onChange={(e) => setPrinciple(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <button className="btn-ink-outline" onClick={onCancel}>稍后</button>
        <button className="btn-cinnabar" disabled={!result.trim() || !principle.trim()} onClick={save}>回填复盘</button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary appName="定局">
      <DingjuApp />
    </ErrorBoundary>
  );
}
