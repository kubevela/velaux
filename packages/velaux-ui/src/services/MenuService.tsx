import { Project, ApplicationBase, EnvBinding, Menu, MenuTypes, Workspace, LoginUserInfo } from '@velaux/data';
import * as React from 'react';
import _ from 'lodash';
import { FaLayerGroup } from 'react-icons/fa';
import {
  AiFillCodeSandboxCircle,
  AiFillEnvironment,
  AiFillProject,
  AiFillSetting,
  AiOutlineCluster,
} from 'react-icons/ai';
import {
  BsCollection,
  BsGrid,
  BsDiagram3,
  BsFileEarmarkPerson,
  BsFillFileCodeFill,
  BsHddNetworkFill,
  BsLayers,
  BsPlugin,
  BsFileEarmarkCode,
  BsGear,
  BsBoxSeam,
  BsBoxes,
} from 'react-icons/bs';
import { RiUserSettingsFill } from 'react-icons/ri';
import { MdConfirmationNumber } from 'react-icons/md';
import { locationService } from './LocationService';
import { checkPermission } from '../utils/permission';
import { getPluginSrv } from './PluginService';

const defaultWorkspaces: Workspace[] = [
  {
    name: 'continuous-delivery',
    label: 'Continuous Delivery',
    rootRoute: '/applications',
    icon: <FaLayerGroup />,
  },

  {
    name: 'extension',
    label: 'Extension',
    rootRoute: '/addons',
    icon: <BsPlugin></BsPlugin>,
  },
  {
    name: 'admin',
    label: 'Admin Dashboard',
    rootRoute: '/clusters',
    icon: <AiFillSetting />,
  },
];

