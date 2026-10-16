import { expect } from 'chai';

import { flowLine, flowNodes } from '../../pages/ApplicationStatus/components/ApplicationGraph/flows';
import { placementKey } from '../../pages/ApplicationStatus/components/ApplicationGraph/sources';

const placements = new Map<string, string>([
  [placementKey('', 'prod', 'web'), 'web@local'],
  [placementKey('east', 'prod', 'web'), 'web@east'],
  [placementKey('', 'prod', 'db'), 'db@local'],
  [placementKey('east', 'prod', 'db'), 'db@east'],
]);
const sources = new Map<string, string>([['cfg', 'source-cfg']]);

describe('data flow nodes', () => {
  it('puts a flow between a component and every placement of its reader, fed from beside it', () => {
    const nodes = flowNodes(
      [
        {
          from: { kind: 'component', name: 'db' },
          to: { kind: 'component', name: 'web' },
          via: 'expression',
          items: [],
        },
      ],
      placements,
      sources
    );
    expect(nodes.map((n) => [n.linksFrom, n.links])).to.deep.equal([
      [['db@local'], ['web@local']],
      [['db@east'], ['web@east']],
    ]);
  });

  it('feeds a flow from the placement the read names', () => {
    const nodes = flowNodes(
      [
        {
          from: { kind: 'component', name: 'db', cluster: 'east' },
          to: { kind: 'component', name: 'web' },
          via: 'expression',
          items: [],
        },
      ],
      placements,
      sources
    );
    expect(nodes.map((n) => n.linksFrom![0])).to.deep.equal(['db@east', 'db@east']);
  });

  it('feeds a source flow from the source node, to the reader placement status names', () => {
    const nodes = flowNodes(
      [
        {
          from: { kind: 'source', name: 'cfg' },
          to: { kind: 'component', name: 'web', cluster: 'local', namespace: 'prod' },
          via: 'source',
          items: [],
        },
      ],
      placements,
      sources
    );
    expect(nodes).to.have.length(1);
    expect(nodes[0].linksFrom).to.deep.equal(['source-cfg']);
    expect(nodes[0].links).to.deep.equal(['web@local']);
  });

  it('leaves out a flow with no producer on the graph', () => {
    expect(
      flowNodes(
        [
          {
            from: { kind: 'component', name: 'gone' },
            to: { kind: 'component', name: 'web' },
            via: 'dependsOn',
            items: [],
          },
        ],
        placements,
        sources
      )
    ).to.deep.equal([]);
  });

  it('renders an item as what was read into which property', () => {
    expect(flowLine({ read: 'data.host', property: 'env[0].value', value: 'db.internal' })).to.equal(
      'data.host → env[0].value = db.internal'
    );
    expect(flowLine({ read: 'component.api.output.x', property: 'team', trait: 'labels' })).to.equal(
      'component.api.output.x → team (labels)'
    );
    expect(flowLine({ read: 'data.port', property: 'port', value: 5432 })).to.equal('data.port → port = 5432');
  });
});
