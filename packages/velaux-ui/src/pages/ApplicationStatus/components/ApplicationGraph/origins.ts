import type { AppliedResource, ApplicationComponent, ComponentStatus } from '@velaux/data';

import type { ResourceOrigin } from '../../../../components/TreeGraph/interface';

// auxiliary is the trait KubeVela records for a resource a component's own
// template outputs, beside its workload: the component's, not a trait's.
const auxiliary = 'AuxiliaryWorkload';

// resourceOrigin is the component that applied a resource, with its type, and
// the trait that did where a trait did, each with the health its status
// reports on the resource's cluster; none where no component is recorded.
export function resourceOrigin(
  res: AppliedResource,
  components: ApplicationComponent[] = [],
  services: ComponentStatus[] = []
): ResourceOrigin | undefined {
  if (!res.component) {
    return undefined;
  }
  const type = components.find((c) => c.name === res.component)?.componentType;
  const trait = res.trait && res.trait !== auxiliary ? res.trait : undefined;
  const cluster = res.cluster || 'local';
  const service = services.find((s) => s.name === res.component && (s.cluster || 'local') === cluster);
  const traitStatus = trait ? service?.traits?.find((t) => t.type === trait) : undefined;
  return {
    component: res.component,
    ...(type ? { type } : {}),
    ...(trait ? { trait } : {}),
    ...(service ? { healthy: service.healthy, message: service.message || undefined } : {}),
    ...(traitStatus
      ? {
          traitHealthy: traitStatus.healthy,
          traitPending: traitStatus.pending,
          traitMessage: traitStatus.message || undefined,
        }
      : {}),
  };
}
