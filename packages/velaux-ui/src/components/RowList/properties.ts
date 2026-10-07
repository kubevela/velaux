// PropertyRow is one property as the expanded row lists it.
export interface PropertyRow {
  key: string;
  value: string;
}

const maxListedItems = 5;

// flattenProperties lists a component's properties by dotted path, values
// written as they would be read. A list of scalars stays one value; a list of
// objects is listed by index up to maxListedItems, and past that summarised by
// its length.
export function flattenProperties(properties: unknown, prefix = ''): PropertyRow[] {
  if (properties === null || properties === undefined) {
    return [];
  }
  if (typeof properties !== 'object') {
    return [{ key: prefix, value: String(properties) }];
  }
  if (Array.isArray(properties)) {
    if (properties.every((v) => v === null || typeof v !== 'object')) {
      return [{ key: prefix, value: properties.join(', ') }];
    }
    if (properties.length <= maxListedItems) {
      return properties.flatMap((item, i) => flattenProperties(item, `${prefix}[${i}]`));
    }
    return [{ key: prefix, value: `${properties.length} items` }];
  }
  const rows: PropertyRow[] = [];
  Object.keys(properties as Record<string, unknown>).forEach((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    rows.push(...flattenProperties((properties as Record<string, unknown>)[key], path));
  });
  return rows;
}
