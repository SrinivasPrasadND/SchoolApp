import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './States';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Route-level error boundary that prevents the whole app from crashing. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In a real app this would report to an error-tracking service.
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => this.setState({ hasError: false });

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-6">
            <ErrorState
              title="This section crashed"
              message="An unexpected error occurred while rendering this page."
              onRetry={this.handleReset}
            />
          </div>
        )
      );
    }
    return this.props.children;
  }
}
