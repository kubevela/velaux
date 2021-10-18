export const leftSider = [
  {
    navName: 'Application Center',
    children: [
      {
        link: '/',
        iconType: 'menu-item-text',
        navName: 'App Manager',
      },
    ],
  },
  {
    navName: 'Env Integration',
    children: [
      {
        link: '/clusters',
        iconType: 'Directory-tree',
        navName: 'Cluster Manager',
      },
    ],
  },
  {
    navName: 'Capability Center',
    children: [
      {
        link: '/plugins',
        iconType: 'database-set',
        navName: 'Plugins Manager',
      },
      {
        link: '/operation',
        iconType: 'set',
        navName: 'Devs Feature',
      },
      {
        link: '/model',
        iconType: 'cloud-machine',
        navName: 'App Model',
      },
    ],
  },
];
