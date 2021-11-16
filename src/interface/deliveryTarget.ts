export type DeliveryTarget = {
  id?: string;
  name: string;
  alias?: string;
  namespace?: string;
  description?: string;
  cluster?: {
    clusterName?: string;
    namespace?: string;
  };
  variable?: any;
};
