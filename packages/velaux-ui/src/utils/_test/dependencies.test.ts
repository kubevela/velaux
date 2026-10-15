import 'mocha';
import { assert } from 'chai';

import { dependencyItems } from '../dependencies';

describe('test dependencyItems', () => {
  it('lists what a component depends on, marking those inferred from an expression', () => {
    assert.deepEqual(
      dependencyItems('api', [
        { component: 'api', dependsOn: 'cfg', source: 'dependsOn' },
        { component: 'api', dependsOn: 'auth', source: 'inputs' },
        { component: 'api', dependsOn: 'db', source: 'expression' },
        { component: 'api', dependsOn: 'flags', source: 'expression', cluster: 'east' },
        { component: 'api', dependsOn: 'q', source: 'expression', cluster: 'east', namespace: 'infra' },
        { component: 'api', dependsOn: 'ops', source: 'expression', namespace: 'infra' },
      ]),
      [
        { name: 'cfg', direction: 'outbound' },
        { name: 'auth', direction: 'outbound' },
        {
          name: 'db',
          direction: 'outbound',
          inferred: 'Inferred from an expression: api reads db beside it, so it is applied once db is healthy there',
        },
        {
          name: 'flags',
          direction: 'outbound',
          where: 'east',
          inferred:
            'Inferred from an expression: api reads flags in east. Not ordered automatically; the workflow decides when',
        },
        {
          name: 'q',
          direction: 'outbound',
          where: 'east/infra',
          inferred:
            'Inferred from an expression: api reads q in east/infra. Not ordered automatically; the workflow decides when',
        },
        {
          name: 'ops',
          direction: 'outbound',
          where: 'namespace infra',
          inferred:
            'Inferred from an expression: api reads ops in namespace infra. Not ordered automatically; the workflow decides when',
        },
      ]
    );
  });

  it('lists what depends on a component after what it depends on', () => {
    assert.deepEqual(
      dependencyItems('db', [
        { component: 'api', dependsOn: 'db', source: 'dependsOn' },
        { component: 'db', dependsOn: 'vol', source: 'dependsOn' },
        { component: 'web', dependsOn: 'db', source: 'expression' },
        { component: 'web', dependsOn: 'api', source: 'dependsOn' },
      ]),
      [
        { name: 'vol', direction: 'outbound' },
        { name: 'api', direction: 'inbound' },
        {
          name: 'web',
          direction: 'inbound',
          inferred: 'Inferred from an expression: web reads db beside it, so it is applied once db is healthy there',
        },
      ]
    );
  });

  it('carries the type of each component it names', () => {
    assert.deepEqual(
      dependencyItems(
        'api',
        [
          { component: 'api', dependsOn: 'db', source: 'dependsOn' },
          { component: 'web', dependsOn: 'api', source: 'dependsOn' },
          { component: 'api', dependsOn: 'gone', source: 'dependsOn' },
        ],
        { db: 'postgres', web: 'webservice' }
      ),
      [
        { name: 'db', direction: 'outbound', type: 'postgres' },
        { name: 'gone', direction: 'outbound' },
        { name: 'web', direction: 'inbound', type: 'webservice' },
      ]
    );
  });

  it('keeps a read of a cluster apart from a read of a namespace of the same name', () => {
    assert.deepEqual(
      dependencyItems('api', [
        { component: 'api', dependsOn: 'db', source: 'expression', cluster: 'east' },
        { component: 'api', dependsOn: 'db', source: 'expression', namespace: 'east' },
      ]).map((i) => i.where),
      ['east', 'namespace east']
    );
  });

  it('lists a component once per direction, the written dependency winning over an inferred one', () => {
    assert.deepEqual(
      dependencyItems('api', [
        { component: 'api', dependsOn: 'db', source: 'dependsOn' },
        { component: 'api', dependsOn: 'db', source: 'expression' },
        { component: 'web', dependsOn: 'api', source: 'expression' },
        { component: 'web', dependsOn: 'api', source: 'inputs' },
      ]),
      [
        { name: 'db', direction: 'outbound' },
        { name: 'web', direction: 'inbound' },
      ]
    );
  });

  it('is empty with none, including before the status loads', () => {
    assert.deepEqual(dependencyItems('api', []), []);
    assert.deepEqual(dependencyItems('api', undefined), []);
    assert.deepEqual(dependencyItems('api', null), []);
  });
});
