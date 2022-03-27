import React from 'react';
import { ConfigProvider } from '@alifd/next';
import Content from './Content';
import LeftMenu from './LeftMenu';
import TopBar from './TopBar';
import './index.less';

export default function MainLayout(props: any) {
  return (
    <ConfigProvider>
      <div className="layout">
        <TopBar {...props} />
        <div className="layout-shell">
          <div className="layout-navigation">
            <LeftMenu {...props} />
          </div>
          <div className="layout-content">
            <Content />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
