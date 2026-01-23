'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-cyber-black p-6">
          <div className="max-w-md w-full bg-gray-900 border border-red-500/50 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              出错了
            </h1>
            <p className="text-cyber-white/70 mb-2">
              应用遇到了一个错误
            </p>
            {this.state.error && (
              <div className="bg-gray-950 border border-gray-800 rounded p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-400">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <Button
                onClick={this.handleReset}
                className="w-full"
                size="lg"
              >
                刷新页面
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full"
              >
                返回上一页
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
