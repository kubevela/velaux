import * as React from 'react';
import { AiFillCodeSandboxCircle, AiFillEnvironment, AiFillProject, AiOutlineCluster } from 'react-icons/ai';
import { FaLayerGroup } from 'react-icons/fa';
import { BsFileEarmarkPerson, BsFillFileCodeFill, BsHddNetworkFill, BsPlugin } from 'react-icons/bs';
import { RiUserSettingsFill } from 'react-icons/ri';
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
import { MdConfirmationNumber } from 'react-icons/md';
export function getLeftSlider(pathname: string) {
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
          icon: <FaLayerGroup />,
          navName: 'Applications',
          permission: { resource: 'project:?/application:*', action: 'list' },
        },
        {
          className: isEnv,
          link: '/envs',
          icon: <AiFillEnvironment></AiFillEnvironment>,
          navName: 'Environments',
          permission: { resource: 'project:?/environment:*', action: 'list' },
        },
        {
          className: isPipeline,
          link: '/pipelines',
          icon: <BsHddNetworkFill></BsHddNetworkFill>,
          navName: 'Pipelines',
          permission: { resource: 'project:?/pipeline:*', action: 'list' },
        },
      ],
    },
    {
      navName: 'Resources',
      children: [
        {
          className: isCluster,
          link: '/clusters',
          icon: <AiOutlineCluster />,
          navName: 'Clusters',
          permission: { resource: 'cluster:*', action: 'list' },
        },
        {
          className: isTarget,
          link: '/targets',
          icon: <AiFillCodeSandboxCircle></AiFillCodeSandboxCircle>,
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
          icon: <BsPlugin></BsPlugin>,
          navName: 'Addons',
          permission: { resource: 'addon:*', action: 'list' },
        },
        {
          className: isDefinitions,
          link: '/definitions',
          icon: <BsFillFileCodeFill></BsFillFileCodeFill>,
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
          icon: <RiUserSettingsFill></RiUserSettingsFill>,
          navName: 'Users',
          permission: { resource: 'user:*', action: 'list' },
        },
        {
          className: isRole,
          link: '/roles',
          icon: <BsFileEarmarkPerson></BsFileEarmarkPerson>,
          navName: 'Roles',
          permission: { resource: 'role:*', action: 'list' },
        },
        {
          className: isProject,
          link: '/projects',
          icon: <AiFillProject></AiFillProject>,
          navName: 'Projects',
          permission: { resource: 'project:*', action: 'list' },
        },
        {
          className: isConfig,
          link: '/configs',
          icon: <MdConfirmationNumber></MdConfirmationNumber>,
          navName: 'Configs',
          permission: { resource: 'config:*', action: 'list' },
        },
      ],
    },
  ];
}
