'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Log to error tracking service (add your service here)
    // Example: Sentry.captureException(error, { contexts: { errorInfo } });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }
      
      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
            <p className="text-gray-600 max-w-md">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            <Button
              onClick={this.resetError}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
