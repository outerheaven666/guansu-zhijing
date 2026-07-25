import type { ReactNode } from 'react';

export function Seal({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`seal ${className}`}>{children}</span>;
}

export function AppShell({
  children,
  appName,
  appMark,
  tagline,
}: {
  children: ReactNode;
  appName: string;
  appMark: string;
  tagline: string;
}) {
  return (
    <div className="ink-body">
      <header className="border-b hairline">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
          <Seal className="h-14 w-8 text-sm">{appMark}</Seal>
          <div className="min-w-0 flex-1">
            <h1 className="ink-title text-xl font-bold sm:text-2xl">{appName}</h1>
            <p className="ink-sub mt-0.5 text-xs sm:text-sm">{tagline}</p>
          </div>
          <a href="../index.html" className="btn-ink-outline shrink-0 text-xs">
            返回门户
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      <footer className="border-t hairline">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-xs ink-sub sm:px-6">
          观俗 · 执镜 —— 把传统放回它本来的位置：文化理解，而非预测。
        </div>
      </footer>
    </div>
  );
}

export function RedLineNotice({ items }: { items: string[] }) {
  return (
    <div className="paper-card-deep mt-6 rounded-lg border-l-4 p-4" style={{ borderLeftColor: 'hsl(var(--cinnabar))' }}>
      <div className="text-sm font-bold text-cinnabar">本应用的红线</div>
      <ul className="mt-2 space-y-1 text-xs leading-relaxed ink-sub">
        {items.map((x) => (
          <li key={x}>· {x}</li>
        ))}
      </ul>
    </div>
  );
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="ink-title text-lg font-bold sm:text-xl">{title}</h2>
      {sub && <p className="ink-sub mt-1 text-xs leading-relaxed sm:text-sm">{sub}</p>}
    </div>
  );
}