const defaultWorkspaceMenus: Menu[] = [
  // Provisioning is not built yet: its items show what is coming.
  {
    catalog: 'Provisioning',
    workspace: 'continuous-delivery',
    type: MenuTypes.Workspace,
    name: 'provisioning-fleets',
    to: '',
    relatedRoute: [],
    icon: <BsCollection />,
    label: 'Fleets',
    comingSoon: true,
  },
  {
    catalog: 'Provisioning',
    workspace: 'continuous-delivery',
    type: MenuTypes.Workspace,
    name: 'provisioning-clusters',
    to: '',
    relatedRoute: [],
    icon: <AiOutlineCluster />,
    label: 'Clusters',
    comingSoon: true,
  },
  {
    catalog: 'Provisioning',
    workspace: 'continuous-delivery',
    type: MenuTypes.Workspace,
    name: 'provisioning-cluster-blueprints',
    to: '',
    relatedRoute: [],
    icon: <BsDiagram3 />,
    label: 'Cluster Blueprints',
    comingSoon: true,
  },
  {
    catalog: 'Provisioning',
    workspace: 'continuous-delivery',
    type: MenuTypes.Workspace,
    name: 'provisioning-cluster-planes',
    to: '',
    relatedRoute: [],
    icon: <BsLayers />,
    label: 'Cluster Planes',
    comingSoon: true,
  },
  {
    catalog: 'Delivery',
    workspace: 'continuous-delivery',
    type: MenuTypes.Workspace,
    icon: <FaLayerGroup />,
    name: 'applications',
    label: 'Applications',
    to: '/applications',
    permission: { resource: 'project:?/application:*', action: 'list' },
    relatedRoute: ['/applications'],
  },
  {
    catalog: 'Delivery',
    workspace: 'continuous-delivery',
    type: MenuTypes.Workspace,
    to: '/shared-workflows',
    icon: <BsDiagram3 />,
    label: 'Workflows',
    name: 'shared-workflows',
    permission: { resource: 'project:?/workflow:*', action: 'list' },
    relatedRoute: ['/shared-workflows', /\/shared-workflows\/.*/],
  },
  {
    catalog: 'Delivery',
    workspace: 'continuous-delivery',
    to: '/envs',
    type: MenuTypes.Workspace,
    icon: <AiFillEnvironment></AiFillEnvironment>,
    label: 'Environments',
    name: 'env-list',
    permission: { resource: 'project:?/environment:*', action: 'list' },
    relatedRoute: ['/envs'],
  },
  {
    catalog: 'Delivery',
    workspace: 'continuous-delivery',
    type: MenuTypes.Workspace,
    to: '/targets',
    icon: <AiFillCodeSandboxCircle></AiFillCodeSandboxCircle>,
    label: 'Targets',
    name: 'target-list',
    permission: { resource: 'target:*', action: 'list' },
    relatedRoute: ['/targets'],
  },
  {
    catalog: 'Operations',
    workspace: 'continuous-delivery',
    type: MenuTypes.Workspace,
    name: 'pipeline-list',
    to: '/pipelines',
    relatedRoute: [/projects\/.*\/pipelines\/.*/, '/pipelines'],
    icon: <BsHddNetworkFill></BsHddNetworkFill>,
    label: 'Pipelines',
    permission: { resource: 'project:?/pipeline:*', action: 'list' },
  },
  // Items not built yet show what is coming.
  {
    catalog: 'Operations',
    workspace: 'continuous-delivery',
    type: MenuTypes.Workspace,
    name: 'operations-coming',
    to: '',
    relatedRoute: [],
    icon: <BsGear />,
    label: 'Operations',
    comingSoon: true,
  },
  {
    catalog: 'Operations',
    workspace: 'continuous-delivery',
    type: MenuTypes.Workspace,
    name: 'operation-templates',
    to: '',
    relatedRoute: [],
    icon: <BsFileEarmarkCode />,
    label: 'Operation Templates',
    comingSoon: true,
  },
  {
    catalog: 'Extension',
    workspace: 'extension',
    type: MenuTypes.Workspace,
    to: '/addons',
    icon: <BsPlugin></BsPlugin>,
    label: 'Addons',
    name: 'addon-list',
    permission: { resource: 'addon:*', action: 'list' },
    relatedRoute: ['/addons', /\/manage\/plugins.*/],
  },
  {
    catalog: 'Extension',
    workspace: 'extension',
    type: MenuTypes.Workspace,
    name: 'modules-coming',
    to: '',
    relatedRoute: [],
    icon: <BsGrid />,
    label: 'Modules',
    comingSoon: true,
  },
  {
    catalog: 'Extension',
    workspace: 'extension',
    type: MenuTypes.Workspace,
    to: '/defkit',
    icon: <BsBoxes />,
    label: 'DefKit',
    name: 'defkit-list',
    // A module installs definitions, so it is listed to whoever may list them.
    permission: { resource: 'definition:*', action: 'list' },
    relatedRoute: ['/defkit'],
  },
  {
    catalog: 'Extension',
    workspace: 'extension',
    type: MenuTypes.Workspace,
    to: '/definitions',
    icon: <BsFillFileCodeFill></BsFillFileCodeFill>,
    label: 'Definitions',
    name: 'definition-list',
    permission: { resource: 'definition:*', action: 'list' },
    relatedRoute: ['/definitions'],
  },
  {
    catalog: 'Extension',
    workspace: 'extension',
    type: MenuTypes.Workspace,
    to: '/packages',
    icon: <BsBoxSeam />,
    label: 'Packages',
    name: 'package-list',
    // Packages are what definitions are written against, so whoever may
    // list definitions may list them.
    permission: { resource: 'definition:*', action: 'list' },
    relatedRoute: ['/packages'],
  },
  {
    catalog: 'Admin',
    type: MenuTypes.Workspace,
    workspace: 'admin',
    to: '/clusters',
    icon: <AiOutlineCluster />,
    label: 'Clusters',
    name: 'cluster-list',
    permission: { resource: 'cluster:*', action: 'list' },
    relatedRoute: ['/clusters'],
  },
  {
    catalog: 'Admin',
    workspace: 'admin',
    type: MenuTypes.Workspace,
    to: '/configs',
    icon: <MdConfirmationNumber></MdConfirmationNumber>,
    label: 'Global Configs',
    name: 'configs',
    permission: { resource: 'config:*', action: 'list' },
    relatedRoute: ['/configs'],
  },
  {
    catalog: 'Admin',
    workspace: 'admin',
    type: MenuTypes.Workspace,
    to: '/platform/projects',
    icon: <AiFillProject></AiFillProject>,
    label: 'Projects',
    name: 'project-list',
    permission: { resource: 'project:*', action: 'list' },
    relatedRoute: ['/platform/projects$'],
  },
  {
    catalog: 'Admin',
    workspace: 'admin',
    type: MenuTypes.Workspace,
    to: '/users',
    icon: <RiUserSettingsFill></RiUserSettingsFill>,
    label: 'Users',
    name: 'user-list',
    permission: { resource: 'user:*', action: 'list' },
    relatedRoute: ['/users'],
  },
  {
    catalog: 'Admin',
    workspace: 'admin',
    type: MenuTypes.Workspace,
    to: '/roles',
    icon: <BsFileEarmarkPerson></BsFileEarmarkPerson>,
    label: 'Platform Roles',
    name: 'role-list',
    permission: { resource: 'role:*', action: 'list' },
    relatedRoute: ['^/roles$'],
  },
  {
    catalog: 'Admin',
    workspace: 'admin',
    type: MenuTypes.Workspace,
    to: '/settings',
    icon: <AiFillSetting></AiFillSetting>,
    label: 'Settings',
    name: 'settings',
    permission: { resource: 'systemSetting', action: 'update' },
    relatedRoute: ['/settings'],
  },
];

