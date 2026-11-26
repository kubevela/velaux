import { Checkbox } from '@alifd/next';
import React from 'react';

import { buildPermissionMatrix, summariseRole } from '../../utils/permissionMatrix';
import type { PermissionLike } from '../../utils/permissionMatrix';
import { Chip } from '../ResourceCard';
import { Translation } from '../Translation';
import './index.less';

// halves splits a long matrix into two side-by-side tables so the dialog does not scroll.
const halves = <T,>(rows: T[]): T[][] => {
  if (rows.length <= 10) {
    return rows.length ? [rows] : [];
  }
  const mid = Math.ceil(rows.length / 2);
  return [rows.slice(0, mid), rows.slice(mid)];
};

type PickerProps = {
  permissions: PermissionLike[];
  // value and onChange come from the form field, so value is untyped there.
  value?: unknown;
  onChange?: (value: string[]) => void;
};

// PermissionPicker is a form control choosing a role's permissions: one row per resource, with View and Manage
// columns, and the permissions that fit neither listed under it.
export const PermissionPicker = (props: PickerProps) => {
  const matrix = buildPermissionMatrix(props.permissions);
  const value = Array.isArray(props.value) ? (props.value as string[]) : [];
  const chosen = new Set(value);
  const set = (name: string, on: boolean) => {
    const next = value.filter((v) => v !== name);
    props.onChange?.(on ? [...next, name] : next);
  };
  const box = (p?: PermissionLike) =>
    p ? (
      <Checkbox
        checked={chosen.has(p.name)}
        onChange={(on: boolean) => set(p.name, on)}
        aria-label={p.alias || p.name}
        title={p.alias || p.name}
      />
    ) : null;
  return (
    <div className="role-permissions">
      <div className="role-permissions-head">
        <span>
          <Translation>Permissions</Translation>
        </span>
        <span className="role-permissions-count">
          {chosen.size} / {props.permissions.length}
        </span>
        <a onClick={() => props.onChange?.(props.permissions.map((p) => p.name))}>
          <Translation>Select all</Translation>
        </a>
        <a onClick={() => props.onChange?.([])}>
          <Translation>Clear</Translation>
        </a>
      </div>
      <div className="role-permissions-tables">
        {halves(matrix.rows).map((rows, n) => (
          <table key={n} className="role-permissions-matrix">
            <thead>
              <tr>
                <th />
                <th>
                  <Translation>View</Translation>
                </th>
                <th>
                  <Translation>Manage</Translation>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td>{box(row.view)}</td>
                  <td>{box(row.manage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
      {matrix.others.length > 0 && (
        <div className="role-permissions-others">
          {matrix.others.map((p) => (
            <Checkbox key={p.name} checked={chosen.has(p.name)} onChange={(on: boolean) => set(p.name, on)}>
              {p.alias || p.name}
            </Checkbox>
          ))}
        </div>
      )}
    </div>
  );
};

// RoleAccessChips sums up a role in the list: a chip per resource it reaches, highlighted where it manages it.
export const RoleAccessChips = (props: { granted?: PermissionLike[]; permissions: PermissionLike[] }) => {
  const access = summariseRole(
    (props.granted || []).map((p) => p.name),
    buildPermissionMatrix(props.permissions)
  );
  return (
    <span className="role-access">
      {access.map((a) => (
        <Chip key={a.label} tone={a.manage ? 'accent' : undefined}>
          {a.label}
        </Chip>
      ))}
    </span>
  );
};
