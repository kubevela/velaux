export type DeliveryTarget = {
  id?: string;
  name?: string;
  alias?: string;
  namespace?: string;
  description?: string;
  kubernetes?: {
    clusterName?: string;
    namespace?: string;
  };
  cloud?: {
    providerName?: string;
    region?: string;
    zone?: string;
    vpcID?: string;
  };
};
