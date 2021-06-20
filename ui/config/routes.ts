export default [
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
            component: './user/Login',
          },
        ],
      },
    ],
  },
  {
    path: '/application-input',
    hideInMenu: true,
    name: 'Application Form',
    component: './Application/InputForm',
  },
  {
    path: '/applications',
    name: 'Applications',
    icon: 'AppstoreOutlined',
    routes: [
      {
        path: '/applications',
        hideInMenu: true,
        component: './Application',
      },
      {
        path: '/applications/:appName',
        hideInMenu: true,
        name: 'Application',
        component: './Application/Detail',
      },
    ],
  },
  {
    path: '/clusters',
    name: 'Clusters',
    icon: 'ClusterOutlined',
    routes: [
      {
        path: '/clusters',
        hideInMenu: true,
        name: 'Clusters',
        component: './Cluster',
      },
      {
        path: '/clusters/:clusterName',
        hideInMenu: true,
        component: './Cluster/Detail',
      },
      {
        path: '/clusters/:clusterName/schema',
        hideInMenu: true,
        component: './Cluster/Schema',
      },
    ],
  },
  {
    path: '/catalogs',
    name: 'Catalogs',
    icon: 'CloudServerOutlined',
    routes: [
      {
        path: '/catalogs',
        hideInMenu: true,
        name: 'Catalogs',
        component: './Catalog',
      },
      {
        path: '/catalogs/:catalogName',
        hideInMenu: true,
        component: './Catalog/Detail',
      },
    ],
  },
  {
    path: '/',
    name: 'welcome',
    hideInMenu: true,
    icon: 'smile',
    component: './Welcome',
  },
  // {
  //   path: '/admin',
  //   name: 'admin',
  //   icon: 'crown',
  //   access: 'canAdmin',
  //   component: './Admin',
  //   routes: [
  //     {
  //       path: '/admin/sub-page',
  //       name: 'sub-page',
  //       icon: 'smile',
  //       component: './Welcome',
  //     },
  //   ],
  // },
  // {
  //   name: 'list.table-list',
  //   icon: 'table',
  //   path: '/list',
  //   component: './TableList',
  // },
  {
    component: './404',
  },
];
