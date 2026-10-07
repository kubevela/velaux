import React from 'react';

import { flattenProperties } from './properties';
import './index.less';

export { flattenProperties } from './properties';

// PropertyList lists properties by path, as an expanded row shows them.
export const PropertyList = (props: { properties: unknown }) => (
  <dl className="row-list-properties">
    {flattenProperties(props.properties).map((p) => (
      <React.Fragment key={p.key}>
        <dt>{p.key}</dt>
        <dd title={p.value}>{p.value}</dd>
      </React.Fragment>
    ))}
  </dl>
);
