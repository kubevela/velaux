import { ConfigProvider } from '@alifd/next';
import React, { useEffect, useState } from 'react';
import Content from './Content';
import LeftMenu from './LeftMenu';
import TopBar from './TopBar';
import './index.less';
import { LayoutMode } from 'src/types/main';
import { locationService } from '../services/LocationService';

export default function MainLayout(props: any) {
  const [mode, setMode] = useState<LayoutMode>('default');
  const query = locationService.getSearchObject();
  useEffect(() => {
    if (query['layout-mode'] == 'default' || query['layout-mode'] == 'neat') {
      setMode(query['layout-mode']);
    }
  }, [query]);
  return (
    <ConfigProvider>
      <div className="layout">
        <TopBar mode={mode} {...props} />
        <div className="layout-shell">
          {mode === 'default' && (
            <div className="layout-navigation">
              <LeftMenu {...props} />
            </div>
          )}
          <div className="layout-content">
            <Content />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
