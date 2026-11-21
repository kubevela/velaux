import React, { useContext, useEffect, useState } from 'react';

import { ProjectContext } from '../../context';

import { listDefinitionRevisions } from '../../api/definitions';
import type { DefinitionRevision } from '../../utils/definitionVersion';
import { inUseLabel, splitType } from '../../utils/definitionVersion';

// revisionsFor loads a definition's revisions once a minute at most, shared by
// every node of that type on the page.
const loaded = new Map<string, { at: number; revisions: Promise<DefinitionRevision[]> }>();
const fresh = 60 * 1000;

function revisionsFor(project: string, kind: string, name: string): Promise<DefinitionRevision[]> {
  const key = `${project}/${kind}/${name}`;
  const hit = loaded.get(key);
  if (hit && Date.now() - hit.at < fresh) {
    return hit.revisions;
  }
  const revisions = listDefinitionRevisions({ project, name, type: kind })
    .then((res: any) => (res?.revisions || []) as DefinitionRevision[])
    .catch(() => []);
  loaded.set(key, { at: Date.now(), revisions });
  return revisions;
}

// useInUseLabel is the revision a type resolves to, once its definition's
// revisions are read: the latest, or the version it is pinned to. The
// project's own definition, from ProjectContext, comes before a global one.
export function useInUseLabel(kind: 'component' | 'source' | 'trait', type?: string): string {
  const project = useContext(ProjectContext);
  const { name, version } = splitType(type);
  const [revisions, setRevisions] = useState<DefinitionRevision[] | undefined>();
  useEffect(() => {
    let live = true;
    if (name) {
      revisionsFor(project, kind, name).then((list) => live && setRevisions(list));
    }
    return () => {
      live = false;
    };
  }, [project, kind, name]);
  return revisions ? inUseLabel(version, revisions) : version || 'latest';
}

// DefinitionLine is the definition a node is an instance of, and under it the
// revision its type resolves to.
export const DefinitionLine = (props: { kind: 'component' | 'source'; type?: string }) => {
  const { name } = splitType(props.type);
  const label = useInUseLabel(props.kind, props.type);
  if (!name) {
    return null;
  }
  return (
    <div className="definition-line">
      <span className="definition-name">{name}</span>
      <span className="definition-version">{label}</span>
    </div>
  );
};
