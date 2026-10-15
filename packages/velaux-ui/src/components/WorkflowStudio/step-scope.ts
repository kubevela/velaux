// Where a workflow step's $( ) values sit, as the expression check and its
// completion need it: the step, whether it runs once per item, the loop's items,
// and every step's declared outputs.

import type { ExpressionStep } from '@velaux/data';

type ScopeStep = {
  name: string;
  outputs?: Array<{ name: string }>;
  forEach?: { items?: unknown };
  subSteps?: ScopeStep[];
};

// stepScope is where the step called stepName sits in steps. A step with
// forEach, or a sub-step of a group with one, is a loop body, and reads each
// over that loop's items; a group's own forEach makes only its sub-steps one.
export function stepScope(steps: ScopeStep[], stepName?: string): ExpressionStep {
  const scope: ExpressionStep = { step: stepName, steps: declaredOutputs(steps) };
  steps.forEach((s) => {
    const own = s.name === stepName && !(s.subSteps && s.subSteps.length);
    const sub = (s.subSteps || []).some((sub) => sub.name === stepName);
    if (s.forEach && (own || sub)) {
      scope.loopBody = true;
      if (s.forEach.items !== undefined) {
        scope.forEachItems = s.forEach.items;
      }
    }
  });
  return scope;
}

// declaredOutputs is every step and sub-step with the outputs it declares.
function declaredOutputs(steps: ScopeStep[]): Array<{ name: string; outputs: string[] }> {
  const out: Array<{ name: string; outputs: string[] }> = [];
  steps.forEach((s) => {
    out.push({ name: s.name, outputs: (s.outputs || []).map((o) => o.name).filter((n) => !!n) });
    (s.subSteps || []).forEach((sub) => out.push(...declaredOutputs([sub])));
  });
  return out;
}

// scopeParams is a scope as the env endpoint's query takes it: the list and the
// items as JSON, and nothing for a part the scope leaves out.
export function scopeParams(scope?: ExpressionStep): Record<string, string | boolean | undefined> {
  if (!scope) {
    return {};
  }
  return {
    step: scope.step,
    loopBody: scope.loopBody || undefined,
    forEachItems: scope.forEachItems === undefined ? undefined : JSON.stringify(scope.forEachItems),
    steps: scope.steps ? JSON.stringify(scope.steps) : undefined,
  };
}
