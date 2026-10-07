import type { DefinitionWhere } from '../api/definitions';

// DefinitionPlace is where a definition page's definition is: the project it
// is shown for, and whether it is that project's own or the global one. No
// project is the global one.
export type DefinitionPlace = { project: string; where?: DefinitionWhere };

// definitionPlaceFrom reads a definition page's place from its query.
export function definitionPlaceFrom(search: string): DefinitionPlace {
  const query = new URLSearchParams(search);
  const where = query.get('where');
  return {
    project: query.get('project') || '',
    where: where === 'project' || where === 'global' ? where : undefined,
  };
}

// definitionPlaceQuery is the query that keeps a place across the pages.
export function definitionPlaceQuery(place: DefinitionPlace): string {
  const query = new URLSearchParams();
  if (place.project) {
    query.set('project', place.project);
  }
  if (place.where) {
    query.set('where', place.where);
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}

// definitionResource is the permission resource behind changing a definition:
// a project's own under the project, a global one under the platform.
export function definitionResource(place: DefinitionPlace, name: string): string {
  return place.where === 'project' ? `project:${place.project}/definition:${name}` : `definition:${name}`;
}
