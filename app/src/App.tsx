import { Seal } from '@/shared/layout';

const APPS = [
  {
    href: './guansu/index.html',
    mark: '观俗',
    name: '观俗',
    en: 'GUAN SU',
    tagline: '人生叙事与民俗研究模式',
    desc: '把四柱八字、五运六气、《炁体源流》放回它们本来的位置：文化理解，而非预测。',
    items: ['历法节气 · 民俗文化解释器', '断语 → 自我叙事练习', '五运六气 · 医史博物馆', '《炁体源流》文献导览'],
  },
  {
    href: './zhijing/index.html',
    mark: '执镜',
    name: '执镜',
    en: 'ZHI JING',
    tagline: '引用经典的苏格拉底式 AI 陪练',
    desc: '不是大师，是提问器：用庄子换视角、用道德经做减法、用孙子评估代价、用毛选逼你拿事实。',
    items: ['每次回答必有引文出处', '解释置信度 + 适用边界', '一个可执行小实验', '危机识别 · 直连专业资源'],
  },
];

export default function App() {
  return (
    <div className="ink-body flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-16">
        {/* 头部 */}
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="inline-block h-px w-16 bg-[hsl(var(--line))]" />
            <span className="text-xs tracking-[0.5em] ink-sub">传统文化应用</span>
            <span className="inline-block h-px w-16 bg-[hsl(var(--line))]" />
          </div>
          <h1 className="ink-title font-brush text-5xl leading-tight sm:text-6xl">
            观俗 <span className="text-cinnabar">·</span> 执镜
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed ink-sub sm:text-base">
            一个做「理解」，一个做「提问」。
            <br />
            不预测、不诊断、不承诺改命——把传统放回它本来的位置。
          </p>
        </div>

        {/* 两个应用 */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {APPS.map((app) => (
            <a key={app.name} href={app.href} className="group block">
              <div className="paper-card relative h-full rounded-xl p-6 transition-transform duration-200 group-hover:-translate-y-1 sm:p-8">
                <Seal className="absolute right-6 top-6 h-16 w-9 text-base">{app.mark}</Seal>
                <div className="text-[10px] tracking-[0.35em] ink-sub">{app.en}</div>
                <h2 className="ink-title mt-1 font-brush text-4xl">{app.name}</h2>
                <div className="mt-1 text-sm font-bold text-cinnabar">{app.tagline}</div>
                <p className="mt-3 text-sm leading-relaxed ink-sub">{app.desc}</p>
                <ul className="mt-4 space-y-1.5 text-xs leading-relaxed ink-sub">
                  {app.items.map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-cinnabar" />
                      {x}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-cinnabar">
                  进入{app.name}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* 共同原则 */}
        <div className="paper-card-deep mt-12 rounded-xl p-6 sm:p-8">
          <div className="text-sm font-bold text-cinnabar">两个应用共同遵守的原则</div>
          <div className="mt-4 grid gap-4 text-xs leading-relaxed ink-sub sm:grid-cols-3">
            <div>
              <div className="mb-1 font-bold ink-title">一 · 不做预测</div>
              不测婚姻、财运、疾病、考试志愿。八字与运气学说只作为「传统叙事如何塑造自我感」的研究材料。
            </div>
            <div>
              <div className="mb-1 font-bold ink-title">二 · 不装大师</div>
              引文必有出处，解读必标置信度与适用边界。修炼体验与医史记述均不可外推为普遍结论。
            </div>
            <div>
              <div className="mb-1 font-bold ink-title">三 · 不替专业</div>
              遇到自伤风险、重大疾病、法律与财务危机，应用直接转介专业资源，不做陪练式回应。
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t hairline">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-xs ink-sub sm:px-6">
          观俗 · 执镜 —— 苏格拉底式的镜子，照见不同时代的智慧如何与今天的你对话。
        </div>
      </footer>
    </div>
  );
}
