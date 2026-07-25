import { useState } from 'react';
import { AppShell, RedLineNotice } from '@/shared/layout';
import CalendarLab from './CalendarLab';
import NarrativeLab from './NarrativeLab';
import YunqiMuseum from './YunqiMuseum';
import QitiGuide from './QitiGuide';

const TABS = [
  { id: 'calendar', name: '历法节气', sub: '民俗文化解释器' },
  { id: 'narrative', name: '断语叙事', sub: '自我叙事练习' },
  { id: 'yunqi', name: '五运六气', sub: '医史博物馆' },
  { id: 'qiti', name: '炁体源流', sub: '现代文献导览' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function App() {
  const [tab, setTab] = useState<TabId>('calendar');

  return (
    <AppShell appName="观俗" appMark="观俗" tagline="人生叙事与民俗研究模式 —— 文化理解，而非预测">
      {/* 定位说明 */}
      <div className="paper-card rounded-xl p-5 sm:p-6">
        <p className="text-sm leading-relaxed ink-sub">
          「观俗」取自「观风问俗」。四柱八字、五运六气、《炁体源流》在这里各就其位——
          <span className="font-bold ink-title">它们是理解中国文化与自我叙事的材料，不是预测人生的工具。</span>
          你会看到古人如何用干支记录时间、如何用断语安顿情绪、如何用运气学说理解气候与疾病；
          但你不会看到任何关于你婚姻、财运、疾病与志愿的「答案」。
        </p>
      </div>

      {/* 标签页 */}
      <nav className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.id} className="tab-ink" data-active={tab === t.id} onClick={() => setTab(t.id)}>
            <span className="font-bold">{t.name}</span>
            <span className="ml-1.5 hidden text-[10px] opacity-70 sm:inline">{t.sub}</span>
          </button>
        ))}
      </nav>

      <div className="mt-4">
        {tab === 'calendar' && <CalendarLab />}
        {tab === 'narrative' && <NarrativeLab />}
        {tab === 'yunqi' && <YunqiMuseum />}
        {tab === 'qiti' && <QitiGuide />}
      </div>

      <RedLineNotice
        items={[
          '不做「测婚姻 / 测财运 / 测疾病 / 测高考志愿」，这里只有民俗与文献的解释。',
          '干支排布只展示到「它是什么、古人怎么用它」，不展示「它预示什么」。',
          '节气日期为通用近似公式计算，个别年份可能有一日误差，以权威历书为准。',
          '五运六气内容为医学史研究视角，不构成医疗建议。',
        ]}
      />
    </AppShell>
  );
}
