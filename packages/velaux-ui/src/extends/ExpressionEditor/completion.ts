// The suggestions a $( ) expression editor offers, worked out from the text
// before the cursor and the variables the server says the expression can read.

export type ExpressionVariable = {
  name: string;
  type: string;
  description?: string;
  // schema is the value's type as its CUE schema declares it.
  schema?: string;
  children?: ExpressionVariable[];
};

export type ExpressionEnv = {
  enabled: boolean;
  optedIn: boolean;
  surface: string;
  variables?: ExpressionVariable[];
};

export type Suggestion = {
  label: string;
  kind: 'field' | 'function' | 'method' | 'snippet';
  detail?: string;
  documentation?: string;
  insertText: string;
  snippet?: boolean;
};

// globals are the functions an expression may call at its top level.
const globals: Suggestion[] = [
  {
    label: 'has',
    kind: 'function',
    detail: 'has(a.b) bool',
    documentation: 'Whether a field is set. Guard a read that may be absent: has(x.y) ? x.y : fallback',
    insertText: 'has(${1})',
    snippet: true,
  },
  {
    label: 'size',
    kind: 'function',
    detail: 'size(x) int',
    documentation: 'The length of a string, list or map',
    insertText: 'size(${1})',
    snippet: true,
  },
  {
    label: 'int',
    kind: 'function',
    detail: 'int(x) int',
    documentation: 'Converts to an int; needed when a value has no known type',
    insertText: 'int(${1})',
    snippet: true,
  },
  { label: 'double', kind: 'function', detail: 'double(x) double', insertText: 'double(${1})', snippet: true },
  { label: 'string', kind: 'function', detail: 'string(x) string', insertText: 'string(${1})', snippet: true },
  { label: 'bool', kind: 'function', detail: 'bool(x) bool', insertText: 'bool(${1})', snippet: true },
];

// methods are what can be called on a value of each type.
const methods: Record<string, Suggestion[]> = {
  string: [
    ['startsWith', "startsWith('prefix') bool"],
    ['endsWith', "endsWith('suffix') bool"],
    ['contains', "contains('text') bool"],
    ['matches', "matches('regex') bool"],
    ['lowerAscii', 'lowerAscii() string'],
    ['upperAscii', 'upperAscii() string'],
    ['trim', 'trim() string'],
    ['replace', "replace('old', 'new') string"],
    ['split', "split(',') list(string)"],
    ['substring', 'substring(start, end) string'],
    ['indexOf', "indexOf('text') int"],
    ['size', 'size() int'],
  ].map(([label, detail]) => ({
    label,
    kind: 'method' as const,
    detail,
    insertText: detail.endsWith('() string') || detail.endsWith('() int') ? `${label}()` : `${label}(\${1})`,
    snippet: true,
  })),
  list: [
    ['size', 'size() int'],
    ['exists', 'exists(x, pred) bool'],
    ['all', 'all(x, pred) bool'],
    ['filter', 'filter(x, pred) list'],
    ['map', 'map(x, expr) list'],
    ['join', "join(',') string"],
  ].map(([label, detail]) => ({
    label,
    kind: 'method' as const,
    detail,
    insertText: label === 'size' ? 'size()' : `${label}(\${1})`,
    snippet: true,
  })),
};

// openExpression reports whether the cursor sits inside a $( ) not yet
// closed, and where that expression starts.
export function openExpression(text: string): number | undefined {
  let depth = 0;
  let start: number | undefined;
  let quote = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (start === undefined) {
      if (c === '$' && text[i + 1] === '(' && text[i - 1] !== '$') {
        start = i + 2;
        depth = 1;
        i++;
      }
      continue;
    }
    if (quote) {
      if (c === quote && text[i - 1] !== '\\') {
        quote = '';
      }
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '(') {
      depth++;
    } else if (c === ')') {
      depth--;
      if (depth === 0) {
        start = undefined;
      }
    }
  }
  return start;
}

