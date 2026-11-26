// PermissionLike is the part of a permission the role pages show: its name and alias.
export type PermissionLike = { name: string; alias?: string };

// PermissionRow is one resource in the matrix, with the permission that views it and the one that manages it.
export type PermissionRow = { key: string; label: string; view?: PermissionLike; manage?: PermissionLike };

// PermissionMatrix is the permissions as resource rows, plus the ones that are neither a view nor a management.
export type PermissionMatrix = { rows: PermissionRow[]; others: PermissionLike[] };

const kinds: Array<{ kind: 'view' | 'manage'; suffix: string }> = [
  { kind: 'view', suffix: '-view' },
  { kind: 'view', suffix: '-list' },
  { kind: 'manage', suffix: '-management' },
];

// buildPermissionMatrix pairs each `<resource>-view` (or `-list`) with its `<resource>-management`, in the order
// first seen.
export function buildPermissionMatrix(permissions: PermissionLike[]): PermissionMatrix {
  const rows: PermissionRow[] = [];
  const byKey: Record<string, PermissionRow> = {};
  const others: PermissionLike[] = [];
  permissions.forEach((p) => {
    const match = kinds.find((k) => p.name.endsWith(k.suffix));
    if (!match) {
      others.push(p);
      return;
    }
    const key = p.name.slice(0, -match.suffix.length);
    let row = byKey[key];
    if (!row) {
      row = { key, label: '' };
      byKey[key] = row;
      rows.push(row);
    }
    row[match.kind] = p;
  });
  rows.forEach((row) => {
    // The view's alias names the resource most plainly ("Role View", not "Platform Role Management").
    const source = row.view || row.manage;
    const alias = source?.alias?.replace(/\s+(View|List|Management)$/i, '');
    row.label = alias && alias !== source?.alias ? alias : row.key;
  });
  return { rows, others };
}

// RoleAccess is one chip in a role's summary: a resource, and whether the role manages it or only views it.
export type RoleAccess = { label: string; manage: boolean };

// summariseRole turns a role's permission names into one entry per resource, the others last.
export function summariseRole(granted: string[], matrix: PermissionMatrix): RoleAccess[] {
  const has = new Set(granted);
  const known = new Set<string>();
  const out: RoleAccess[] = [];
  matrix.rows.forEach((row) => {
    const view = !!row.view && has.has(row.view.name);
    const manage = !!row.manage && has.has(row.manage.name);
    [row.view, row.manage].forEach((p) => p && known.add(p.name));
    if (view || manage) {
      out.push({ label: row.label, manage });
    }
  });
  matrix.others.forEach((p) => {
    known.add(p.name);
    if (has.has(p.name)) {
      out.push({ label: p.alias || p.name, manage: false });
    }
  });
  granted.filter((name) => !known.has(name)).forEach((name) => out.push({ label: name, manage: false }));
  return out;
}
