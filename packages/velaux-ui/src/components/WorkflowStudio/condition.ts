// How the studio edits a step's if. One that is exactly one $( ) expression is
// a CEL condition, which must give a bool; any other if is CUE, as it always was,
// a "$(" inside a CUE string included.

import { expressionSpans } from '../../extends/ExpressionEditor/completion';

export type ConditionMode = 'cue' | 'expression';

// isCondition reports whether an if is a $( ) condition: one expression, the
// whole of the value once trimmed.
export function isCondition(value?: string): boolean {
  const text = (value || '').trim();
  // An unclosed expression runs to the end of the text, whatever follows it, so
  // a closed one is told apart by ending in the same place with a space added.
  const spans = expressionSpans(`${text} `);
  return spans.length === 1 && spans[0][0] === 0 && spans[0][1] === text.length;
}

// conditionMode is the editor an if opens in.
export function conditionMode(value?: string): ConditionMode {
  return isCondition(value) ? 'expression' : 'cue';
}

// switchCondition is the if as the other editor starts it: an empty if starts an
// expression as $( ), and leaving an expression that is still empty clears it.
// Anything else is kept as written, for the editor to judge.
export function switchCondition(value: string | undefined, to: ConditionMode): string {
  const text = (value || '').trim();
  if (to === 'expression' && text === '') {
    return '$()';
  }
  if (to === 'cue' && text === '$()') {
    return '';
  }
  return value || '';
}
