import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';

import './index.less';

// AwaitingType holds what a dialog asks after its definition type: greyed out,
// and out of reach of pointer and keyboard (inert), until a type is chosen.
export const AwaitingType = (props: { ready: boolean; children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (props.ready) {
      el.removeAttribute('inert');
    } else {
      el.setAttribute('inert', '');
    }
  }, [props.ready]);
  return (
    <div ref={ref} className={classNames('awaiting-type', { ready: props.ready })} aria-disabled={!props.ready}>
      {props.children}
    </div>
  );
};
