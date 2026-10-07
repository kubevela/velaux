// Edits to a list of workflow steps, as the studio makes them.

import { orderByDependencies, waitsOn } from '../PipelineGraph/dependencies';

type Step = { name: string; dependsOn?: string[] };

// insertAfter adds step to steps straight after anchor. Unless it is a branch,
// it goes in the middle: the steps that named anchor in their dependsOn name
// the new step instead, so they now wait on it. In parallel the new step waits
// on anchor unless it names its own dependsOn; in order its place in the list
// does that. A step that waits on
// anchor only through its inputs is left alone, as redirecting it would change
// what it reads. With no anchor, the step goes last, waiting on nothing.
export function insertAfter<T extends Step>(
  steps: T[],
  anchor: string | undefined,
  step: T,
  opts: { mode: string; branch: boolean }
): T[] {
  const at = anchor ? steps.findIndex((s) => s.name === anchor) : -1;
  if (at < 0) {
    return [...steps, step];
  }
  const added = opts.mode === 'DAG' && !step.dependsOn ? { ...step, dependsOn: [anchor as string] } : step;
  const rest = steps.map((s) =>
    !opts.branch && s.dependsOn?.includes(anchor as string)
      ? { ...s, dependsOn: s.dependsOn.map((d) => (d === anchor ? step.name : d)) }
      : s
  );
  return [...rest.slice(0, at + 1), added, ...rest.slice(at + 1)];
}

type Waiting = Step & { inputs?: Array<{ from: string }>; outputs?: Array<{ name: string }> };

// addPreview is what adding after anchor would do to the steps that follow it:
// moved are those that would wait on the new step instead, stay those that
// would keep waiting on anchor. A new step or group takes the steps that name
// anchor in dependsOn and, in order, the next in the list; a branch takes none.
// A step that waits only through its inputs always stays.
export function addPreview(
  steps: Waiting[],
  anchor: string,
  key: string,
  mode: string
): { moved: string[]; stay: string[] } {
  const at = steps.findIndex((s) => s.name === anchor);
  const produced = new Set((steps[at]?.outputs || []).map((o) => o.name));
  const named = steps.filter((s) => s.dependsOn?.includes(anchor)).map((s) => s.name);
  const next = mode !== 'DAG' && at >= 0 && at + 1 < steps.length ? [steps[at + 1].name] : [];
  const reads = steps
    .filter((s) => s.name !== anchor && (s.inputs || []).some((i) => produced.has(i.from)))
    .map((s) => s.name);
  const inOrder = (names: string[]) => steps.map((s) => s.name).filter((n) => names.includes(n));
  if (key === 'branch') {
    return { moved: [], stay: inOrder([...named, ...reads, ...next]) };
  }
  const moved = inOrder([...named, ...next]);
  return { moved, stay: inOrder(reads.filter((n) => !moved.includes(n))) };
}

// canDependOn is whether step `to` may be made to wait on step `from`, both in
// steps: not itself, not one it already waits on, and not one that waits on it,
// directly or through others, which would make a loop.
export function canDependOn(steps: Waiting[], from: string, to: string): boolean {
  const names = new Set(steps.map((s) => s.name));
  if (from === to || !names.has(from) || !names.has(to)) {
    return false;
  }
  const waits = waitsOn(steps);
  if (waits.get(to)?.has(from)) {
    return false;
  }
  const seen = new Set<string>();
  const stack = [from];
  while (stack.length) {
    const next = stack.pop() as string;
    if (next === to) {
      return false;
    }
    if (!seen.has(next)) {
      seen.add(next);
      stack.push(...Array.from(waits.get(next) || []));
    }
  }
  return true;
}

// addDependency makes step `to` wait on step `from`.
export function addDependency<T extends Step>(steps: T[], from: string, to: string): T[] {
  return steps.map((s) => (s.name === to ? { ...s, dependsOn: [...(s.dependsOn || []), from] } : s));
}

// removeDependency stops step `to` waiting on step `from`, or is undefined when
// `to` does not name `from` in its dependsOn: a wait through its inputs is
// changed in its inputs, not here.
export function removeDependency<T extends Step>(steps: T[], from: string, to: string): T[] | undefined {
  const step = steps.find((s) => s.name === to);
  if (!step?.dependsOn?.includes(from)) {
    return undefined;
  }
  return steps.map((s) => (s.name === to ? { ...s, dependsOn: (s.dependsOn || []).filter((d) => d !== from) } : s));
}

type StudioView<T> = { steps?: T[]; mode?: string; subMode?: string; readOnly?: boolean };

// studioUpdate is what the studio's steps become as its props change from prev
// to next, or undefined where they stay as they are. New steps are taken as
// given; switching to run in order then orders them (or, with no new steps,
// the current ones) so none waits on a later one, and changed says the
// ordering is the studio's to hand back. Read-only steps belong to a shared
// workflow and are never reordered.
export function studioUpdate<T extends Step & { type?: string; mode?: string; subSteps?: Step[] }>(
  prev: StudioView<T>,
  next: StudioView<T>,
  current: T[]
): { steps: T[]; changed: boolean } | undefined {
  const toOrder = (from?: string, to?: string) => from !== 'StepByStep' && to === 'StepByStep';
  const stepsChanged = prev.steps !== next.steps;
  const ordersTop = !next.readOnly && toOrder(prev.mode, next.mode);
  const ordersGroups = !next.readOnly && toOrder(prev.subMode, next.subMode);
  if (!stepsChanged && !ordersTop && !ordersGroups) {
    return undefined;
  }
  const base = stepsChanged ? next.steps || [] : current;
  let steps = ordersTop ? orderByDependencies(base) : base;
  if (ordersGroups) {
    steps = steps.map((s) =>
      s.type === 'step-group' && !s.mode ? { ...s, subSteps: orderByDependencies(s.subSteps || []) } : s
    );
  }
  return { steps, changed: JSON.stringify(steps) !== JSON.stringify(base) };
}
