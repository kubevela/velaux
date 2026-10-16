// Where a workflow step's $( ) values sit, as the expression check and its
// completion need it: the step, whether it runs once per item, the loop's items,
// and the workflow's steps with what decides which each can wait for.

import type { ExpressionStep, ExpressionStepOutputs } from '@velaux/data';

type ScopeStep = {
  name: string;
  outputs?: Array<{ name: string }>;
  dependsOn?: string[];
  forEach?: { items?: unknown };
  mode?: string;
  subSteps?: ScopeStep[];
};

// Modes are how the workflow's steps, and its groups' steps, run.
export type Modes = { mode?: string; subMode?: string };

// stepScope is where the step called stepName sits in steps. A step with
// forEach, or a sub-step of a group with one, is a loop body, and reads each
// over that loop's items; a group's own forEach makes only its sub-steps one.
export function stepScope(steps: ScopeStep[], stepName?: string, modes?: Modes): ExpressionStep {
  const scope: ExpressionStep = { step: stepName, steps: declaredSteps(steps), ...modesOf(modes) };
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

// conditionScope is where the if of the step called stepName sits. A top-level
// step's own if is decided once, before any pass of its loop, so it reads no
// each; a looping group's sub-step decides its if per pass, and reads each over
// the group's items.
export function conditionScope(steps: ScopeStep[], stepName?: string, modes?: Modes): ExpressionStep {
  const scope: ExpressionStep = { step: stepName, steps: declaredSteps(steps), condition: true, ...modesOf(modes) };
  steps.forEach((s) => {
    if (s.forEach && (s.subSteps || []).some((sub) => sub.name === stepName)) {
      scope.loopBody = true;
      if (s.forEach.items !== undefined) {
        scope.forEachItems = s.forEach.items;
      }
    }
  });
  return scope;
}

// declaredSteps is the workflow's steps with the outputs each declares, its
// dependsOn, whether it loops, and a group's steps and how they run.
export function declaredSteps(steps: ScopeStep[]): ExpressionStepOutputs[] {
  return steps.map((s) => {
    const out: ExpressionStepOutputs = {
      name: s.name,
      outputs: (s.outputs || []).map((o) => o.name).filter((n) => !!n),
    };
    if (s.dependsOn && s.dependsOn.length) {
      out.dependsOn = s.dependsOn;
    }
    if (s.forEach) {
      out.forEach = true;
    }
    if (s.subSteps && s.subSteps.length) {
      out.subSteps = declaredSteps(s.subSteps);
      if (s.mode) {
        out.mode = s.mode;
      }
    }
    return out;
  });
}

function modesOf(modes?: Modes): Partial<ExpressionStep> {
  const out: Partial<ExpressionStep> = {};
  if (modes?.mode) {
    out.mode = modes.mode;
  }
  if (modes?.subMode) {
    out.subMode = modes.subMode;
  }
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
