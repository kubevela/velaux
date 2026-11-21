import { Message } from '@alifd/next';
import i18n from 'i18next';
import React from 'react';

import type { ApplicationDeployResponse } from '@velaux/data';

import { splitQuoted } from './quoted';

// The notice renders in a portal, outside any page stylesheet.
const pill: React.CSSProperties = {
  display: 'inline-block',
  margin: '0 2px',
  padding: '0 8px',
  lineHeight: '20px',
  fontSize: '12px',
  background: '#f0f0f0',
  border: '1px solid #e0e0e0',
  borderRadius: '10px',
};

// warningText shows a warning's quoted values, such as a definition and a
// namespace, as pills.
function warningText(warning: string) {
  return splitQuoted(warning).map((part, i) =>
    part.quoted ? (
      <span key={i} style={pill}>
        {part.text}
      </span>
    ) : (
      <React.Fragment key={i}>{part.text}</React.Fragment>
    )
  );
}

// notifyDeployed tells the user a deploy went through, listing anything the API
// server warned about when it admitted the Application, such as a namespace
// nearing a definition's quota. Warnings stay until dismissed.
export function notifyDeployed(res: ApplicationDeployResponse) {
  const warnings = res.warnings || [];
  if (warnings.length === 0) {
    Message.success(i18n.t('Application deployed successfully'));
    return;
  }
  Message.show({
    type: 'warning',
    title: i18n.t('Application deployed, with warnings'),
    content: (
      <ul style={{ margin: 0, paddingLeft: '16px' }}>
        {warnings.map((warning) => (
          <li key={warning} style={{ lineHeight: '26px' }}>
            {warningText(warning)}
          </li>
        ))}
      </ul>
    ),
    duration: 0,
    closeable: true,
  });
}
