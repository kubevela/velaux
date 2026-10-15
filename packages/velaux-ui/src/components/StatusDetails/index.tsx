import React from 'react';

import type { ComponentStatus } from '@velaux/data';

import { detailEntries } from '../../utils/status';
import type { DetailEntry } from '../../utils/status';
import { Translation } from '../Translation';

import './index.less';

export function DetailList(props: { entries: DetailEntry[] }) {
  return (
    <dl className="status-details-list">
      {props.entries.map((entry) => (
        <React.Fragment key={entry.key}>
          <dt>{entry.key}</dt>
          <dd>{entry.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

// StatusDetails shows the details a component's definition, and each of its
// traits' definitions, report in status.details.
export const StatusDetails = (props: { status: ComponentStatus }) => {
  const componentEntries = detailEntries(props.status.details);
  const traits = (props.status.traits || [])
    .map((trait) => ({ type: trait.type, entries: detailEntries(trait.details) }))
    .filter((trait) => trait.entries.length > 0);
  return (
    <div className="status-details">
      {componentEntries.length > 0 && (
        <div className="status-details-section">
          <div className="status-details-title">
            <Translation>Component</Translation>
          </div>
          <DetailList entries={componentEntries} />
        </div>
      )}
      {traits.map((trait, index) => (
        <div className="status-details-section" key={`${trait.type}-${index}`}>
          <div className="status-details-title">
            <Translation>Trait</Translation>: {trait.type}
          </div>
          <DetailList entries={trait.entries} />
        </div>
      ))}
    </div>
  );
};
