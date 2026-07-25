import { useState } from 'react';
import { EXHIBITS, LIUQI, QI_NARRATIVE, yunOfStem } from '@/shared/wuyunliuqi';
import { STEMS, jiaziName } from '@/shared/ganzhi';
import { SectionTitle } from '@/shared/layout';

const MIN_YEAR = 1950;
const MAX_YEAR = 2050;

export default function YunqiMuseum() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [exhibit, setExhibit] = useState(EXHIBITS[0].id);

  const ganzhiIndex = (((year - 4) % 60) + 60) % 60;
  const ganzhi = jiaziName(ganzhiIndex);
  const stem = STEMS[ganzhiIndex % 10];
  const yun = yunOfStem(stem);
  const branch = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][ganzhiIndex % 12];
  const qi = LIUQI[branch];

  const current = EXHIBITS.find((e) => e.id === exhibit)!;

  return (
    <div className="space-y-6">
      <div className="paper-card rounded-xl p-5 sm:p-6">
        <SectionTitle
          title="五运六气 · 医史博物馆"
          sub="古人如何用干支推演「这一年的气候与疾病」？下面是一座关于这套解释框架的博物馆——展品是理论本身，不是你的健康。"
        />

        {/* 年份推演台 */}
        <div className="paper-card-deep rounded-lg p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-bold ink-title">选择一个年份</label>
            <input
              type="range"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-48 accent-[hsl(var(--cinnabar))]"
            />
            <input
              type="number"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={year}
              onChange={(e) => setYear(Math.min(MAX_YEAR, Math.max(MIN_YEAR, Number(e.target.value) || MIN_YEAR)))}
              className="input-ink w-24"
            />
            <span className="text-xs ink-sub">运气学说按干支纪年推演（以立春为岁首，部分流派以大寒，学界本无定论）</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border hairline bg-[hsl(45_40%_97%)] p-4 text-center">
              <div className="text-[10px] tracking-widest ink-sub">干支纪年</div>
              <div className="mt-1 font-brush text-4xl ink-title">{ganzhi}</div>
              <div className="mt-1 text-xs ink-sub">{year} 年</div>
            </div>
            <div className="rounded-lg border hairline bg-[hsl(45_40%_97%)] p-4 text-center">
              <div className="text-[10px] tracking-widest ink-sub">中运（大运）</div>
              <div className="mt-1 font-brush text-4xl text-gold">{yun.element}运</div>
              <div className="mt-1 text-xs ink-sub">{yun.excess}之年 · 天干化五运</div>
            </div>
            <div className="rounded-lg border hairline bg-[hsl(45_40%_97%)] p-4 text-center">
              <div className="text-[10px] tracking-widest ink-sub">司天 / 在泉</div>
              <div className="mt-1 font-brush text-2xl text-pine leading-snug">
                {qi.sitian}
                <span className="mx-1 text-sm ink-sub">司天</span>
              </div>
              <div className="font-brush text-2xl text-pine leading-snug">
                {qi.zaiquan}
                <span className="mx-1 text-sm ink-sub">在泉</span>
              </div>
              <div className="mt-1 text-xs ink-sub">地支化六气 · 分主上下半年</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border-l-2 p-3 text-xs leading-relaxed ink-sub" style={{ borderColor: 'hsl(var(--gold))', background: 'hsl(45 40% 97%)' }}>
              <span className="font-bold ink-title">古人如何读「{yun.element}运{yun.excess}」：</span>
              五运描述一年气候的「偏盛偏衰」假设——{yun.excess}之年，古人认为{yun.element}气偏盛，医家会在这个框架下讨论相应的气候类型。注意：这是分类语言，不是天气预报。
            </div>
            <div className="rounded-lg border-l-2 p-3 text-xs leading-relaxed ink-sub" style={{ borderColor: 'hsl(var(--pine))', background: 'hsl(45 40% 97%)' }}>
              <span className="font-bold ink-title">古人如何读「{qi.sitian}司天」：</span>
              {QI_NARRATIVE[qi.sitian]}
            </div>
          </div>
        </div>
      </div>

      {/* 展厅 */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          {EXHIBITS.map((e, i) => (
            <button
              key={e.id}
              onClick={() => setExhibit(e.id)}
              className={`paper-card w-full rounded-lg p-3 text-left transition-transform hover:-translate-y-0.5 ${
                e.id === exhibit ? 'ring-2 ring-[hsl(var(--cinnabar)/0.5)]' : ''
              }`}
            >
              <div className="text-[10px] ink-sub">第 {['一', '二', '三', '四', '五', '六'][i]} 展厅 · {e.era}</div>
              <div className="mt-0.5 text-sm font-bold ink-title">{e.title}</div>
            </button>
          ))}
        </div>
        <div className="paper-card rounded-xl p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {current.tags.map((t) => (
              <span key={t} className="rounded-full border hairline px-2.5 py-0.5 text-[11px] ink-sub">{t}</span>
            ))}
          </div>
          <h3 className="mt-3 text-lg font-bold ink-title">{current.title}</h3>
          <div className="mt-1 text-xs text-gold">{current.era}</div>
          <p className="mt-4 text-sm leading-7 ink-sub">{current.body}</p>
        </div>
      </div>
    </div>
  );
}
