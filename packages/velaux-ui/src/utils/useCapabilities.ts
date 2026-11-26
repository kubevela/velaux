import { useEffect, useState } from 'react';

import type { ControllerCapabilities } from '@velaux/data';

import { loadSystemInfo } from '../api/system_config';
import { allCapabilities, capabilitiesOf } from './capabilities';

let loading: Promise<ControllerCapabilities> | undefined;

// controllerCapabilities reads what the cluster's KubeVela controller can do,
// once per page load.
export function controllerCapabilities(): Promise<ControllerCapabilities> {
  if (!loading) {
    loading = loadSystemInfo()
      .then(capabilitiesOf)
      .catch(() => allCapabilities);
  }
  return loading;
}

// useCapabilities is controllerCapabilities for a component.
export function useCapabilities(): ControllerCapabilities {
  const [caps, setCaps] = useState<ControllerCapabilities>(allCapabilities);
  useEffect(() => {
    let live = true;
    controllerCapabilities().then((c) => live && setCaps(c));
    return () => {
      live = false;
    };
  }, []);
  return caps;
}
