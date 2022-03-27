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
export function getLeftSlider(pathname) {
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
          permission: { resource: 'project:?/application:*', action: 'list' },
        },
        {
          className: isEnv,
          link: '/envs',
          iconType: 'Directory-tree',
          navName: 'Environments',
          permission: { resource: 'project:?/environment:*', action: 'list' },
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
          permission: { resource: 'cluster:*', action: 'list' },
        },
        {
          className: isTarget,
          link: '/targets',
          iconType: 'box',
          navName: 'Targets',
          permission: { resource: 'target:*', action: 'list' },
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
          permission: { resource: 'addon:*', action: 'list' },
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
          permission: { resource: 'user:*', action: 'list' },
        },
        {
          className: isRole,
          link: '/roles',
          iconType: 'supervise',
          navName: 'Platform Roles',
          permission: { resource: 'role:*', action: 'list' },
        },
        {
          className: isProject,
          link: '/projects',
          iconType: 'structured-data',
          navName: 'Projects',
          permission: { resource: 'project:*', action: 'list' },
        },
      ],
    },
  ];
}
