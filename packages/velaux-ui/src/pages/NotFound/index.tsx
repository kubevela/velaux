import { Button } from '@alifd/next';
import { Link } from 'dva/router';
import React, { useState } from 'react';

import { Sail } from '../../components/Sail';
import { Translation } from '../../components/Translation';
import './index.less';
import { pickNotFoundLine } from './lines';

// NotFound is the page for a route the app does not have: the sail bobs,
// lists and sinks under the waterline, then a line picked per visit and the way back.
export default function NotFound() {
  const [line] = useState(() => pickNotFoundLine());
  return (
    <div className="not-found">
      <div className="not-found-sea" aria-hidden="true">
        <div className="not-found-boat">
          <Sail className="not-found-sail" />
        </div>
        {[0, 1, 2].map((i) => (
          <span key={i} className="not-found-bubble" />
        ))}
        <svg className="not-found-water" viewBox="0 0 160 24" preserveAspectRatio="none">
          <path
            className="not-found-water-fill"
            d="M 0 8 Q 10 2, 20 8 T 40 8 T 60 8 T 80 8 T 100 8 T 120 8 T 140 8 T 160 8 V 24 H 0 Z"
          />
          <path
            className="not-found-water-line"
            d="M 0 8 Q 10 2, 20 8 T 40 8 T 60 8 T 80 8 T 100 8 T 120 8 T 140 8 T 160 8"
          />
        </svg>
      </div>
      <div className="not-found-code">404</div>
      <div className="not-found-title">
        <Translation>Resource not found</Translation>
      </div>
      <div className="not-found-lead">
        <Translation>{line}</Translation>
      </div>
      <Link to="/applications">
        <Button type="primary">
          <Translation>Back to Applications</Translation>
        </Button>
      </Link>
    </div>
  );
}
