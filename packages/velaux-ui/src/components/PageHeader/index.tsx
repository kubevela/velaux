import React from 'react';

import { Breadcrumb } from '../Breadcrumb';
import './index.less';

type Props = {
  breadcrumb: { to?: string; title: JSX.Element | string }[];
  title: React.ReactNode;
  // Shown beside the title: badges and short facts.
  children?: React.ReactNode;
  // Shown under the title row.
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

// PageHeader heads a detail page: where it sits, its name with its badges and
// facts, and its actions on the right.
export const PageHeader = (props: Props) => (
  <div className="page-head">
    <Breadcrumb items={props.breadcrumb} />
    <div className="page-head-main">
      <h1 className="page-head-name">{props.title}</h1>
      {props.children}
      {props.actions && <div className="page-head-actions">{props.actions}</div>}
    </div>
    {props.description && <div className="page-head-description">{props.description}</div>}
  </div>
);
