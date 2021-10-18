import {
  isApplicationPath,
  isClustersPath,
  isAddonsPath,
  isOperationPath,
  isModelPath,
} from '../../utils/common';
export function getLeftSider(pathname) {
  const isApplication = isApplicationPath(pathname);
  const isCluster = isClustersPath(pathname);
  const isPlugins = isAddonsPath(pathname);
  const isOperation = isOperationPath(pathname);
  const isModel = isModelPath(pathname);

  return [
    {
      navName: 'Application Center',
      children: [
        {
          className: isApplication,
          link: '/applications',
          iconType: 'layergroup-fill',
          navName: 'App Manager',
        },
      ],
    },
    {
      navName: 'Env Integration',
      children: [
        {
          className: isCluster,
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
          className: isPlugins,
          link: '/addons',
          iconType: 'database-set',
          navName: 'Plugins Manager',
        },
        {
          className: isOperation,
          link: '/operation',
          iconType: 'set',
          navName: 'Devs Feature',
        },
        {
          className: isModel,
          link: '/model',
          iconType: 'cloud-machine',
          navName: 'App Model',
        },
      ],
    },
  ];
}
