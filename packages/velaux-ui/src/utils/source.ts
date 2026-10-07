// sourceNamePattern is a CEL identifier: a source is read as $(source.<name>),
// where cluster-info would parse as a subtraction.
export const sourceNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// sourceBindingName suggests a binding for a source of the given type:
// cluster-info becomes clusterInfo.
export function sourceBindingName(type: string): string {
  const name = type
    .replace(/[^a-zA-Z0-9]+([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
  return /^[0-9]/.test(name) ? `source${name}` : name;
}

// SourceField is a path an application reads from a source, such as
// source.db.endpoint.host, with the type its schema declares.
export type SourceField = {
  path: string;
  type: string;
  description?: string;
};

// sourceFields lists the paths $(source.<name>...) can read, from the OpenAPI
// schema of the source definition's schema block.
export function sourceFields(name: string, schema: any, depth = 3): SourceField[] {
  const fields: SourceField[] = [];
  const walk = (s: any, path: string, level: number) => {
    if (!s || !s.properties || level > depth) {
      return;
    }
    for (const [key, child] of Object.entries<any>(s.properties)) {
      const childPath = `${path}.${key}`;
      fields.push({ path: childPath, type: typeName(child), description: child.description });
      walk(child, childPath, level + 1);
    }
  };
  walk(schema, `source.${name}`, 1);
  return fields;
}

function typeName(s: any): string {
  if (s.type === 'array') {
    return `array<${s.items ? typeName(s.items) : 'any'}>`;
  }
  if (s.type === 'object' && !s.properties && s.additionalProperties) {
    return `map<${typeof s.additionalProperties === 'object' ? typeName(s.additionalProperties) : 'any'}>`;
  }
  return s.type || 'any';
}
