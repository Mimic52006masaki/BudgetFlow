import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="hud-panel w-full max-w-md bg-background-panel shadow-2xl relative z-10 flex flex-col rounded-sm">
            <div className="hud-corner hud-corner-tl"></div>
            <div className="hud-corner hud-corner-tr"></div>
            <div className="hud-corner hud-corner-bl"></div>
            <div className="hud-corner hud-corner-br"></div>

            <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-background-panel">
              <h3 className="text-lg font-bold text-neutral-light tracking-wider uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-danger">error</span>
                エラーが発生しました
              </h3>
            </div>

            <div className="p-8 flex flex-col gap-6">
              <div className="p-4 bg-accent-danger/10 border border-accent-danger/20 rounded-sm">
                <p className="text-sm text-accent-danger leading-relaxed mb-4">
                  予期しないエラーが発生しました。ページをリロードして再度お試しください。
                </p>
                {this.state.error && (
                  <details className="text-xs text-neutral-muted">
                    <summary className="cursor-pointer hover:text-accent-danger">詳細を表示</summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words bg-neutral-light/5 p-2 rounded">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>

              <button
                onClick={() => window.location.reload()}
                className="cyber-btn px-8 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                リロード
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}