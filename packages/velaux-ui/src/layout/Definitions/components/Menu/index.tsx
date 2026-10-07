import { Link } from 'dva/router';
import React from 'react';

import type { DefinitionMenuType } from '@velaux/data';
import { Translation } from '../../../../components/Translation';
import './index.less';

type Props = {
  activeType: string;
  definitionTypes: DefinitionMenuType[];
};

// Menu is the definitions page's tabs, one per definition type.
const Menu = (props: Props) => (
  <div className="definitions-tabs" role="tablist">
    {(props.definitionTypes || []).map((item) => (
      <Link
        key={item.type}
        role="tab"
        aria-selected={props.activeType === item.type}
        className={`definitions-tab ${props.activeType === item.type ? 'active' : ''}`}
        to={`/definitions/${item.type}/config`}
      >
        <Translation>{item.name}</Translation>
      </Link>
    ))}
  </div>
);

export default Menu;
