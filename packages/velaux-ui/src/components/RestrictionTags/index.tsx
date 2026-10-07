import { Balloon, Tag } from '@alifd/next';
import React from 'react';

import type { DefinitionRestrictions } from '@velaux/data';

import { describeNamespaces, describeQuota } from '../../utils/restrictions';
import { Translation } from '../Translation';

import './index.less';

function RestrictionTag(props: { label: string; heading: string; lines: string[] }) {
  return (
    <Balloon
      closable={false}
      popupClassName="restriction-tags-popup"
      trigger={
        <Tag size="small" className="restriction-tag">
          <Translation>{props.label}</Translation>
        </Tag>
      }
    >
      <div className="restriction-tags-heading">
        <Translation>{props.heading}</Translation>
      </div>
      <ul>
        {props.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </Balloon>
  );
}

// RestrictionTags shows which namespaces may use a definition and its quota, as
// the Application webhook enforces them, each tag listing its rules on hover.
export const RestrictionTags = (props: { restrictions?: DefinitionRestrictions }) => {
  const namespaces = describeNamespaces(props.restrictions);
  const quota = describeQuota(props.restrictions);
  return (
    <span className="restriction-tags">
      {namespaces.length > 0 && <RestrictionTag label="Namespaces" heading="Usable from" lines={namespaces} />}
      {quota.length > 0 && <RestrictionTag label="Quota" heading="Quota, first match applies" lines={quota} />}
    </span>
  );
};
