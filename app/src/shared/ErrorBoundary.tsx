import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  appName: string;
}

interface State {
  hasError: boolean;
}

/** 渲染异常兜底：白屏 → 可恢复的提示页 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error(`[${this.props.appName}] render error:`, error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="ink-body flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="font-brush text-4xl ink-title">镜子起雾了</div>
          <p className="mt-4 max-w-md text-sm leading-relaxed ink-sub">
            {this.props.appName} 遇到了一个意外问题，已记录在控制台。刷新页面通常可以恢复；你保存在本机的练习与对话不会丢失。
          </p>
          <button className="btn-cinnabar mt-6" onClick={() => window.location.reload()}>
            刷新页面
          </button>
          <a className="btn-ink-outline mt-3" href="../index.html">
            返回门户
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}
