import {
  isApplicationPath,
  isClustersPath,
  isAddonsPath,
  isTargetURL,
  isEnvPath,
  isUsersPath,
  isProjectPath,
  isRolesPath,
  isConfigPath,
  isPipelinePath,
  isDefinitionsPath,
} from '../../utils/common';
export function getLeftSlider(pathname) {
  const isApplication = isApplicationPath(pathname);
  const isCluster = isClustersPath(pathname);
  const isAddons = isAddonsPath(pathname);
  const isTarget = isTargetURL(pathname);
  const isEnv = isEnvPath(pathname);
  const isPipeline = isPipelinePath(pathname);
  const isUser = isUsersPath(pathname);
  const isProject = isProjectPath(pathname);
  const isRole = isRolesPath(pathname);
  const isConfig = isConfigPath(pathname);
  const isDefinitions = isDefinitionsPath(pathname);
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
          iconType: 'layer-group',
          navName: 'Environments',
          permission: { resource: 'project:?/environment:*', action: 'list' },
        },
        {
          className: isPipeline,
          link: '/pipelines',
          iconType: 'Directory-tree',
          navName: 'Pipelines',
          permission: { resource: 'project:?/pipelines:*', action: 'list' },
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
        {
          className: isDefinitions,
          link: '/definitions',
          iconType: 'database-set',
          navName: 'Definitions',
          permission: { resource: 'definition:*', action: 'list' },
        },
      ],
    },
    {
      navName: 'Platform',
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
          navName: 'Roles',
          permission: { resource: 'role:*', action: 'list' },
        },
        {
          className: isProject,
          link: '/projects',
          iconType: 'structured-data',
          navName: 'Projects',
          permission: { resource: 'project:*', action: 'list' },
        },
        {
          className: isConfig,
          link: '/configs',
          iconType: 'indent',
          navName: 'Configs',
          permission: { resource: 'config:*', action: 'list' },
        },
      ],
    },
  ];
}
