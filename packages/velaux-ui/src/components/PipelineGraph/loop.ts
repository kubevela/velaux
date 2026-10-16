// A loop is a step, or a step group, with forEach: the engine runs its body once
// per item, as passes named <loop>-<label> for a single step and
// <loop>-<label>-<sub> for a group's sub-steps. An item's label is its key, for a
// loop with forEach.key, else its index.

import type { Tone } from '../StatusBadge';
import { stepStatus } from './status';

type ForEachLike = { items?: unknown; from?: string };

type BodyStep = { name: string; type: string; alias?: string; dependsOn?: string[] | null };

type LoopSpec = BodyStep & { forEach?: ForEachLike; subSteps?: BodyStep[] };

type Pass = {
  id?: string;
  name: string;
  alias?: string;
  type?: string;
  phase?: string;
  message?: string;
  reason?: string;
  firstExecuteTime?: string;
  lastExecuteTime?: string;
  iteration?: number;
};

type LoopRun = Pass & { loop?: { mode: string; items?: unknown[]; labels?: string[] }; subSteps?: Pass[] };

// Lane is one item's passes. label is how the item shows; key is what its passes
// are named by: the loop's key for the item, else its index.
export type Lane<P extends Pass = Pass> = { index: number; label: string; key: string; item?: unknown; passes: P[] };

// itemLabel names an item: an object by its string name, a string, number or
// boolean by itself, anything else by its place in the list.
export function itemLabel(item: unknown, index: number): string {
  if (item && typeof item === 'object' && typeof (item as { name?: unknown }).name === 'string') {
    return (item as { name: string }).name;
  }
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    return String(item);
  }
  return `#${index}`;
}

// body is what a loop repeats: a group's sub-steps, or the step itself.
function body(spec: LoopSpec): BodyStep[] {
  return spec.type === 'step-group' ? spec.subSteps || [] : [spec];
}

function passName(loop: string, label: string, sub: string, group: boolean): string {
  return group ? `${loop}-${label}-${sub}` : `${loop}-${label}`;
}

// laneSpec is a group body as one lane's passes: names and dependsOn on body
// steps carry the lane's label, so a lane's edges are drawn between its passes.
export function laneSpec<T extends BodyStep>(loop: string, label: string, steps: T[]): T[] {
  const names = new Set(steps.map((s) => s.name));
  const scoped = (name: string) => (names.has(name) ? passName(loop, label, name, true) : name);
  return steps.map((s) => {
    const out = { ...s, name: scoped(s.name) };
    if (s.dependsOn) {
      out.dependsOn = s.dependsOn.map(scoped);
    }
    return out;
  });
}

// loopLanes splits a loop's passes into one lane per item, by the item each pass
// ran for. The items are the ones the loop resolved, and a keyed loop's lanes
// are labelled by its keys; a lane the loop has not reached is drawn from the
// body, not started. Before the items resolve, only lanes with passes show.
export function loopLanes<P extends Pass>(run: LoopRun & { subSteps?: P[] }, spec?: LoopSpec): Array<Lane<P>> {
  const items = run.loop?.items || [];
  const labels = run.loop?.labels;
  const passes: P[] = run.subSteps || [];
  const reached = passes.reduce((n, p) => (p.iteration !== undefined ? Math.max(n, p.iteration + 1) : n), 0);
  const count = Math.max(items.length, reached);
  const template = spec ? body(spec) : [];
  const group = spec?.type === 'step-group' || run.type === 'step-group';
  const lanes: Array<Lane<P>> = [];
  for (let index = 0; index < count; index++) {
    const label = labels?.[index] ?? String(index);
    // A pass with no alias of its own is titled after the body step it repeats.
    const titled = (p: P): P => {
      if (p.alias) {
        return p;
      }
      const t = template.find((b) => passName(run.name, label, b.name, group) === p.name);
      return t ? { ...p, alias: t.alias || t.name } : p;
    };
    let own = passes.filter((p) => p.iteration === index).map(titled);
    if (own.length === 0) {
      own = template.map(
        (t) => ({ name: passName(run.name, label, t.name, group), alias: t.alias || t.name, type: t.type } as P)
      );
    }
    lanes.push({
      index,
      label: labels?.[index] ?? itemLabel(items[index], index),
      key: label,
      item: items[index],
      passes: own,
    });
  }
  return lanes;
}

// laneStatus is a lane's tone: failed if a pass failed, progressing while one
// runs or waits, healthy once every pass succeeded, else not started.
function laneStatus(lane: Lane): { tone: Tone; done: boolean } {
  const tones = lane.passes.map((p) => stepStatus(p).tone);
  if (tones.includes('failed')) {
    return { tone: 'failed', done: false };
  }
  if (tones.includes('progressing')) {
    return { tone: 'progressing', done: false };
  }
  const done = lane.passes.length > 0 && lane.passes.every((p) => p.phase === 'succeeded');
  return { tone: done ? 'healthy' : 'neutral', done };
}

// loopProgress is a closed loop's summary: one segment per item, and how many
// of the items are done.
export function loopProgress(lanes: Lane[]): {
  segments: Array<{ label: string; tone: Tone }>;
  done: number;
  total: number;
} {
  const statuses = lanes.map(laneStatus);
  return {
    segments: lanes.map((l, i) => ({ label: l.label, tone: statuses[i].tone })),
    done: statuses.filter((s) => s.done).length,
    total: lanes.length,
  };
}

const shownChips = 4;

// describeItems is where a loop's items come from, as chips for its card: the
// first few typed-in items, the variable they are read from, or the expression
// that gives them.
export function describeItems(forEach: ForEachLike): {
  source: 'list' | 'from' | 'expression';
  chips: string[];
  more: number;
  count?: number;
} {
  if (forEach.from) {
    return { source: 'from', chips: [forEach.from], more: 0 };
  }
  if (Array.isArray(forEach.items)) {
    const labels = forEach.items.map(itemLabel);
    return {
      source: 'list',
      chips: labels.slice(0, shownChips),
      more: Math.max(0, labels.length - shownChips),
      count: labels.length,
    };
  }
  return { source: 'expression', chips: [String(forEach.items ?? '')], more: 0 };
}

type RunLoop = { mode: string; items?: unknown[]; labels?: string[]; iterations?: Record<string, number> };

// withLoops gives a pipeline run's steps the loops the run reports beside them:
// a loop step its items and mode, and each of its passes the item it ran for.
export function withLoops<S extends LoopRun>(steps: S[], loops?: Record<string, RunLoop>): S[] {
  if (!loops) {
    return steps;
  }
  return steps.map((s) => {
    const loop = loops[s.name];
    if (!loop) {
      return s;
    }
    const { iterations = {}, ...status } = loop;
    return {
      ...s,
      loop: status,
      subSteps: (s.subSteps || []).map((p) => (p.name in iterations ? { ...p, iteration: iterations[p.name] } : p)),
    };
  });
}
