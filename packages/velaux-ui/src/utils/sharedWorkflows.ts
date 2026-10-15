import type { SharedWorkflow } from '@velaux/data';

// usableShared is whether a workflow of an environment can run the shared one:
// not a global one hidden by the project's of its name, nor the project's where
// the environment's Applications run outside the project's namespace.
export const usableShared = (s: SharedWorkflow, projectUnavailable?: boolean) =>
  !s.hidden && !(projectUnavailable && s.scope === 'project');

export type SharedWhere = 'all' | 'project' | 'global';
export type SharedUsage = 'all' | 'used' | 'unused';

// inUse is whether any workflow, in this project or another, runs it.
export const inUse = (s: SharedWorkflow) => (s.usedBy?.length || 0) + (s.usedElsewhere || 0) > 0;

// filterShared is the shared workflows the list shows: those matching query by
// name, alias or description, where they are, and whether they are in use.
export function filterShared(shared: SharedWorkflow[], query: string, where: SharedWhere, usage: SharedUsage) {
  const q = query.trim().toLowerCase();
  return shared.filter(
    (s) =>
      (where === 'all' || s.scope === where) &&
      (usage === 'all' || inUse(s) === (usage === 'used')) &&
      (!q || [s.name, s.alias, s.description].some((text) => text?.toLowerCase().includes(q)))
  );
}
