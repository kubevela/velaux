import type { AppliedApplicationPolicy, ApplicationEnvStatus, ApplicationPolicyBase } from '@velaux/data';

export type PolicyState = 'applied' | 'skipped' | 'error';

// policyState is how an application policy fared on the last render: applied,
// skipped because it rendered enabled=false, or failed. A failure wins.
export function policyState(policy: AppliedApplicationPolicy): PolicyState {
  if (policy.error) {
    return 'error';
  }
  return policy.applied ? 'applied' : 'skipped';
}

// policyStateCircle is the status dot for a policy state.
export const policyStateCircle: Record<PolicyState, string> = {
  applied: 'circle-success',
  skipped: 'circle-skipped',
  error: 'circle-failure',
};

// policyStateLabel words a policy state.
export const policyStateLabel: Record<PolicyState, string> = {
  applied: 'Applied',
  skipped: 'Skipped',
  error: 'Failed',
};

// PolicyRow is one row of an application's policy list: a policy it owns, or a
// global policy one of its environments received.
export interface PolicyRow {
  name: string;
  type?: string;
  envName?: string;
  global: boolean;
  // policy is the application's own policy; global rows have none.
  policy?: ApplicationPolicyBase;
  // applied is how the policy fared, where KubeVela reports it: only for
  // policies of Application scope.
  applied?: AppliedApplicationPolicy;
}

// policyRows lists an application's own policies, each with how it fared, then
// the global policies each environment received. A global policy is never named
// by the application, so it appears only in the status.
export function policyRows(policies?: ApplicationPolicyBase[], statuses?: ApplicationEnvStatus[]): PolicyRow[] {
  const envs = statuses || [];
  const explicit = (policy: ApplicationPolicyBase) =>
    envs
      .filter((env) => !policy.envName || env.envName === policy.envName)
      .flatMap((env) => env.status?.appliedApplicationPolicies || [])
      .find((applied) => applied.source !== 'global' && applied.name === policy.name);
  const own = (policies || []).map((policy) => ({
    name: policy.name,
    type: policy.type,
    envName: policy.envName,
    global: false,
    policy,
    applied: explicit(policy),
  }));
  const global = envs.flatMap((env) =>
    (env.status?.appliedApplicationPolicies || [])
      .filter((applied) => applied.source === 'global')
      .map((applied) => ({ name: applied.name, type: applied.type, envName: env.envName, global: true, applied }))
  );
  return [...own, ...global];
}
