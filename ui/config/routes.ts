export default [
  {
    path: '/clusters',
    name: 'Clusters',
    icon: 'table',
    component: './Cluster',
  },
  {
    path: '/environments',
    name: 'Environments',
    icon: 'table',
    component: './Environment',
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
    name: 'welcome',
    icon: 'smile',
    component: './Welcome',
  },
  {
    path: '/admin',
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
