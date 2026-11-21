import React from 'react';

import i18n from '../../i18n';
import './index.less';

type Props = {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
};

// RowAction is one of a row's actions, as an icon button named by its tooltip.
// It forwards its ref and any other props, so it can be a Dropdown's trigger.
export const RowAction = React.forwardRef<HTMLButtonElement, Props & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  (props, ref) => {
    const { icon, label: key, danger, className: extra, ...rest } = props;
    const label = i18n.t(key).toString();
    const className = `row-action ${danger ? 'danger' : ''} ${extra || ''}`;
    return (
      <button ref={ref} type="button" title={label} aria-label={label} {...rest} className={className}>
        {icon}
      </button>
    );
  }
);

RowAction.displayName = 'RowAction';
