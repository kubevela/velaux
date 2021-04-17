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
  // {
  //   path: '/applications',
  //   name: 'Applications',
  //   icon: 'table',
  //   routes: [
  //     {
  //       path: '/applications',
  //       hideInMenu: true,
  //       component: './Application',
  //     },
  //     {
  //       path: '/applications/create',
  //       hideInMenu: true,
  //       name: 'Create Application',
  //       component: './Application/Create',
  //     },
  //     {
  //       path: '/applications/:appName',
  //       hideInMenu: true,
  //       name: 'Application',
  //       component: './Application/DetailPage',
  //     },
  //   ],
  // },
  {
    path: '/clusters',
    name: 'Clusters',
    icon: 'AppstoreOutlined',
    component: './Cluster',
  },
  {
    path: '/welcome',
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
    path: '/',
    redirect: '/welcome',
  },
  {
    component: './404',
  },
];
