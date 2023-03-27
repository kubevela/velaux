import { ConfigProvider } from '@alifd/next';
import React, { useEffect, useState } from 'react';
import LayoutRouter from './LayoutRouter';
import LeftMenu from './LeftMenu';
import Header from './Header';
import './index.less';
import { LayoutMode, Workspace, LayoutModes } from '@velaux/data';
import { locationService } from '../services/LocationService';
import { menuService } from '../services/MenuService';

export default function MainLayout(props: any) {
  const [workspace, setWorkspace] = useState<Workspace>();
  const [mode, setMode] = useState<LayoutMode>(LayoutModes.Default);
  const query = locationService.getSearchObject();
  const path = locationService.getPathName();
  useEffect(() => {
    const layoutMode = query['layout-mode'];
    if (layoutMode && [LayoutModes.Neat, LayoutModes.NeatPro, LayoutModes.Default].includes(layoutMode as LayoutMode)) {
      setMode(layoutMode as LayoutMode);
    }
    menuService.loadPluginMenus().then(() => {
      setWorkspace(menuService.loadCurrentWorkspace());
    });
  }, [query, path]);
  return (
    <ConfigProvider>
      <div className="layout">
        {mode !== LayoutModes.NeatPro && <Header currentWorkspace={workspace} mode={mode} {...props} />}
        <div className="layout-shell">
          {mode === LayoutModes.Default && (
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
