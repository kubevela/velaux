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
};
