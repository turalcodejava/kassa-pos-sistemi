import React, { Component, ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export interface ErrorBoundaryProps {
  children?: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: Readonly<ErrorBoundaryProps>;
  declare state: Readonly<ErrorBoundaryState>;
  declare setState: Component<ErrorBoundaryProps, ErrorBoundaryState>["setState"];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-6">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                {this.props.fallbackTitle || "Gözlənilməz Xəta Baş Verdi"}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sistemdə müvəqqəti render xətası baş verdi. Səhifəni yeniləyərək və ya əsas menyuya qayıdaraq davam edə bilərsiniz.
              </p>
              {this.state.error && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] text-red-400 font-mono text-left max-h-24 overflow-y-auto mt-2">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-indigo-950/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Yenidən Yoxla</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Əsas Menyu</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
