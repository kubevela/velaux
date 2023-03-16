import { Project } from 'src/interface/project';
import * as React from 'react';
import { FaLayerGroup } from 'react-icons/fa';
import {
  AiFillCodeSandboxCircle,
  AiFillEnvironment,
  AiFillProject,
  AiFillSetting,
  AiOutlineCluster,
} from 'react-icons/ai';
import { BsFileEarmarkPerson, BsFillFileCodeFill, BsHddNetworkFill, BsPlugin } from 'react-icons/bs';
import { RiUserSettingsFill } from 'react-icons/ri';
import { MdConfirmationNumber } from 'react-icons/md';
import { ApplicationBase, EnvBinding } from 'src/interface/application';
import { Workspace, Menu } from '../types/main';
import { locationService } from './LocationService';
import { LoginUserInfo } from '../interface/user';
import { checkPermission } from '../utils/permission';

const defaultWorkspaces: Workspace[] = [
  {
    name: 'continuous-delivery',
    label: 'Continuous Delivery',
    rootRoute: '/applications',
    icon: <FaLayerGroup />,
  },
  {
    name: 'platform',
    label: 'Platform Setting',
    rootRoute: '/addons',
    icon: <AiFillSetting />,
  },
];

const defaultWorkspaceMenus: Menu[] = [
  {
    workspace: 'continuous-delivery',
    type: 'Workspace',
    icon: <AiFillProject></AiFillProject>,
    name: 'projects',
    label: 'My Projects',
    to: '/projects',
    relatedRoute: ['/projects'],
  },
  {
    workspace: 'continuous-delivery',
    type: 'Workspace',
    catalog: 'Continuous Delivery',
    icon: <FaLayerGroup />,
    name: 'applications',
    label: 'Applications',
    to: '/applications',
    permission: { resource: 'project:?/application:*', action: 'list' },
    relatedRoute: ['/applications'],
  },
  {
    workspace: 'continuous-delivery',
    to: '/envs',
    type: 'Workspace',
    catalog: 'Continuous Delivery',
    icon: <AiFillEnvironment></AiFillEnvironment>,
    label: 'Environments',
    name: 'env-list',
    permission: { resource: 'project:?/environment:*', action: 'list' },
    relatedRoute: ['/envs'],
  },
  {
    workspace: 'continuous-delivery',
    type: 'Workspace',
    name: 'pipeline-list',
    catalog: 'Continuous Delivery',
    to: '/pipelines',
    relatedRoute: [/projects\/.*\/pipelines\/.*/, '/pipelines'],
    icon: <BsHddNetworkFill></BsHddNetworkFill>,
    label: 'Pipelines',
    permission: { resource: 'project:?/pipeline:*', action: 'list' },
  },
  {
    type: 'Workspace',
    catalog: 'Resources',
    workspace: 'continuous-delivery',
    to: '/clusters',
    icon: <AiOutlineCluster />,
    label: 'Clusters',
    name: 'cluster-list',
    permission: { resource: 'cluster:*', action: 'list' },
    relatedRoute: ['/clusters'],
  },
  {
    workspace: 'continuous-delivery',
    type: 'Workspace',
    catalog: 'Resources',
    to: '/targets',
    icon: <AiFillCodeSandboxCircle></AiFillCodeSandboxCircle>,
    label: 'Targets',
    name: 'target-list',
    permission: { resource: 'target:*', action: 'list' },
    relatedRoute: ['/targets'],
  },
  {
    workspace: 'platform',
    type: 'Workspace',
    to: '/addons',
    catalog: 'Extension',
    icon: <BsPlugin></BsPlugin>,
    label: 'Addons',
    name: 'addon-list',
    permission: { resource: 'addon:*', action: 'list' },
    relatedRoute: ['/addons'],
  },
  {
    workspace: 'platform',
    type: 'Workspace',
    to: '/definitions',
    catalog: 'Extension',
    icon: <BsFillFileCodeFill></BsFillFileCodeFill>,
    label: 'Definitions',
    name: 'definition-list',
    permission: { resource: 'definition:*', action: 'list' },
    relatedRoute: ['/definitions'],
  },
  {
    workspace: 'platform',
    type: 'Workspace',
    to: '/platform/projects',
    catalog: 'Setting',
    icon: <AiFillProject></AiFillProject>,
    label: 'Projects',
    name: 'project-list',
    permission: { resource: 'project:*', action: 'list' },
    relatedRoute: ['/platform/projects$'],
  },
  {
    workspace: 'platform',
    type: 'Workspace',
    to: '/users',
    catalog: 'Setting',
    icon: <RiUserSettingsFill></RiUserSettingsFill>,
    label: 'Users',
    name: 'user-list',
    permission: { resource: 'user:*', action: 'list' },
    relatedRoute: ['/users'],
  },
  {
    workspace: 'platform',
    type: 'Workspace',
    to: '/roles',
    catalog: 'Setting',
    icon: <BsFileEarmarkPerson></BsFileEarmarkPerson>,
    label: 'Platform Roles',
    name: 'role-list',
    permission: { resource: 'role:*', action: 'list' },
    relatedRoute: ['^/roles$'],
  },

  {
    workspace: 'platform',
    type: 'Workspace',
    to: '/configs',
    catalog: 'Setting',
    icon: <MdConfirmationNumber></MdConfirmationNumber>,
    label: 'Global Configs',
    name: 'configs',
    permission: { resource: 'config:*', action: 'list' },
    relatedRoute: ['/configs'],
  },
];

