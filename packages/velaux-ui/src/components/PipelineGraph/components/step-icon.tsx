import React from 'react';

import type { WorkflowStepStatus } from '@velaux/data';

export function renderStepStatusIcon(status: WorkflowStepStatus) {
  switch (status.phase) {
    case 'succeeded':
      return (
        <svg
          width="16"
          height="16"
          className="step-icon color-fg-success"
          aria-label="completed successfully"
          viewBox="0 0 16 16"
          version="1.1"
          role="img"
        >
          <path
            fillRule="evenodd"
            d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.5-4.5z"
          />
        </svg>
      );
    case 'failed':
      return (
        <svg
          width="16"
          height="16"
          className="step-icon color-fg-danger"
          aria-label="failed"
          viewBox="0 0 16 16"
          version="1.1"
          role="img"
        >
          <path
            fillRule="evenodd"
            d="M2.343 13.657A8 8 0 1113.657 2.343 8 8 0 012.343 13.657zM6.03 4.97a.75.75 0 00-1.06 1.06L6.94 8 4.97 9.97a.75.75 0 101.06 1.06L8 9.06l1.97 1.97a.75.75 0 101.06-1.06L9.06 8l1.97-1.97a.75.75 0 10-1.06-1.06L8 6.94 6.03 4.97z"
          />
        </svg>
      );
    case 'skipped':
      return (
        <svg
          width="16"
          height="16"
          className="step-icon neutral-check"
          aria-label="cancelled"
          viewBox="0 0 16 16"
          version="1.1"
          role="img"
        >
          <path
            fillRule="evenodd"
            d="M4.47.22A.75.75 0 015 0h6a.75.75 0 01.53.22l4.25 4.25c.141.14.22.331.22.53v6a.75.75 0 01-.22.53l-4.25 4.25A.75.75 0 0111 16H5a.75.75 0 01-.53-.22L.22 11.53A.75.75 0 010 11V5a.75.75 0 01.22-.53L4.47.22zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5H5.31zM8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z"
          />
        </svg>
      );
    case 'running':
      return (
        <div className="step-icon running-icon">
          <svg
            aria-label="currently running"
            fill="none"
            viewBox="0 0 16 16"
            className="icon-rotate"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              opacity=".5"
              d="M8 15A7 7 0 108 1a7 7 0 000 14v0z"
              stroke="#dbab0a"
              strokeWidth="2"
            />
            <path d="M15 8a7 7 0 01-7 7" stroke="#dbab0a" strokeWidth="2" />
            <path d="M8 12a4 4 0 100-8 4 4 0 000 8z" fill="#dbab0a" />
          </svg>
        </div>
      );
    case 'stopped':
      return (
        <svg
          aria-hidden="true"
          height="16"
          viewBox="0 0 16 16"
          version="1.1"
          width="16"
          data-view-component="true"
          className="step-icon stopped-icon"
        >
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      );
    default:
      return (
        <svg
          aria-hidden="true"
          height="16"
          viewBox="0 0 16 16"
          version="1.1"
          width="16"
          data-view-component="true"
          className="step-icon pending-icon"
        >
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      );
  }
}
