import { ResourceAction } from 'src/utils/permission';

export type LayoutMode = 'default' | 'neat' | 'neat2';

export type Workspace = {
  name: string;
  icon?: string | React.ReactNode;
  label: string;
  rootRoute: string;
};

type Route = RegExp | string;

export type Menu = {
  workspace: string;
  type: 'Workspace' | 'ApplicationEnv' | 'Project';
  catalog?: string;
  name: string;
  label: string;
  to: string;
  relatedRoute: Route[];
  icon?: string | React.ReactNode;
  permission?: ResourceAction;
  active?: boolean;
};
