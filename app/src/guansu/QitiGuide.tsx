import { useState } from 'react';
import { QITI_META, QITI_SECTIONS, QITI_TERMS } from '@/shared/qiti';
import { SectionTitle } from '@/shared/layout';

export default function QitiGuide() {
  const [sec, setSec] = useState(QITI_SECTIONS[0].id);
  const current = QITI_SECTIONS.find((s) => s.id === sec)!;

  return (
    <div className="space-y-6">
      {/* 书目信息 */}
      <div className="paper-card rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-5">
          <div className="paper-card-deep flex h-40 w-28 shrink-0 flex-col items-center justify-center rounded-md border-2 text-center" style={{ borderColor: 'hsl(var(--cinnabar))' }}>
            <div className="font-brush vertical-text text-2xl ink-title">炁体源流</div>
            <div className="mt-2 text-[10px] ink-sub">米晶子 编著</div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold ink-title">{QITI_META.title} · 现代文献导览</h3>
            <dl className="mt-3 space-y-1.5 text-sm leading-relaxed ink-sub">
              <div><dt className="inline font-bold ink-title">编著者：</dt><dd className="inline">{QITI_META.editor}</dd></div>
              <div><dt className="inline font-bold ink-title">出版：</dt><dd className="inline">{QITI_META.publisher}</dd></div>
              <div><dt className="inline font-bold ink-title">书号：</dt><dd className="inline">{QITI_META.isbn}</dd></div>
              <div><dt className="inline font-bold ink-title">其人：</dt><dd className="inline">{QITI_META.authorNote}</dd></div>
            </dl>
          </div>
        </div>
        <div className="mt-5 rounded-lg border-l-4 p-4 text-sm leading-relaxed" style={{ borderColor: 'hsl(var(--cinnabar))', background: 'hsl(4 40% 95%)' }}>
          <span className="font-bold text-cinnabar">导览声明：</span>
          <span className="ink-sub">{QITI_META.disclaimer}</span>
        </div>
      </div>

      {/* 导览章节 */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          {QITI_SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSec(s.id)}
              className={`paper-card w-full rounded-lg p-3 text-left text-sm font-bold transition-transform hover:-translate-y-0.5 ${
                s.id === sec ? 'ink-title ring-2 ring-[hsl(var(--cinnabar)/0.5)]' : 'ink-sub'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
        <div className="paper-card rounded-xl p-5 sm:p-6">
          <h3 className="text-lg font-bold ink-title">{current.title}</h3>
          <p className="mt-3 text-sm leading-7 ink-sub">{current.body}</p>
        </div>
      </div>

      {/* 术语表 */}
      <div className="paper-card rounded-xl p-5 sm:p-6">
        <SectionTitle title="丹道术语小词典" sub="理解文本的钥匙。所有术语均为传统内部概念，无对应的现代科学测量对象。" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QITI_TERMS.map((t) => (
            <div key={t.term} className="paper-card-deep rounded-lg p-3">
              <div className="font-brush text-xl ink-title">{t.term}</div>
              <p className="mt-1.5 text-xs leading-relaxed ink-sub">{t.gloss}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