type LeftMenu = {
  catalog?: string;
  menus: Menu[];
};

/**
 * @public
 * A wrapper to generate the menu configs
 */
export interface MenuService {
  loadWorkspaces(user?: LoginUserInfo): Workspace[];
  loadCurrentWorkspace(): Workspace | undefined;
  loadMenus(workspace: Workspace, user: LoginUserInfo): LeftMenu[];
  loadProjectMenus(p: Project): Menu[];
  loadApplicationEnvMenus(p: Project, app: ApplicationBase, env: EnvBinding): Menu[];
}

/** @internal */
export class MenuWrapper implements MenuService {
  private menus: Menu[];
  private workspaces: Workspace[];
  constructor() {
    this.menus = defaultWorkspaceMenus;
    this.workspaces = defaultWorkspaces;
    //TODO: load the menu config from the all installed plugins
  }
  getWorkspace(name: string): Workspace | undefined {
    return this.workspaces.find((w) => w.name == name);
  }
  loadCurrentWorkspace(): Workspace | undefined {
    let w: Workspace | undefined = undefined;
    this.menus.map((m) => {
      if (this.matchMenu(m)) {
        w = this.getWorkspace(m.workspace);
      }
    });
    return w;
  }
  loadWorkspaces(user?: LoginUserInfo): Workspace[] {
    const availableWorkspaces = this.workspaces.filter((ws) => this.loadMenus(ws, user).length > 0);
    return availableWorkspaces;
  }
  loadMenus(workspace: Workspace, user?: LoginUserInfo): LeftMenu[] {
    let menus: LeftMenu[] = [];
    this.menus
      .filter((menu) => menu.workspace == workspace.name)
      .map((menu) => {
        if (!checkPermission(menu.permission, '?', user)) {
          return;
        }
        const catalog = menus.filter((m) => m.catalog == menu.catalog);
        const newMenu = Object.assign(menu, { active: this.matchMenu(menu) });
        if (catalog && catalog.length > 0) {
          catalog[0].menus.push(newMenu);
        } else {
          menus.push({ catalog: menu.catalog, menus: [newMenu] });
        }
      });
    return menus;
  }
  matchMenu(menu: Menu): boolean {
    const currentPath = locationService.getPathName();
    let matched = false;
    menu.relatedRoute?.map((route) => {
      if (currentPath.match(route)) {
        matched = true;
      }
    });
    return matched;
  }
  loadProjectMenus(p: Project): Menu[] {
    return [];
  }
  loadApplicationEnvMenus(p: Project, app: ApplicationBase, env: EnvBinding): Menu[] {
    return [];
  }
}

/**
 * @public
 */
export let menuService: MenuService = new MenuWrapper();
