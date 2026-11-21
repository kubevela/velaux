import React from 'react';

import type { PackageField } from '@velaux/data';
import { Translation } from '../../components/Translation';

// FieldTree lists fields with their types as declared and their descriptions,
// a nested struct's fields indented beneath it. A type written as a whole, such
// as [...#Table], shows as written, with the fields it stands for beneath.
export const FieldTree = (props: { fields?: PackageField[]; type?: string; empty: string }) => {
  if (props.type && (!props.fields || props.fields.length === 0)) {
    return <code className="package-type">{props.type}</code>;
  }
  if (!props.fields || props.fields.length === 0) {
    return (
      <span className="row-list-muted">
        <Translation>{props.empty}</Translation>
      </span>
    );
  }
  const rows: React.ReactNode[] = [];
  const walk = (fields: PackageField[], depth: number, prefix: string) => {
    fields.forEach((f) => {
      const key = `${prefix}${f.name}`;
      rows.push(
        <tr key={key}>
          <td style={{ paddingLeft: depth * 16 }}>
            <code>
              {f.name}
              {f.optional ? '?' : ''}
            </code>
          </td>
          <td>{f.type ? <code className="package-type">{f.type}</code> : f.fields ? <code>{'{...}'}</code> : null}</td>
          <td>{f.description}</td>
        </tr>
      );
      if (f.fields) {
        walk(f.fields, depth + 1, `${key}.`);
      }
    });
  };
  walk(props.fields, 0, '');
  return (
    <div>
      {props.type && <code className="package-type package-type-whole">{props.type}</code>}
      <table className="package-fields">
        <thead>
          <tr>
            <th>
              <Translation>Field</Translation>
            </th>
            <th>
              <Translation>Type</Translation>
            </th>
            <th>
              <Translation>Description</Translation>
            </th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
};
