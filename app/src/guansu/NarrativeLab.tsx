import { useEffect, useState } from 'react';
import { DUANYU_CARDS, NARRATIVE_INTRO } from '@/shared/narrative';
import { SectionTitle } from '@/shared/layout';

const STORAGE_KEY = 'guansu.narrative.notes.v1';

type Notes = Record<string, Record<number, string>>;

function loadNotes(): Notes {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export default function NarrativeLab() {
  const [activeId, setActiveId] = useState(DUANYU_CARDS[0].id);
  const [notes, setNotes] = useState<Notes>(loadNotes);
  const [savedTip, setSavedTip] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const card = DUANYU_CARDS.find((c) => c.id === activeId)!;
  const cardNotes = notes[card.id] ?? {};

  return (
    <div className="space-y-6">
      <div className="paper-card rounded-xl p-5 sm:p-6">
        <SectionTitle title={NARRATIVE_INTRO.title} sub={NARRATIVE_INTRO.method} />
        <p className="text-sm leading-relaxed ink-sub">{NARRATIVE_INTRO.body}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* 断语列表 */}
        <div className="space-y-2">
          {DUANYU_CARDS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`paper-card w-full rounded-lg p-3 text-left transition-transform hover:-translate-y-0.5 ${
                c.id === activeId ? 'ring-2 ring-[hsl(var(--cinnabar)/0.5)]' : ''
              }`}
            >
              <div className="text-sm font-bold ink-title">「{c.duanyu}」</div>
              <div className="mt-1 text-[11px] ink-sub">{c.source}</div>
            </button>
          ))}
        </div>

        {/* 练习区 */}
        <div className="space-y-5">
          <div className="paper-card rounded-xl p-5 sm:p-6">
            <div className="text-xs tracking-widest ink-sub">断语</div>
            <div className="mt-1 font-brush text-2xl leading-snug ink-title sm:text-3xl">「{card.duanyu}」</div>
            <div className="mt-1 text-xs ink-sub">—— {card.source}</div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="text-sm font-bold text-pine">它在民俗里做了什么？</div>
                <p className="mt-1 text-sm leading-relaxed ink-sub">{card.folkRole}</p>
              </div>
              <div>
                <div className="text-sm font-bold text-cinnabar">民俗学视角的拆解</div>
                <p className="mt-1 text-sm leading-relaxed ink-sub">{card.deconstruct}</p>
              </div>
            </div>
          </div>

          <div className="paper-card rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold ink-title">自我叙事练习</div>
              {savedTip && <span className="text-[11px] text-pine">已自动保存到本机</span>}
            </div>
            <p className="mt-1 text-xs ink-sub">
              不推算、不评判。回答写在下面的框里，只保存在你自己的浏览器中。
            </p>
            <div className="mt-4 space-y-5">
              {card.prompts.map((q, i) => (
                <div key={i}>
                  <div className="flex gap-2 text-sm leading-relaxed">
                    <span className="shrink-0 font-bold text-cinnabar">{i + 1}.</span>
                    <span className="ink-title">{q}</span>
                  </div>
                  <textarea
                    className="input-ink mt-2 min-h-[64px] resize-y"
                    placeholder="写下你的回答……"
                    value={cardNotes[i] ?? ''}
                    onChange={(e) => {
                      setNotes((prev) => ({
                        ...prev,
                        [card.id]: { ...(prev[card.id] ?? {}), [i]: e.target.value },
                      }));
                      setSavedTip(true);
                      window.setTimeout(() => setSavedTip(false), 1500);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
