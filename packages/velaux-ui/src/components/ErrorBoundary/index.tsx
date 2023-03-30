import * as React from 'react';
import { captureException } from '@sentry/browser';

export interface ErrorInfo {
  componentStack: string;
}

export interface ErrorBoundaryApi {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface Props {
  children: (r: ErrorBoundaryApi) => React.ReactNode;
  dependencies?: unknown[];
  onError?: (error: Error) => void;
  onRecover?: () => void;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.PureComponent<Props, State> {
  readonly state: State = {
    error: null,
    errorInfo: null,
  };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    this.setState({ error, errorInfo });

    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { dependencies, onRecover } = this.props;

    if (this.state.error) {
      if (dependencies && prevProps.dependencies) {
        for (let i = 0; i < dependencies.length; i++) {
          if (dependencies[i] !== prevProps.dependencies[i]) {
            this.setState({ error: null, errorInfo: null });
            if (onRecover) {
              onRecover();
            }
            break;
          }
        }
      }
    }
  }

  render() {
    const { children } = this.props;
    const { error, errorInfo } = this.state;

    return children({
      error,
      errorInfo,
    });
  }
}
