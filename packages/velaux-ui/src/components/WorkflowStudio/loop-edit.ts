// Edits to a workflow's loops, as the studio makes them. A loop is a top-level
// step or step group with forEach; the steps it repeats read the current item
// through inputs from each.item and each.index.

type ForEachLike = { items?: unknown; from?: string; key?: string[]; mode?: string };

type LoopStep = { name: string; forEach?: ForEachLike; subSteps?: Array<{ name: string }> };

// defaultMaxItems is the controller's --max-for-each-items unless the cluster
// sets its own.
const defaultMaxItems = 50;

// setLoop makes the step called name repeat over forEach, or, given none, stop
// repeating.
export function setLoop<T extends LoopStep>(steps: T[], name: string, forEach: ForEachLike | undefined): T[] {
  return steps.map((s) => {
    if (s.name !== name) {
      return s;
    }
    const { forEach: _, ...rest } = s;
    return (forEach ? { ...rest, forEach } : rest) as T;
  });
}

// itemColumns are the keys of a list's object items, in the order first seen;
// a list of plain values has none.
export function itemColumns(items: unknown[]): string[] {
  const keys: string[] = [];
  items.forEach((item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.keys(item).forEach((k) => !keys.includes(k) && keys.push(k));
    }
  });
  return keys;
}

// loopInputs are what a step inside a loop may read through its inputs: the
// item, its index, its key (the index as a string when the loop has none), and
// each key of typed-in object items. A step outside any
// loop gets none.
export function loopInputs(steps: LoopStep[], stepName?: string): string[] {
  const loop = steps.find(
    (s) => s.forEach && (s.name === stepName || (s.subSteps || []).some((sub) => sub.name === stepName))
  );
  if (!loop?.forEach) {
    return [];
  }
  const items = Array.isArray(loop.forEach.items) ? loop.forEach.items : [];
  return ['each.item', 'each.index', 'each.key', ...itemColumns(items).map((k) => `each.item.${k}`)];
}

// forEachProblem is what stops a loop's items from being saved: none typed in,
// no output picked, an expression that is not one whole $( ), or a key that does
// not name every typed-in item as the controller requires.
export function forEachProblem(forEach: ForEachLike): string | undefined {
  if ('from' in forEach) {
    return forEach.from ? undefined : 'Pick the output the items come from';
  }
  if (Array.isArray(forEach.items)) {
    if (forEach.items.length === 0) {
      return 'Add at least one item';
    }
    return forEach.key?.length ? keyProblem(forEach.items, forEach.key) : undefined;
  }
  const expression = typeof forEach.items === 'string' ? forEach.items.trim() : '';
  return /^\$\(.*\)$/s.test(expression) ? undefined : 'An expression is written $( ... ), and gives the whole list';
}

// forEachWarning is said of typed-in items over the controller's default limit,
// which a cluster may have raised.
export function forEachWarning(forEach: ForEachLike): string | undefined {
  if (Array.isArray(forEach.items) && forEach.items.length > defaultMaxItems) {
    return `Over ${defaultMaxItems} items, the controller's default limit. The run fails unless the cluster raised it`;
  }
  return undefined;
}

// stepNameKey is what a key may hold, since it becomes part of a step's name.
const stepNameKey = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const maxKeyLength = 63;

// at reads a dotted path into an item, as inputs[].from does.
const at = (item: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>((v, p) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[p] : undefined), item);

// keyProblem checks a key against typed-in items as the controller does: each
// part a string or whole number on every item, the parts joined with - a step
// name of at most 63 characters, and no two items alike.
function keyProblem(items: unknown[], key: string[]): string | undefined {
  const seen = new Map<string, number>();
  for (let i = 0; i < items.length; i++) {
    const parts: string[] = [];
    for (const path of key) {
      const v = at(items[i], path);
      if (v === undefined || v === null) {
        return `Item ${i} has no ${path}`;
      }
      if (!(typeof v === 'string' || (typeof v === 'number' && Number.isInteger(v)))) {
        return `In item ${i}, ${path} must be a string or a whole number`;
      }
      parts.push(String(v));
    }
    const joined = parts.join('-');
    if (joined.length > maxKeyLength) {
      return `In item ${i}, the key is over ${maxKeyLength} characters`;
    }
    if (!stepNameKey.test(joined)) {
      return `In item ${i}, the key ${joined} is not a step name (lower case letters, digits and -)`;
    }
    const first = seen.get(joined);
    if (first !== undefined) {
      return `Items ${first} and ${i} have the same key, ${joined}`;
    }
    seen.set(joined, i);
  }
  return undefined;
}
