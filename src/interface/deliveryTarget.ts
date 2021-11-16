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

export interface QueryDeliveryTarget {
  query?: string;
  page?: number;
  pageSize?: number;
}

export interface DeliveryTargetState {
  deliveryTagetList: [];
  deliveryTagetListTotal: number;
}

export interface ModelsType {
  namespace: string;
  state: DeliveryTargetState;
  effects: {};
  reducers: {};
}

export interface ResponseGenerator {
  config?: any;
  data?: any;
  headers?: any;
  request?: any;
  status?: number;
  error?: any;
  statusText?: string;
  records?: any;
  pageNum?: any;
  deliveryTagetList?: any;
  deliveryTagetListTotal?: any;
}