function find(vars: ExpressionVariable[] | undefined, path: string[]): ExpressionVariable | undefined {
  let level = vars;
  let found: ExpressionVariable | undefined;
  for (const name of path) {
    found = level?.find((v) => v.name === name);
    if (!found) {
      return undefined;
    }
    level = found.children;
  }
  return found;
}

function fieldSuggestion(v: ExpressionVariable): Suggestion {
  return { label: v.name, kind: 'field', detail: v.type, documentation: v.description, insertText: v.name };
}

// suggest lists what may follow the text before the cursor, and how many
// characters of it the suggestions replace.
export function suggest(before: string, env?: ExpressionEnv): { items: Suggestion[]; replace: number } {
  const start = openExpression(before);
  if (start === undefined) {
    return {
      items: [
        {
          label: '$( )',
          kind: 'snippet',
          detail: 'expression',
          documentation: 'A CEL expression, evaluated when the application renders',
          insertText: '$(${1})',
          snippet: true,
        },
      ],
      replace: 0,
    };
  }
  const expr = before.substring(start);
  const m = /([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*)(\.?)([A-Za-z_]\w*)?$/.exec(expr);
  let path: string[] = [];
  let partial = '';
  if (m) {
    const parts = m[1].split('.');
    if (m[2] === '.') {
      path = parts;
      partial = m[3] || '';
    } else {
      partial = parts.pop() || '';
      path = parts;
    }
  }
  if (path.length === 0) {
    const roots = (env?.variables || []).map(fieldSuggestion);
    return { items: [...roots, ...globals], replace: partial.length };
  }
  const parent = find(env?.variables, path);
  if (!parent) {
    return { items: [], replace: partial.length };
  }
  const fields = (parent.children || []).map(fieldSuggestion);
  const kind = parent.type.startsWith('list') ? 'list' : parent.type;
  return { items: [...fields, ...(methods[kind] || [])], replace: partial.length };
}

// expressionSpans finds each $( ) expression in a value, as [start, end)
// offsets covering the $( and the closing ). An unclosed expression runs to
// the end; $$( is an escaped literal and not one.
export function expressionSpans(text: string): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  let start = -1;
  let depth = 0;
  let quote = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (start < 0) {
      if (c === '$' && text[i + 1] === '$' && text[i + 2] === '(') {
        i += 2;
      } else if (c === '$' && text[i + 1] === '(') {
        start = i;
        depth = 1;
        i++;
      }
      continue;
    }
    if (quote) {
      if (c === quote && text[i - 1] !== '\\') {
        quote = '';
      }
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '(') {
      depth++;
    } else if (c === ')') {
      depth--;
      if (depth === 0) {
        spans.push([start, i + 1]);
        start = -1;
      }
    }
  }
  if (start >= 0) {
    spans.push([start, text.length]);
  }
  return spans;
}

// Hovered is the variable under the cursor: its dotted path and where the
// hovered name sits in the value.
export type Hovered = {
  path: string[];
  variable: ExpressionVariable;
  start: number;
  end: number;
};

const identChar = /[A-Za-z0-9_]/;

// hoverAt finds the variable named at an offset in a value: the name under the
// offset, read with the names before it in a dotted chain, inside a $( ).
export function hoverAt(text: string, offset: number, env?: ExpressionEnv): Hovered | undefined {
  if (!expressionSpans(text).some(([s, e]) => offset >= s + 2 && offset < e)) {
    return undefined;
  }
  let start = offset;
  while (start > 0 && identChar.test(text[start - 1])) {
    start--;
  }
  let end = offset;
  while (end < text.length && identChar.test(text[end])) {
    end++;
  }
  if (start === end) {
    return undefined;
  }
  const path = [text.substring(start, end)];
  let i = start;
  while (text[i - 1] === '.') {
    let j = i - 1;
    while (j > 0 && identChar.test(text[j - 1])) {
      j--;
    }
    if (j === i - 1) {
      break;
    }
    path.unshift(text.substring(j, i - 1));
    i = j;
  }
  const variable = find(env?.variables, path);
  return variable ? { path, variable, start, end } : undefined;
}
