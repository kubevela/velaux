import { Balloon, Tag } from '@alifd/next';
import i18n from 'i18next';
import React from 'react';

// Why each scope matters, as KubeVela applies a policy of it.
const scopeHelp: Record<string, string> = {
  Builtin: 'Consumed by KubeVela directly',
  Workload: "Rendered with the Application's components",
  Application: 'Applied to the Application as a whole, before it renders',
};

// PolicyScopeTag marks how KubeVela applies a policy, saying so on hover.
export const PolicyScopeTag = (props: { scope?: string }) => {
  if (!props.scope) {
    return null;
  }
  return (
    <Balloon.Tooltip
      align="t"
      trigger={
        <Tag size="small" className="policy-scope-tag">
          {i18n.t(props.scope)}
        </Tag>
      }
    >
      {i18n.t(scopeHelp[props.scope] || props.scope)}
    </Balloon.Tooltip>
  );
};
