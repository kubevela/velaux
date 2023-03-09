import type { NameAlias } from './env';
export type Target = {
  id?: string;
  name: string;
  alias?: string;
  description?: string;
  clusterAlias?: string;
  cluster?: {
    clusterName?: string;
    namespace?: string;
  };
  variable?: any;
  project?: NameAlias;
};
export interface ProvideList {
  name: string;
  region: string;
  provider: string;
  createTime: string;
}
