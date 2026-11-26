import { Link } from 'dva/router';
import React from 'react';

import { Translation } from '../Translation';
import './index.less';

// PageTabs is a detail page's one left-aligned row of tabs, under its header.
export const PageTabs = (props: { children: React.ReactNode }) => (
  <div className="page-tabs" role="tablist">
    {props.children}
  </div>
);

// PageTab is one tab in PageTabs, a link marked when its page is the one shown.
export const PageTab = (props: { label: string; to: string; active: boolean }) => (
  <Link role="tab" aria-selected={props.active} className={`page-tab ${props.active ? 'active' : ''}`} to={props.to}>
    <Translation>{props.label}</Translation>
  </Link>
);