export type LeftMenu = {
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

  loadSidebarMenus(user: LoginUserInfo): LeftMenu[];

  loadProjectMenus(p: Project): Menu[];

  loadApplicationEnvMenus(p: Project, app: ApplicationBase, env: EnvBinding): Menu[];

  loadPluginMenus(): Promise<Menu[]>;

  resetPluginMenus(): void;
}

/** @internal */
export class MenuWrapper implements MenuService {
  private menus: Menu[];
  private workspaces: Workspace[];
  private pluginLoaded: boolean;

  constructor() {
    this.menus = _.cloneDeep(defaultWorkspaceMenus);
    this.workspaces = _.cloneDeep(defaultWorkspaces);
    this.pluginLoaded = false;
  }

  loadPluginMenus = () => {
    if (this.pluginLoaded) {
      return Promise.resolve(this.menus);
    }
    return getPluginSrv()
      .listAppPagePlugins()
      .then((plugins) => {
        plugins.map((plugin) => {
          plugin.includes?.map((include) => {
            if (!this.workspaces.find((w) => w.name === include.workspace.name)) {
              include.workspace.rootRoute = include.to;
              this.workspaces.push(include.workspace);
            }
            if (!this.menus.find((m) => m.name == include.name)) {
              const pluginMenu: Menu = {
                workspace: include.workspace.name,
                type: include.type,
                name: include.name,
                label: include.label,
                to: include.to,
                relatedRoute: include.relatedRoute,
                permission: include.permission,
                catalog: include.catalog,
              };
              this.menus.push(pluginMenu);
            }
          });
        });
        this.pluginLoaded = true;
        return Promise.resolve(this.menus);
      });
  };

  resetPluginMenus = () => {
    this.pluginLoaded = false;
    this.menus = _.cloneDeep(defaultWorkspaceMenus);
    this.workspaces = _.cloneDeep(defaultWorkspaces);
  };
  getWorkspace(name: string): Workspace | undefined {
    return this.workspaces.find((w) => w.name == name);
  }

  // This function should be called after calling the loadPluginMenus function
  loadCurrentWorkspace(): Workspace | undefined {
    let w: Workspace | undefined = undefined;
    this.menus.map((m) => {
      if (!w && this.matchMenu(m)) {
        w = this.getWorkspace(m.workspace);
      }
    });
    return w;
  }

  loadWorkspaces(user?: LoginUserInfo): Workspace[] {
    const availableWorkspaces = this.workspaces.filter((ws) => this.loadMenus(ws, user).length > 0);
    return availableWorkspaces;
  }

  // This function should be called after calling the loadPluginMenus function
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

  // loadSidebarMenus is every workspace's menus as one list of sections, so the
  // sidebar needs no workspace switch. The admin workspace's screens open from
  // the user's menu instead.
  loadSidebarMenus(user: LoginUserInfo): LeftMenu[] {
    const sections: LeftMenu[] = [];
    this.loadWorkspaces(user)
      .filter((ws) => ws.name !== 'admin')
      .forEach((ws) => {
        this.loadMenus(ws, user).forEach((section) => {
          const catalog = section.catalog || ws.label || ws.name;
          const existing = sections.find((s) => s.catalog === catalog);
          if (existing) {
            existing.menus.push(...section.menus);
          } else {
            sections.push({ catalog, menus: [...section.menus] });
          }
        });
      });
    return sections;
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
