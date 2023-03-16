import { ConfigProvider } from '@alifd/next';
import React, { useEffect, useState } from 'react';
import LayoutRouter from './LayoutRouter';
import LeftMenu from './LeftMenu';
import Header from './Header';
import './index.less';
import { LayoutMode, Workspace } from 'src/types/main';
import { locationService } from '../services/LocationService';
import { menuService } from '../services/MenuService';

export default function MainLayout(props: any) {
  const [workspace, setWorkspace] = useState<Workspace>();
  const [mode, setMode] = useState<LayoutMode>('default');
  const query = locationService.getSearchObject();
  const path = locationService.getPathName();
  useEffect(() => {
    const layoutMode = query['layout-mode'];
    if (layoutMode && ['neat', 'neat2', 'default'].includes(layoutMode.toString())) {
      setMode(layoutMode as LayoutMode);
    }
    setWorkspace(menuService.loadCurrentWorkspace());
  }, [query, path]);
  return (
    <ConfigProvider>
      <div className="layout">
        {mode !== 'neat2' && <Header currentWorkspace={workspace} mode={mode} {...props} />}
        <div className="layout-shell">
          {mode === 'default' && (
            <div className="layout-navigation">
              <LeftMenu {...props} />
            </div>
          )}
          <div className="layout-content">
            <LayoutRouter />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
