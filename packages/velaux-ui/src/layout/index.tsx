import { ConfigProvider } from '@alifd/next';
import React, { useEffect, useState } from 'react';
import LayoutRouter from './LayoutRouter';
import LeftMenu from './LeftMenu';
import Header from './Header';
import { ProjectPicker } from '../components/ProjectPicker';
import QuickSearch from '../components/QuickSearch';
import './index.less';
import { LayoutMode, LayoutModes, Workspace } from '@velaux/data';
import { locationService } from '../services/LocationService';
import { menuService } from '../services/MenuService';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ErrorShow } from '../components/ErrorShow';

// sidebarCollapsedKey remembers the sidebar minimised to icons across pages
// and visits, as a query parameter would not survive the next link.
const sidebarCollapsedKey = 'sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(sidebarCollapsedKey) === 'true';
  } catch (e) {
    return false;
  }
}

export default function MainLayout(props: any) {
  const [workspace, setWorkspace] = useState<Workspace>();
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed());
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
    try {
      localStorage.setItem(sidebarCollapsedKey, String(!collapsed));
    } catch (e) {
      // A browser that refuses storage still toggles, for this page.
    }
  };
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
      <ErrorBoundary>
        {({ error, errorInfo }) => {
          if (error) {
            return <ErrorShow error={error} errorInfo={errorInfo} />;
          }
          return (
            <div className="layout">
              {mode !== LayoutModes.NeatPro && (
                <Header
                  currentWorkspace={workspace}
                  mode={mode}
                  collapsed={collapsed || mode === LayoutModes.Neat}
                  onToggleCollapsed={toggleCollapsed}
                  {...props}
                >
                  <LeftMenu {...props} collapsed={collapsed || mode === LayoutModes.Neat} />
                </Header>
              )}
              <div className="layout-shell">
                {mode !== LayoutModes.NeatPro && (
                  <div className="layout-topbar">
                    <QuickSearch userInfo={props.userInfo} />
                    <div className="layout-topbar-end">
                      <ProjectPicker />
                    </div>
                  </div>
                )}
                <div className="layout-content">
                  <LayoutRouter></LayoutRouter>
                </div>
              </div>
            </div>
          );
        }}
      </ErrorBoundary>
    </ConfigProvider>
  );
}
