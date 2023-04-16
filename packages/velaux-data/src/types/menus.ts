import { ResourceAction } from './permission';

export interface Workspace {
  name: string;
  icon?: string | React.ReactNode;
  label?: string;
  rootRoute: string;
}

type Route = RegExp | string;

export enum MenuTypes {
  Workspace = 'Workspace',
  ApplicationEnv = 'ApplicationEnv',
  Project = 'Project',
}

export type MenuType = MenuTypes.Workspace | MenuTypes.ApplicationEnv | MenuTypes.Project;

export interface Menu {
  workspace: string;
  type: MenuType;
  catalog?: string;
  name: string;
  label: string;
  to: string;
  href?: string;
  relatedRoute: Route[];
  icon?: string | React.ReactNode;
  permission?: ResourceAction;
  active?: boolean;
}
