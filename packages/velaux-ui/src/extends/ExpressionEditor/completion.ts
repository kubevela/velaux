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
  // replaceBefore is how many characters before the typed part the suggestion
  // also replaces: the dot, for a name inserted by index.
  replaceBefore?: number;
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

// placements are the calls that read a component at a named placement, straight
// after its name: cluster("c"), namespace("ns"), or cluster("c").namespace("ns").
const placements: Record<string, Suggestion> = {
  cluster: {
    label: 'cluster',
    kind: 'method',
    detail: 'cluster("name")',
    documentation: 'Reads the component in that cluster instead of beside the reader',
    insertText: 'cluster("${1}")',
    snippet: true,
  },
  namespace: {
    label: 'namespace',
    kind: 'method',
    detail: 'namespace("name")',
    documentation: "Reads the component in that namespace, in the reader's cluster unless cluster() precedes it",
    insertText: 'namespace("${1}")',
    snippet: true,
  },
};

// placementsAfter is what placement calls may follow a component read that has
// made the given calls: cluster before namespace, each once.
function placementsAfter(calls: string[]): Suggestion[] {
  if (calls.includes('namespace')) {
    return [];
  }
  return calls.includes('cluster') ? [placements.namespace] : [placements.cluster, placements.namespace];
}

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

const identifier = /^[A-Za-z_]\w*$/;

// fieldSuggestion offers a field by name, or by index where the name is not an
// identifier: a component named my-db is read as component["my-db"], since CEL
// reads component.my-db as subtraction.
function fieldSuggestion(v: ExpressionVariable): Suggestion {
  const s: Suggestion = {
    label: v.name,
    kind: 'field',
    detail: v.type,
    documentation: v.description,
    insertText: v.name,
  };
  if (!identifier.test(v.name)) {
    s.insertText = `["${v.name}"]`;
    s.replaceBefore = 1;
  }
  return s;
}

// chainTokens reads a chain of names into its names and the placement calls in
// it: a.b, a["b"] and a.b.cluster("c") each read a then b.
const chainToken = /\.(cluster|namespace)\([^)]*\)|\["([^"]*)"\]|\.?([A-Za-z_]\w*)/g;

function chainTokens(chain: string): { names: string[]; calls: string[]; endsWithIndex: boolean } {
  const names: string[] = [];
  const calls: string[] = [];
  let endsWithIndex = false;
  for (const m of chain.matchAll(chainToken)) {
    if (m[1]) {
      calls.push(m[1]);
      endsWithIndex = false;
    } else {
      names.push(m[2] !== undefined ? m[2] : m[3]);
      endsWithIndex = m[2] !== undefined;
    }
  }
  return { names, calls, endsWithIndex };
}

// suggest lists what may follow the text before the cursor, and how many
// characters of it the suggestions replace.
export function suggest(before: string, env?: ExpressionEnv): { items: Suggestion[]; replace: number } {
  const start = openExpression(before);
  if (start === undefined) {
    // Outside an expression, a typed $ is the only cue to start one, and the
    // snippet takes its place; $$ is an escaped literal and starts nothing.
    if (!before.endsWith('$') || before.endsWith('$$')) {
      return { items: [], replace: 0 };
    }
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
      replace: 1,
    };
  }
  const expr = before.substring(start);
  const m = /([A-Za-z_]\w*(?:\.[A-Za-z_]\w*|\["[^"]*"\]|\.(?:cluster|namespace)\([^)]*\))*)(\.?)([A-Za-z_]\w*)?$/.exec(
    expr
  );
  let path: string[] = [];
  let partial = '';
  let calls: string[] = [];
  if (m) {
    const tokens = chainTokens(m[1]);
    calls = tokens.calls;
    if (m[2] !== '.' && !m[3] && tokens.endsWithIndex) {
      return { items: [], replace: 0 };
    }
    const parts = tokens.names;
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
  if (path.length === 2 && path[0] === 'component') {
    return { items: [...fields, ...placementsAfter(calls)], replace: partial.length };
  }
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
  for (;;) {
    if (text[i - 1] === ']') {
      const index = /\["([^"]*)"\]$/.exec(text.substring(0, i));
      if (!index) {
        break;
      }
      path.unshift(index[1]);
      i = index.index;
      let j = i;
      while (j > 0 && identChar.test(text[j - 1])) {
        j--;
      }
      if (j < i) {
        path.unshift(text.substring(j, i));
        i = j;
      }
      continue;
    }
    if (text[i - 1] !== '.') {
      break;
    }
    const call = /\.(cluster|namespace)\([^)]*\)$/.exec(text.substring(0, i - 1));
    if (call) {
      i = call.index + 1;
      continue;
    }
    if (text[i - 2] === ']') {
      i -= 1;
      continue;
    }
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

// ExpressionFix is a replacement the check offers for an issue: the text from
// start to end becomes text.
export type ExpressionFix = {
  start: number;
  end: number;
  text: string;
  message: string;
};

// fixesFor finds the fixes for the markers Monaco asks about, by where each
// starts (Monaco's columns count from 1) and what it says.
export function fixesFor(
  markers: Array<{ startColumn: number; message: string }>,
  fixes: ExpressionFix[]
): ExpressionFix[] {
  return markers.flatMap((m) => fixes.filter((f) => f.start + 1 === m.startColumn && f.message === m.message));
}

// ExpressionIssue is a problem the server found in an expression.
export type ExpressionIssue = { message: string; start: number; end: number; warning?: boolean; fix?: string };

// hasExpression is whether a property value holds a $( ) expression to check.
export function hasExpression(value: unknown): boolean {
  return typeof value === 'string' && value.includes('$(');
}

// blockingIssue is the problem that keeps a value from being saved: the first
// error. Warnings are shown but do not block.
export function blockingIssue(issues?: ExpressionIssue[]): ExpressionIssue | undefined {
  return (issues || []).find((i) => !i.warning);
}
