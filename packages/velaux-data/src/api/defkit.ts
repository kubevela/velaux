// DefKitSource is where a DefKit module comes from and how it is rendered:
// a Go module path (ref) or a git repository (git).
export interface DefKitSource {
  ref?: string;
  git?: string;
  // version is a module version or, with git, a branch, tag or commit.
  version?: string;
  prefix?: string;
  types?: string[];
}

export type DefKitPolicy = 'retain' | 'delete';

// DefKitSettings are how a module is kept: what happens to its definitions
// when it no longer installs them, and whether it re-renders on its own.
export interface DefKitSettings {
  deletionPolicy?: DefKitPolicy;
  // overrides set single definitions' policy, by Kind/name.
  overrides?: Record<string, DefKitPolicy>;
  autoUpdate?: boolean;
  // interval is a Go duration, 10m when empty.
  interval?: string;
}

export interface DefKitMaintainer {
  name: string;
  email?: string;
}

// DefKitModuleInfo is what a module says about itself, as its last render read it.
export interface DefKitModuleInfo {
  name: string;
  resolvedVersion?: string;
  description?: string;
  maintainers?: DefKitMaintainer[];
  categories?: string[];
  hasHooks?: boolean;
}

export type DefKitPhase = 'rendering' | 'review' | 'applying' | 'applied' | 'failed';

// DefKitModule is an installed module: an Application of the defkit addon.
export interface DefKitModule {
  name: string;
  source: DefKitSource;
  settings: DefKitSettings;
  // nextUpdate is when an auto-updating module renders next.
  nextUpdate?: string;
  phase: DefKitPhase;
  message?: string;
  info?: DefKitModuleInfo;
  // counts are the installed definitions by kind.
  counts: Record<string, number>;
  updateTime: string;
}

export interface DefKitDefinition {
  kind: string;
  name: string;
  description?: string;
  // policy is its deletion policy: its override, or the module's.
  policy?: DefKitPolicy;
}

export interface DefKitModuleDetail extends DefKitModule {
  definitions: DefKitDefinition[];
  application?: DefKitApplication;
}

// DefKitApplication is the Application a module is: its workflow as far as it
// has run, and every resource it tracks.
export interface DefKitApplication {
  name: string;
  namespace: string;
  phase?: string;
  steps: DefKitStep[];
  resources: DefKitResource[];
}

export interface DefKitStep {
  name: string;
  type?: string;
  phase?: string;
  message?: string;
  startTime?: string;
  endTime?: string;
}

export interface DefKitResource {
  apiVersion: string;
  kind: string;
  name: string;
  namespace?: string;
}

export type DefKitItemStatus = 'new' | 'changed' | 'unchanged' | 'conflict' | 'removed';

// DefKitPreviewItem is one definition a pending render would change, or leave.
export interface DefKitPreviewItem extends DefKitDefinition {
  status: DefKitItemStatus;
  current?: string;
  next?: string;
}

export interface DefKitPreview {
  phase: DefKitPhase;
  message?: string;
  info?: DefKitModuleInfo;
  errors?: string[];
  items: DefKitPreviewItem[];
}

// DefKitRepository is a module source the defkit addon offers when adding one.
export interface DefKitRepository {
  name: string;
  git?: string;
  ref?: string;
  version?: string;
  description?: string;
}
