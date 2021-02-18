export default [
  {
    path: '/pipelines',
    name: 'Pipelines',
    icon: 'table',
    component: './Welcome',
  },
  {
    path: '/insights',
    name: 'Insights',
    icon: 'table',
    component: './Welcome',
  },
  {
    path: '/applications',
    name: 'Applications',
    icon: 'table',
    routes: [
      {
        path: '/applications',
        hideInMenu: true,
        component: './Application',
      },
      {
        path: '/applications/create',
        hideInMenu: true,
        name: 'Create Application',
        component: './Application/CreatePage',
      },
      {
        path: '/applications/:appName',
        hideInMenu: true,
        name: 'Application',
        component: './Application/DetailPage',
      },
    ],
  },
  {
    path: '/apptemplates',
    name: 'Application Templates',
    icon: 'table',
    component: './Welcome',
  },
  {
    path: '/environments',
    name: 'Environments',
    icon: 'table',
    component: './Environment',
  },
  {
    path: '/clusters',
    name: 'Clusters',
    icon: 'table',
    component: './Cluster',
  },
  {
    path: '/catalogs',
    name: 'Catalogs',
    icon: 'table',
    routes: [
      {
        path: '/catalogs',
        hideInMenu: true,
        component: './Catalog',
      },
      {
        path: '/catalogs/:catalogName',
        hideInMenu: true,
        name: 'Packages',
        component: './PackageList',
      },
    ],
  },
  {
    path: '/settings',
    name: 'Settings',
    icon: 'SettingOutlined',
    component: './Welcome',
  },
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user',
        routes: [
          {
            name: 'login',
            path: '/user/login',
            component: './User/login',
          },
        ],
      },
    ],
  },
  {
    path: '/welcome',
    hideInMenu: true,
    name: 'welcome',
    icon: 'smile',
    component: './Welcome',
  },
  {
    path: '/admin',
    hideInMenu: true,
    name: 'admin',
    icon: 'crown',
    access: 'canAdmin',
    component: './Admin',
    routes: [
      {
        path: '/admin/sub-page',
        name: 'sub-page',
        icon: 'smile',
        component: './Welcome',
      },
    ],
  },
  {
    name: 'list.table-list',
    hideInMenu: true,
    icon: 'table',
    path: '/list',
    component: './TableList',
  },
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    component: './404',
  },
];
