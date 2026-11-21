import type { PackageBase } from '@velaux/data';

// PackageSource is where a package comes from: a Package resource in the
// cluster, or KubeVela itself.
export type PackageSource = 'all' | 'cluster' | 'builtin';

// packageLink is the page of a package: a resource by its namespace and name, a
// built-in by its path and what imports it, since two can share a path.
export function packageLink(pkg: Pick<PackageBase, 'name' | 'namespace' | 'path' | 'builtin' | 'variant'>): string {
  if (pkg.builtin) {
    return `/packages/builtin?path=${encodeURIComponent(pkg.path)}&variant=${encodeURIComponent(pkg.variant || '')}`;
  }
  return `/packages/${pkg.namespace}/${pkg.name}`;
}

// filterPackages keeps the packages from a source whose name or path contains
// the query, ignoring case.
export function filterPackages<T extends Pick<PackageBase, 'name' | 'path' | 'builtin'>>(
  pkgs: T[],
  query: string,
  source: PackageSource
): T[] {
  const q = query.trim().toLowerCase();
  return pkgs.filter(
    (p) =>
      (source === 'all' || (source === 'builtin') === !!p.builtin) &&
      (!q || p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q))
  );
}
