import { Link } from 'dva/router';
import React from 'react';

import './index.less';

type Props = {
  name: string;
  alias?: string;
  // to links the main text to a route.
  to?: string;
  onClick?: () => void;
  // detail follows the name on the second line, such as a description.
  detail?: React.ReactNode;
};

// AliasName shows a resource's alias as the main text, with its name small and grey beneath when they differ.
export const AliasName = (props: Props) => {
  const title = props.alias || props.name;
  const showName = !!props.alias && props.alias !== props.name;
  let main: React.ReactNode = <span className="alias-name-title">{title}</span>;
  if (props.to) {
    main = (
      <Link className="alias-name-title alias-name-link" to={props.to}>
        {title}
      </Link>
    );
  } else if (props.onClick) {
    main = (
      <a className="alias-name-title alias-name-link" onClick={props.onClick}>
        {title}
      </a>
    );
  }
  return (
    <span className="alias-name">
      {main}
      {(showName || props.detail) && (
        <span className="alias-name-sub">
          {showName && props.name}
          {showName && props.detail ? ' · ' : ''}
          {props.detail}
        </span>
      )}
    </span>
  );
};
