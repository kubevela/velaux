import { Addon } from '@velaux/data'
import { getBackendSrv } from "./BackendService";

export interface AddonService {
  listAddons(): Promise<Addon[]>;
}

class AddonWrapper implements AddonService {
  listAddons(): Promise<Addon[]> {
    return getBackendSrv()
      .get('/api/v1/addons')
      .then((res: any) => {
        if (res) {
          const addons = res.addons ? (res.addons as Addon[]) : [];
          return Promise.resolve(addons)
        }
        return Promise.reject(new Error('Unknown Addons'));
      });

  }
}

let addonService: AddonService = new AddonWrapper();

export const getAddonSrv = (): AddonService => addonService;
