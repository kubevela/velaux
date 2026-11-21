import type { Customisation } from '../services/CustomisationService';
import { customisationService } from '../services/CustomisationService';

import { get, put } from './request';

export function getCustomisation(): Promise<Customisation> {
  return get('/api/v1/customisation', { customError: true });
}

export function updateCustomisation(c: Customisation): Promise<Customisation> {
  return put('/api/v1/customisation', c);
}

let loading: Promise<Customisation> | undefined;

// loadCustomisation reads the customisation into customisationService once;
// later calls share the first read.
export function loadCustomisation(): Promise<Customisation> {
  if (!loading) {
    loading = getCustomisation()
      .then((c) => {
        customisationService.set(c || {});
        return customisationService.get();
      })
      .catch(() => customisationService.get());
  }
  return loading;
}
