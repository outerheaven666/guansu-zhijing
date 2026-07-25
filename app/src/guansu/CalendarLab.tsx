import { useMemo, useState } from 'react';
import { readCalendar } from '@/shared/ganzhi';
import { JIEQI_INFO, JIEQI_ORDER } from '@/shared/jieqi';
import { SectionTitle } from '@/shared/layout';
import { drawShareCard } from '@/shared/sharecard';
import { trackEvent } from '@/shared/analytics';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarLab() {
  const [dateStr, setDateStr] = useState(todayStr());
  const [pickedTerm, setPickedTerm] = useState<string | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  const reading = useMemo(() => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
    return readCalendar(y, m, d);
  }, [dateStr]);

  const focusTerm = pickedTerm ?? reading?.prevTerm?.name ?? null;
  const termInfo = focusTerm ? JIEQI_INFO[focusTerm] : null;

  const generateCard = () => {
    if (!reading || !termInfo || !focusTerm) return;
    const daysText =
      focusTerm === reading.prevTerm?.name
        ? `正值${focusTerm}时节`
        : focusTerm === reading.nextTerm?.name && reading.daysToNext !== null
          ? `距${focusTerm}还有约 ${reading.daysToNext} 天`
          : '四时流转 · 顺时而为';
    const canvas = document.createElement('canvas');
    drawShareCard(canvas, {
      termName: termInfo.name,
      pinyin: termInfo.pinyin,
      longitude: termInfo.longitude,
      dateLabel: `${reading.year} 年 ${reading.month} 月 ${reading.day} 日 · ${reading.weekday}`,
      pillars: `${reading.yearPillar}年  ${reading.monthPillar}月  ${reading.dayPillar}日`,
      daysText,
      phenology: termInfo.phenology,
      customs: termInfo.customs,
      poemLine: termInfo.poem.line,
      poemSource: termInfo.poem.source,
    });
    setCardUrl(canvas.toDataURL('image/png'));
    trackEvent('sharecard_generate', { term: termInfo.name });
  };

  return (
    <div className="space-y-6">
      <div className="paper-card rounded-xl p-5 sm:p-6">
        <SectionTitle
          title="干支历法 · 节气解释器"
          sub="选一个日期，看看传统历法如何标记它。注意：这里解释的是「古人如何记录与理解时间」，不是「这一天预示什么」。"
        />
        <div className="flex flex-wrap items-center gap-3">
          <input type="date" className="input-ink w-auto" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
          <button className="btn-ink-outline text-xs" onClick={() => setDateStr(todayStr())}>回到今天</button>
        </div>

        {reading && (
          <div className="mt-5 space-y-4">
            {/* 三柱 */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '年柱', value: reading.yearPillar, extra: `${reading.yearZodiac}年 · 天干属${reading.yearElement}`, note: '立春换岁' },
                { label: '月柱', value: reading.monthPillar, extra: `${reading.monthBranch}月`, note: '以节换月' },
                { label: '日柱', value: reading.dayPillar, extra: `天干属${reading.dayElement}`, note: '逐日推排' },
              ].map((c) => (
                <div key={c.label} className="paper-card-deep rounded-lg p-3 text-center">
                  <div className="text-[10px] tracking-widest ink-sub">{c.label}</div>
                  <div className="mt-1 font-brush text-3xl ink-title">{c.value}</div>
                  <div className="mt-1 text-xs ink-sub">{c.extra}</div>
                  <div className="mt-0.5 text-[10px] text-gold">{c.note}</div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border hairline p-4 text-sm leading-relaxed ink-sub">
              <span className="font-bold ink-title">这一天在历法中的位置：</span>
              {reading.year}年{reading.month}月{reading.day}日，{reading.weekday}。
              {reading.prevTerm && (
                <>
                  已过节气「<button className="text-cinnabar underline underline-offset-2" onClick={() => setPickedTerm(reading.prevTerm!.name)}>{reading.prevTerm.name}</button>」，
                </>
              )}
              {reading.nextTerm && (
                <>
                  距下一个节气「<button className="text-cinnabar underline underline-offset-2" onClick={() => setPickedTerm(reading.nextTerm!.name)}>{reading.nextTerm.name}</button>」还有约 {reading.daysToNext} 天。
                </>
              )}
              {reading.approximate && <span className="text-cinnabar">（该年份超出近似公式可靠范围，节气日期仅供参考）</span>}
            </div>

            {/* 历法知识卡片 */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="paper-card-deep rounded-lg p-3 text-xs leading-relaxed ink-sub">
                <div className="mb-1 font-bold ink-title">为什么年柱不看正月初一？</div>
                干支纪年以「立春」换岁，这是农耕社会太阳历的传统；而春节是阴阳合历（农历）的正月初一。两套系统并行千年，属相以哪个为准，民俗上本无定论——这正是「传统不是铁板一块」的好例子。
              </div>
              <div className="paper-card-deep rounded-lg p-3 text-xs leading-relaxed ink-sub">
                <div className="mb-1 font-bold ink-title">节气是「太阳历」</div>
                二十四节气按太阳黄经划分（每 15° 一个），所以在公历中日期几乎固定（±1 天），在农历中却四处漂移。古人早已把「天行」与「月相」分开记录。
              </div>
              <div className="paper-card-deep rounded-lg p-3 text-xs leading-relaxed ink-sub">
                <div className="mb-1 font-bold ink-title">这些符号的本来用途</div>
                干支最初是计数系统——纪日、纪月、纪年，像今天的「第几周」。把它当作命运的编码，是后起的解释层；把它当作时间的刻度，才是它本来的样子。
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 节气详情 */}
      {termInfo && (
        <div className="paper-card rounded-xl p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-brush text-3xl ink-title">{termInfo.name}</h3>
            <span className="text-sm ink-sub">{termInfo.pinyin} · {termInfo.longitude}</span>
            <button className="btn-cinnabar ml-auto !px-3 !py-1.5 text-xs" onClick={generateCard}>
              生成分享卡
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {termInfo.phenology.map((p) => (
              <span key={p} className="rounded-full border hairline px-2.5 py-1 text-[11px] ink-sub">{p}</span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed ink-sub">{termInfo.customs}</p>
          <p className="mt-2 text-sm leading-relaxed ink-sub"><span className="font-bold ink-title">时令食俗：</span>{termInfo.foods}</p>
          <blockquote className="quote-block mt-4 rounded-r-lg p-3 text-sm">
            <div className="ink-title">「{termInfo.poem.line}」</div>
            <div className="mt-1 text-xs ink-sub">—— {termInfo.poem.source}</div>
          </blockquote>
        </div>
      )}

      {/* 节气速览 */}
      <div className="paper-card rounded-xl p-5 sm:p-6">
        <SectionTitle title="二十四节气速览" sub="点击任一节气查看其物候与民俗。" />
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {JIEQI_ORDER.map((name) => (
            <button
              key={name}
              className={`rounded-lg border px-2 py-2 text-sm transition-colors ${
                focusTerm === name
                  ? 'border-cinnabar bg-cinnabar text-[hsl(43_40%_96%)]'
                  : 'hairline hover:bg-[hsl(var(--ink)/0.05)]'
              }`}
              onClick={() => setPickedTerm(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 分享卡预览 */}
      {cardUrl && termInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setCardUrl(null)}
        >
          <div
            className="paper-card w-full max-w-sm rounded-xl p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="节气分享卡预览"
          >
            <img src={cardUrl} alt={`${termInfo.name} 节气分享卡`} className="w-full rounded-lg border hairline" />
            <div className="mt-3 flex gap-2">
              <a className="btn-cinnabar flex-1 text-center" href={cardUrl} download={`观俗-${termInfo.name}-节气卡.png`}>
                保存图片
              </a>
              <button className="btn-ink-outline flex-1" onClick={() => setCardUrl(null)}>
                关闭
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] ink-sub">长按图片也可直接分享给朋友</p>
          </div>
        </div>
      )}
    </div>
  );
}
