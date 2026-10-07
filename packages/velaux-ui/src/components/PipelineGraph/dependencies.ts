// What a run's steps wait on, as edges between their names.

export type SpecStep = {
  name: string;
  dependsOn?: string[] | null;
  inputs?: Array<{ from: string }> | null;
  outputs?: Array<{ name: string }> | null;
};

export type StepEdge = { from: string; to: string };

// runMode is the mode a run's top-level steps ran in: the first half of a run's
// "<steps>-<subSteps>" mode, else the workflow's, else KubeVela's StepByStep.
export function runMode(recordMode?: string, workflowMode?: string): 'StepByStep' | 'DAG' {
  const mode = recordMode?.split('-')[0] || workflowMode;
  return mode === 'DAG' ? 'DAG' : 'StepByStep';
}

// stepEdges joins each step to the steps it waits on: the one before it in
// StepByStep mode, those it names in dependsOn, and those whose outputs feed
// its inputs. An edge a longer path already implies is left out.
export function stepEdges(steps: Array<{ name: string }>, spec: SpecStep[] | undefined, mode: string): StepEdge[] {
  const names = steps.map((s) => s.name);
  const known = new Set(names);
  const specOf = new Map((spec || []).map((s) => [s.name, s]));
  const producer = new Map<string, string>();
  (spec || []).forEach((s) => (s.outputs || []).forEach((o) => producer.set(o.name, s.name)));

  const waitsOn = new Map<string, Set<string>>();
  names.forEach((name, i) => {
    const deps = new Set<string>();
    if (mode !== 'DAG' && i > 0) {
      deps.add(names[i - 1]);
    }
    const s = specOf.get(name);
    (s?.dependsOn || []).forEach((d) => deps.add(d));
    (s?.inputs || []).forEach((input) => {
      const from = producer.get(input.from);
      if (from) {
        deps.add(from);
      }
    });
    deps.delete(name);
    waitsOn.set(name, new Set(Array.from(deps).filter((d) => known.has(d))));
  });

  // In order, a step waiting on a later one is a wait that never ends: that
  // edge is always drawn, and never counts as part of a longer path.
  const position = new Map(names.map((n, i) => [n, i]));
  const backward = (from: string, to: string) => mode !== 'DAG' && (position.get(from) ?? 0) > (position.get(to) ?? 0);
  const forwardOf = (step: string) => Array.from(waitsOn.get(step) || []).filter((d) => !backward(d, step));

  // reaches is whether `to` waits on `from` through at least one other step.
  const reaches = (from: string, to: string): boolean => {
    const seen = new Set<string>([to]);
    const stack = forwardOf(to).filter((d) => d !== from);
    while (stack.length) {
      const next = stack.pop() as string;
      if (next === from) {
        return true;
      }
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(...forwardOf(next));
      }
    }
    return false;
  };

  const edges: StepEdge[] = [];
  names.forEach((to) => {
    (waitsOn.get(to) || new Set<string>()).forEach((from) => {
      if (backward(from, to) || !reaches(from, to)) {
        edges.push({ from, to });
      }
    });
  });
  return edges;
}

// groupMode is the mode a step group's sub-steps run in: the group's own, else
// the second half of the run's mode, else the workflow's sub-mode, else
// KubeVela's DAG.
export function groupMode(own?: string, recordMode?: string, workflowSubMode?: string): 'StepByStep' | 'DAG' {
  const mode = own || recordMode?.split('-')[1] || workflowSubMode;
  return mode === 'StepByStep' ? 'StepByStep' : 'DAG';
}

// groupOpensItself is whether a step group is drawn open before anyone opens
// it: a sub-step is waiting, running or has failed.
export function groupOpensItself(group: { subSteps?: Array<{ phase?: string }> }): boolean {
  const attention = ['suspending', 'running', 'executing', 'failed', 'terminated', 'stopped'];
  return (group.subSteps || []).some((s) => !!s.phase && attention.includes(s.phase));
}

// waitsOn names the steps in the same list a step waits on: those in its
// dependsOn and those whose outputs feed its inputs.
export function waitsOn(steps: SpecStep[]): Map<string, Set<string>> {
  const known = new Set(steps.map((s) => s.name));
  const producer = new Map<string, string>();
  steps.forEach((s) => (s.outputs || []).forEach((o) => producer.set(o.name, s.name)));
  const waits = new Map<string, Set<string>>();
  steps.forEach((s) => {
    const deps = new Set<string>();
    (s.dependsOn || []).forEach((d) => deps.add(d));
    (s.inputs || []).forEach((input) => {
      const from = producer.get(input.from);
      if (from) {
        deps.add(from);
      }
    });
    deps.delete(s.name);
    waits.set(s.name, new Set(Array.from(deps).filter((d) => known.has(d))));
  });
  return waits;
}

// orderByDependencies orders steps so each comes after every step it waits
// on, keeping the list order wherever that allows. Steps caught in a cycle
// keep their list order, after the rest.
export function orderByDependencies<T extends SpecStep>(steps: T[]): T[] {
  const waits = waitsOn(steps);
  const placed = new Set<string>();
  const ordered: T[] = [];
  let progress = true;
  while (progress) {
    progress = false;
    const next = steps.find(
      (s) => !placed.has(s.name) && Array.from(waits.get(s.name) || []).every((d) => placed.has(d))
    );
    if (next) {
      placed.add(next.name);
      ordered.push(next);
      progress = true;
    }
  }
  return [...ordered, ...steps.filter((s) => !placed.has(s.name))];
}

// forwardWaits are the steps that wait on a step listed after them: in order,
// such a step waits for ever, as the steps run in list order.
export function forwardWaits(steps: SpecStep[]): Array<{ step: string; waitsOn: string }> {
  const waits = waitsOn(steps);
  const index = new Map(steps.map((s, i) => [s.name, i]));
  const found: Array<{ step: string; waitsOn: string }> = [];
  steps.forEach((s, i) => {
    (waits.get(s.name) || new Set<string>()).forEach((d) => {
      if ((index.get(d) ?? -1) > i) {
        found.push({ step: s.name, waitsOn: d });
      }
    });
  });
  return found;
}

// forwardWaitsIn are a workflow's forward waits: at the top level when its
// steps run in order, and in each group whose steps do.
export function forwardWaitsIn(
  steps: Array<SpecStep & { type?: string; mode?: string; subSteps?: SpecStep[] }>,
  mode: string,
  subMode: string
): Array<{ step: string; waitsOn: string }> {
  const found = mode === 'StepByStep' ? forwardWaits(steps) : [];
  steps.forEach((s) => {
    if (s.type === 'step-group' && groupMode(s.mode, undefined, subMode) === 'StepByStep') {
      found.push(...forwardWaits(s.subSteps || []));
    }
  });
  return found;
}

// canMove is whether the step at index can swap places with its neighbour by
// delta (-1 earlier, 1 later) without coming before a step it waits on.
export function canMove(steps: SpecStep[], index: number, delta: -1 | 1): boolean {
  const other = index + delta;
  if (other < 0 || other >= steps.length) {
    return false;
  }
  const waits = waitsOn(steps);
  const [first, second] = delta < 0 ? [steps[other], steps[index]] : [steps[index], steps[other]];
  return !(waits.get(second.name) || new Set<string>()).has(first.name);
}
