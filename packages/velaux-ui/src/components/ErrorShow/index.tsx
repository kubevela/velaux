import React, { ErrorInfo } from 'react';
import { Translation } from '../Translation';

interface Props {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export function ErrorShow({ error, errorInfo }: Props) {
  return (
    <div className="container" style={{ padding: '64px' }}>
      <h2>
        <Translation>An unexpected error happened</Translation>
      </h2>
      <details style={{ whiteSpace: 'pre-wrap' }}>
        {error && error.toString()}
        <br />
        {errorInfo && errorInfo.componentStack}
      </details>
    </div>
  );
}
