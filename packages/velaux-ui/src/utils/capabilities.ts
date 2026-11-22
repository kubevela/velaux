import type { ControllerCapabilities } from '@velaux/data';

// allCapabilities is what a controller is assumed to have until it is known,
// and when it cannot be read.
export const allCapabilities: ControllerCapabilities = { reconcileInterval: true, workflowRestart: true };

// capabilitiesOf is the capabilities a system_info response reports, or all of
// them from a server that reports none.
export function capabilitiesOf(info?: { capabilities?: ControllerCapabilities }): ControllerCapabilities {
  return info?.capabilities || allCapabilities;
}
