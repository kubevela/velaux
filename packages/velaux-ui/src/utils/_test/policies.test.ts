import 'mocha';
import { assert } from 'chai';

import { policyRows, policyState } from '../policies';

describe('test policyState', () => {
  it('reads how an application policy fared', () => {
    assert.equal(policyState({ name: 'a', applied: true }), 'applied');
    assert.equal(policyState({ name: 'b', applied: false, message: 'enabled=false' }), 'skipped');
    assert.equal(policyState({ name: 'c', applied: false, error: true, message: 'render error: x' }), 'error');
    assert.equal(policyState({ name: 'd', applied: true, error: true }), 'error');
  });

  it("lists own policies with how they fared, then each environment's global ones", () => {
    const statuses: any = [
      {
        envName: 'dev',
        status: {
          status: 'running',
          appliedApplicationPolicies: [
            { name: 'team-labels', type: 'team-labels', namespace: 'vela-system', source: 'global', applied: true },
            { name: 'my-labels', type: 'labels', source: 'explicit', applied: true },
          ],
        },
      },
      { envName: 'prod', status: { status: 'running' } },
      {
        envName: 'qa',
        status: {
          status: 'running',
          appliedApplicationPolicies: [
            { name: 'team-labels', source: 'global', applied: false, error: true, message: 'render error' },
            { name: 'my-labels', type: 'labels', source: 'explicit', applied: false, message: 'enabled=false' },
          ],
        },
      },
    ];
    const own: any = [
      { name: 'my-labels', type: 'labels', envName: 'qa' },
      { name: 'dev-target', type: 'topology', envName: 'dev' },
    ];
    assert.deepEqual(policyRows(undefined, undefined), []);
    const rows = policyRows(own, statuses);
    assert.deepEqual(
      rows.map((row) => [row.name, row.envName, row.global, row.applied?.message]),
      [
        ['my-labels', 'qa', false, 'enabled=false'],
        ['dev-target', 'dev', false, undefined],
        ['team-labels', 'dev', true, undefined],
        ['team-labels', 'qa', true, 'render error'],
      ]
    );
    assert.equal(rows[0].policy, own[0]);
  });
});
