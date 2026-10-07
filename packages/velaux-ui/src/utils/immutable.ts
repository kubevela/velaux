import type { UIParam } from '@velaux/data';

// immutableLocked reports whether a parameter is locked in the form: KubeVela
// refuses to change an immutable parameter once a value for it has been
// deployed, and allows it before then.
export function immutableLocked(
  param: UIParam,
  mode: 'new' | 'edit',
  deployed: boolean | undefined,
  stored: any
): boolean {
  if (!param.validate?.immutable || mode != 'edit' || deployed === false) {
    return false;
  }
  const value = stored && stored[param.jsonKey];
  return value !== undefined && value !== null && value !== '';
}
