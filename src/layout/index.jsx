import React from 'react';
import { ConfigProvider } from '@alifd/next';
import Content from './Content';
import LeftMenu from './LeftMenu';
import TopBar from './top-bar/index';
import './index.less';

export default function MainLayout(props) {
  return (
    <ConfigProvider>
      <div className="layout">
        <TopBar />
        <div className="layout-shell">
          <div className="layout-navigation">
            <LeftMenu props={props} />
          </div>
          <div className="layout-content">
            <Content data={props} />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
