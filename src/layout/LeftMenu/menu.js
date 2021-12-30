import {
  isApplicationPath,
  isClustersPath,
  isAddonsPath,
  isTargetURL,
  isEnvPath,
} from '../../utils/common';
export function getLeftSider(pathname) {
  const isApplication = isApplicationPath(pathname);
  const isCluster = isClustersPath(pathname);
  const isAddons = isAddonsPath(pathname);
  const isTarget = isTargetURL(pathname);
  const isEnv = isEnvPath(pathname);
  return [
    {
      navName: 'Continuous Delivery',
      children: [
        {
          className: isApplication,
          link: '/applications',
          iconType: 'layergroup-fill',
          navName: 'Applications',
        },
        {
          className: isEnv,
          link: '/envs',
          iconType: 'Directory-tree',
          navName: 'Environments',
        },
      ],
    },
    {
      navName: 'Resources',
      children: [
        {
          className: isCluster,
          link: '/clusters',
          iconType: 'clouddownload',
          navName: 'Clusters',
        },
        {
          className: isTarget,
          link: '/targets',
          iconType: 'box',
          navName: 'Targets',
        },
      ],
    },
    {
      navName: 'Extension',
      children: [
        {
          className: isAddons,
          link: '/addons',
          iconType: 'database-set',
          navName: 'Addons',
        },
      ],
    },
  ];
}
