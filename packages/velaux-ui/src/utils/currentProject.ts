import type { LoginUserInfo } from '@velaux/data';

import { checkPermission } from './permission';

// projectKey is where the browser remembers the project last picked.
export const projectKey = 'project';

// allProjects is the picker's value for every project at once, offered to those
// who may list every project.
export const allProjects = '';

// seesAllProjects is whether a user may work across every project at once.
export function seesAllProjects(userInfo?: LoginUserInfo): boolean {
  return checkPermission({ resource: 'project:*', action: 'list' }, '', userInfo);
}

// resolveProject is the project to work in: the one asked for when the user may
// open it, otherwise every project for those who may, otherwise their first.
export function resolveProject(asked: string | null | undefined, projects: string[], all: boolean): string {
  if (asked && projects.includes(asked)) {
    return asked;
  }
  if (all) {
    return allProjects;
  }
  return projects[0] || allProjects;
}

// inProject is whether something in a project belongs in the views of the
// picked one.
export function inProject(picked: string, project?: string): boolean {
  return picked === allProjects || project === picked;
}

// projectChanged is whether a view scoped to the project must load again: the
// project became known, or another was picked.
export function projectChanged(
  prev?: { current: string; resolved: boolean },
  next?: { current: string; resolved: boolean }
): boolean {
  return !!next?.resolved && (!prev?.resolved || prev.current !== next.current);
}

// askedProject is the project a link names (?project=), else the one last picked
// in this browser, else null.
export function askedProject(): string | null {
  const fromURL = new URLSearchParams(window.location.search).get('project');
  if (fromURL !== null) {
    return fromURL;
  }
  try {
    return localStorage.getItem(projectKey);
  } catch (e) {
    return null;
  }
}

// scopedTo is what a view of the picked project shows of a list it shares with
// other views: nothing until the project is known, then only that project's.
// A list loaded for another project, or for all of them, never shows meanwhile.
export function scopedTo<T>(
  items: T[] | undefined,
  picked: { current: string; resolved: boolean } | undefined,
  projectOf: (item: T) => string | undefined
): T[] {
  if (!picked?.resolved) {
    return [];
  }
  return (items || []).filter((item) => inProject(picked.current, projectOf(item)));
}
