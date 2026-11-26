import React from 'react';

import './index.less';

type Props = {
  title: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  // actions sit at the foot of the card, such as the button that saves it.
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

// SettingsSection is one card of the Settings page: a title, a hint, its fields and its own actions.
export const SettingsSection = (props: Props) => (
  <section className={`settings-section ${props.className || ''}`}>
    <div className="settings-section-head">
      <span className="settings-section-title">{props.title}</span>
      {props.hint && <span className="settings-section-hint">{props.hint}</span>}
    </div>
    <div className="settings-section-body">{props.children}</div>
    {props.actions && <div className="settings-section-actions">{props.actions}</div>}
  </section>
);
