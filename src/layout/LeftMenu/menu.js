import {
  isApplicationPath,
  isClustersPath,
  isAddonsPath,
  isDeliveryTarget,
} from '../../utils/common';
export function getLeftSider(pathname) {
  const isApplication = isApplicationPath(pathname);
  const isCluster = isClustersPath(pathname);
  const isAddons = isAddonsPath(pathname);
  const isDeliveryTargetURL = isDeliveryTarget(pathname);
  return [
    {
      navName: 'Application Center',
      children: [
        {
          className: isApplication,
          link: '/applications',
          iconType: 'layergroup-fill',
          navName: 'Application Manager',
        },
        {
          className: isDeliveryTargetURL,
          link: '/deliveryTargets',
          iconType: 'box',
          navName: 'Delivery Target Manager',
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
          className: isAddons,
          link: '/addons',
          iconType: 'database-set',
          navName: 'Plugins Manager',
        },
      ],
    },
  ];
}
