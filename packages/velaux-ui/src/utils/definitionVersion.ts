// A type pinned to one version of its definition is written name@version, as
// KubeVela resolves it: webapp@v2, or webapp@v1.2.0 where spec.version names it.

// splitType is a type's definition name and the version it is pinned to, or
// no version for one that follows the latest.
export function splitType(type?: string): { name: string; version?: string } {
  if (!type) {
    return { name: '' };
  }
  const at = type.indexOf('@');
  if (at < 0) {
    return { name: type };
  }
  return { name: type.slice(0, at), version: type.slice(at + 1) || undefined };
}

// joinType is the type for a definition at a version; no version follows the latest.
export function joinType(name: string, version?: string): string {
  return version ? `${name}@${version}` : name;
}

// DefinitionRevision is one revision of a definition, as the server lists it.
export interface DefinitionRevision {
  revision: number;
  version: string;
  hash: string;
  createTime: string;
}

// versionLabel names a revision for a person: a named version with its
// revision number, or the number alone.
export function versionLabel(r: DefinitionRevision): string {
  return r.version === `v${r.revision}` ? r.version : `${r.version.replace(/^v/, '')} (v${r.revision})`;
}

// isNamed is whether a revision has a version name of its own, from the
// definition's spec.version, rather than only its number.
export function isNamed(r: DefinitionRevision): boolean {
  return r.version !== `v${r.revision}`;
}

// latestLabel names following the latest version: the newest revision's
// version name, where it has one, and its number.
export function latestLabel(newest?: DefinitionRevision): string {
  if (!newest) {
    return 'latest';
  }
  const number = `v${newest.revision}`;
  return isNamed(newest) ? `latest (${newest.version.replace(/^v/, '')} / ${number})` : `latest (${number})`;
}

// inUseLabel names the revision a type resolves to: the latest, or the pinned
// version, matched by its name with or without the v, or by its number.
export function inUseLabel(version: string | undefined, revisions: DefinitionRevision[]): string {
  if (!version) {
    return latestLabel(revisions[0]);
  }
  const wanted = version.startsWith('v') ? version : `v${version}`;
  const found = revisions.find((r) => r.version === wanted || `v${r.revision}` === wanted);
  if (!found) {
    return version;
  }
  return isNamed(found) ? `${found.version.replace(/^v/, '')} / v${found.revision}` : `v${found.revision}`;
}
