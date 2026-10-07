import React from 'react';

import { splitType } from '../../utils/definitionVersion';
import './index.less';

// TypeLabel is a definition type as a list shows it: its name, and the version
// it is pinned to as a badge; a type that follows the latest has none.
export const TypeLabel = (props: { type?: string; className?: string }) => {
  const { name, version } = splitType(props.type);
  return (
    <span className={props.className}>
      {name}
      {version && <span className="type-version">{version}</span>}
    </span>
  );
};
