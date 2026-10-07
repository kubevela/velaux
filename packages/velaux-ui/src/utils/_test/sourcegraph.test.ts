import { expect } from 'chai';

import {
  placementKey,
  sourceLinks,
  sourcePhaseTone,
  sourceReads,
} from '../../pages/ApplicationStatus/components/ApplicationGraph/sources';

const placements = new Map<string, string>([
  [placementKey('', 'prod', 'web'), 'node-web-local'],
  [placementKey('east', 'prod', 'web'), 'node-web-east'],
  [placementKey('', 'prod', 'api'), 'node-api'],
]);

describe('source graph', () => {
  it('links a source to the component placements that read it', () => {
    const got = sourceLinks(
      {
        name: 'db',
        consumedBy: [
          { definitionKind: 'component', name: 'web', cluster: 'local', namespace: 'prod' },
          { definitionKind: 'trait', name: 'api/sidecar' },
          { definitionKind: 'workflowstep', name: 'notify' },
        ],
      },
      placements
    );
    expect(got.links).to.have.members(['node-web-local', 'node-api']);
    expect(got.elsewhere.map((c) => c.name)).to.deep.equal(['notify']);
  });

  it('links a reader that names no placement to every placement of its component', () => {
    const got = sourceLinks({ name: 'db', consumedBy: [{ definitionKind: 'component', name: 'web' }] }, placements);
    expect(got.links).to.have.members(['node-web-local', 'node-web-east']);
  });

  it('keeps a reader with no node on the graph', () => {
    const got = sourceLinks({ name: 'db', consumedBy: [{ definitionKind: 'component', name: 'gone' }] }, placements);
    expect(got.links).to.deep.equal([]);
    expect(got.elsewhere).to.have.length(1);
  });

  it('lists the sources a placement reads, saying when only a trait reads it', () => {
    const sources = [
      { name: 'db', type: 'configmap', consumedBy: [{ definitionKind: 'component', name: 'web', cluster: 'local' }] },
      { name: 'flags', consumedBy: [{ definitionKind: 'trait', name: 'web/labels' }] },
      { name: 'other', consumedBy: [{ definitionKind: 'component', name: 'web', cluster: 'east' }] },
    ];
    const items = sourceReads('web', '', 'prod', sources);
    expect(items.map((i) => i.name)).to.deep.equal(['db', 'flags']);
    expect(items[0]).to.include({ kind: 'source', type: 'configmap', direction: 'outbound' });
    expect(items[0].inferred).to.equal(undefined);
    expect(items[1].inferred).to.equal('Read by its labels trait');
  });

  it('colours a source by its phase', () => {
    expect(sourcePhaseTone('Resolved')).to.equal('healthy');
    expect(sourcePhaseTone('Stale')).to.equal('suspended');
    expect(sourcePhaseTone('Failed')).to.equal('failed');
    expect(sourcePhaseTone('Unused')).to.equal('neutral');
    expect(sourcePhaseTone(undefined)).to.equal('neutral');
  });
});
