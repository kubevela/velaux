import 'mocha';
import { assert } from 'chai';

import type { ComponentStatus } from '@velaux/data';

import { componentStatusKey, detailEntries, hasStatusDetails, summaryEntries, traitState } from '../status';

function component(fields: Partial<ComponentStatus>): ComponentStatus {
  return {
    name: 'backend',
    namespace: 'default',
    healthy: true,
    message: '',
    cluster: 'local',
    workloadDefinition: { apiVersion: 'apps/v1', kind: 'Deployment' },
    ...fields,
  };
}

describe('test status details', () => {
  it('sorts entries by key', () => {
    assert.deepEqual(detailEntries({ replicas: '3', endpoint: 'http://10.0.0.4', image: 'nginx' }), [
      { key: 'endpoint', value: 'http://10.0.0.4' },
      { key: 'image', value: 'nginx' },
      { key: 'replicas', value: '3' },
    ]);
  });

  it('treats a missing map as empty', () => {
    assert.deepEqual(detailEntries(undefined), []);
    assert.deepEqual(detailEntries({}), []);
  });

  it('finds details on the component or any trait', () => {
    assert.isFalse(hasStatusDetails(component({})));
    assert.isFalse(
      hasStatusDetails(component({ details: {}, traits: [{ type: 'scaler', healthy: true, message: '' }] }))
    );
    assert.isTrue(hasStatusDetails(component({ details: { replicas: '3' } })));
    assert.isTrue(
      hasStatusDetails(
        component({ traits: [{ type: 'gateway', healthy: true, message: '', details: { host: 'api.example.com' } }] })
      )
    );
  });

  it('keys a component status by placement', () => {
    const hub = component({ cluster: 'local' });
    const spoke = component({ cluster: 'spoke-1' });
    assert.notEqual(componentStatusKey(hub), componentStatusKey(spoke));
    assert.equal(componentStatusKey(hub), componentStatusKey(component({ cluster: 'local' })));
  });

  it('drops empty summary fields and joins lists', () => {
    assert.deepEqual(
      summaryEntries([
        ['Alias', ''],
        ['DependsOn', []],
        ['Namespace', 'default'],
        ['Cluster', undefined],
        ['Needs', ['db', 'cache']],
      ]),
      [
        { key: 'Namespace', value: 'default' },
        { key: 'Needs', value: 'db, cache' },
      ]
    );
  });

  it('reads a pending trait as pending, not failed', () => {
    assert.equal(traitState({ healthy: true }), 'healthy');
    assert.equal(traitState({ healthy: false }), 'unhealthy');
    assert.equal(traitState({ healthy: false, pending: true }), 'pending');
    assert.equal(traitState({ healthy: false, pending: false }), 'unhealthy');
  });
});
