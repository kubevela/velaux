import {
  isApplicationPath,
  isClustersPath,
  isAddonsPath,
  isTargetURL,
  isEnvPath,
  isUsersPath,
  isProjectPath,
  isRolesPath,
} from '../../utils/common';
export function getLeftSider(pathname) {
  const isApplication = isApplicationPath(pathname);
  const isCluster = isClustersPath(pathname);
  const isAddons = isAddonsPath(pathname);
  const isTarget = isTargetURL(pathname);
  const isEnv = isEnvPath(pathname);
  const isUser = isUsersPath(pathname);
  const isProject = isProjectPath(pathname);
  const isRole = isRolesPath(pathname);
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
    {
      navName: 'Settings',
      children: [
        {
          className: isUser,
          link: '/users',
          iconType: 'user-group-fill',
          navName: 'Users',
        },
        {
          className: isRole,
          link: '/roles',
          iconType: 'aliwangwang',
          navName: 'Platform Roles',
        },
        {
          className: isProject,
          link: '/projects',
          iconType: 'structured-data',
          navName: 'Projects',
        },
      ],
    },
  ];
}
