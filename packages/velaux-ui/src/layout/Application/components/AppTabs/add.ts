// addQuery asks a configure tab to open its add dialog once it loads.
export const addQuery = 'add=1';

// addLink is a configure tab's path with its add dialog asked for.
export function addLink(to: string): string {
  return `${to}?${addQuery}`;
}

// wantsAdd reports whether a page's query asks for its add dialog.
export function wantsAdd(search?: string): boolean {
  return new URLSearchParams(search || '').get('add') === '1';
}

// tabsReadOnly reports whether an application's tabs offer no +: when it is
// read-only, and until its own details have loaded.
export function tabsReadOnly(detail: { name?: string; readOnly?: boolean } | undefined, appName: string): boolean {
  if (!detail || detail.name !== appName) {
    return true;
  }
  return !!detail.readOnly;
}

// tabRuns splits tabs into runs of neighbours that share a group, or none.
export function tabRuns<T extends { group?: string }>(tabs: T[]): Array<{ group?: string; tabs: T[] }> {
  const runs: Array<{ group?: string; tabs: T[] }> = [];
  tabs.forEach((t) => {
    const last = runs[runs.length - 1];
    if (last && last.group === t.group) {
      last.tabs.push(t);
    } else {
      runs.push({ group: t.group, tabs: [t] });
    }
  });
  return runs;
}

// environmentViews are one env's views, in one row: its status three ways, then its
// instances, logs, workflow and YAML. base is the env's path.
export function environmentViews(
  base: string
): Array<{ key: string; label: string; to: string; active: (path: string) => boolean }> {
  const status = `${base}/status`;
  const under = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + '/');
  return [
    { key: 'overview', label: 'Overview', to: `${status}/overview`, active: (p) => under(p, `${status}/overview`) },
    { key: 'resources', label: 'Resource Graph', to: status, active: (p) => p === status || p === status + '/' },
    { key: 'graph', label: 'Application Graph', to: `${status}/graph`, active: (p) => under(p, `${status}/graph`) },
    { key: 'instances', label: 'Instances', to: `${base}/instances`, active: (p) => under(p, `${base}/instances`) },
    { key: 'logs', label: 'Logs', to: `${base}/logs`, active: (p) => under(p, `${base}/logs`) },
    { key: 'workflow', label: 'Workflow', to: `${base}/workflow`, active: (p) => under(p, `${base}/workflow`) },
    { key: 'yaml', label: 'YAML', to: `${base}/yaml`, active: (p) => under(p, `${base}/yaml`) },
  ];
}

// statusMode is the status view a URL names: /status/overview, /status/graph,
// or the resource graph at /status.
export function statusMode(view?: string): 'overview' | 'resource-graph' | 'application-graph' {
  if (view === 'overview') {
    return 'overview';
  }
  return view === 'graph' ? 'application-graph' : 'resource-graph';
}
