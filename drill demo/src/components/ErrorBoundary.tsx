import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./ui";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public handleHardReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-md border border-red-500/40 bg-ink-900/90 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-[22px] text-red-400">
            ⚠
          </div>
          <h2 className="mt-3 text-[16px] font-semibold text-fog-100">
            {this.props.fallbackTitle || "View Rendering Error"}
          </h2>
          <p className="mt-1 max-w-md text-[12px] text-fog-400">
            A component error occurred while rendering this module.
          </p>
          {this.state.error && (
            <div className="mt-4 max-w-lg overflow-x-auto rounded border border-line-soft bg-ink-950 p-3 font-mono text-[11px] text-red-300">
              {this.state.error.message}
            </div>
          )}
          <div className="mt-5 flex gap-3">
            <Button variant="outline" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button variant="danger" onClick={this.handleHardReset}>
              Reset Application Cache & Reload
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
