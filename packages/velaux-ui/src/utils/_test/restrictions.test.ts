import 'mocha';
import { assert } from 'chai';

import {
  deployNamespaces,
  describeNamespaces,
  describeQuota,
  describeSelector,
  isUsable,
  restrictsNamespaces,
  usageState,
} from '../restrictions';

describe('test definition restrictions', () => {
  it('tells whether namespaces are restricted', () => {
    assert.isFalse(restrictsNamespaces(undefined));
    assert.isFalse(restrictsNamespaces({ quota: [{ limit: 3 }] }));
    assert.isTrue(restrictsNamespaces({ namespaces: ['dev'] }));
    assert.isTrue(restrictsNamespaces({ namespaceSelector: {} }));
  });

  it('describes a label selector', () => {
    assert.equal(describeSelector({}), 'every namespace');
    assert.equal(
      describeSelector({
        matchLabels: { tier: 'gold', team: 'a' },
        matchExpressions: [
          { key: 'env', operator: 'In', values: ['dev', 'qa'] },
          { key: 'legacy', operator: 'DoesNotExist' },
        ],
      }),
      'labels team=a, tier=gold, env in (dev, qa), legacy absent'
    );
    assert.equal(
      describeSelector({
        matchExpressions: [
          { key: 'env', operator: 'NotIn', values: ['prod'] },
          { key: 'x', operator: 'Exists' },
        ],
      }),
      'labels env not in (prod), x present'
    );
  });

  it('describes the namespaces that may use a definition', () => {
    assert.deepEqual(describeNamespaces(undefined), []);
    assert.deepEqual(
      describeNamespaces({
        namespaces: ['vela-system', 'tenant-*'],
        namespaceSelector: { matchLabels: { tenant: 'true' } },
      }),
      ['vela-system', 'tenant-*', 'labels tenant=true']
    );
  });

  it('describes quota entries in order, the matcher-less one as the default', () => {
    assert.deepEqual(describeQuota(undefined), []);
    assert.deepEqual(
      describeQuota({
        quota: [
          { namespaceSelector: { matchLabels: { tier: 'gold' } }, warn: 16, limit: 20 },
          { namespaces: ['sandbox-*'], limit: 0 },
          { warn: 5 },
        ],
      }),
      ['labels tier=gold: warn at 16, limit 20', 'sandbox-*: not allowed', 'any other namespace: warn at 5']
    );
    assert.deepEqual(describeQuota({ quota: [{ limit: 10 }] }), ['every namespace: limit 10']);
  });

  it('collects the namespaces an application deploys to, once each', () => {
    assert.deepEqual(deployNamespaces(undefined), []);
    assert.deepEqual(
      deployNamespaces([
        { name: 'dev', appDeployNamespace: 'team-dev' },
        { name: 'prod', appDeployNamespace: 'team-prod' },
        { name: 'qa', appDeployNamespace: 'team-dev' },
        { name: 'new', appDeployNamespace: '' },
      ]),
      ['team-dev', 'team-prod']
    );
  });

  it('tells whether every namespace asked about may use a definition', () => {
    assert.isTrue(isUsable({}));
    assert.isTrue(isUsable({ unusableIn: [] }));
    assert.isFalse(isUsable({ unusableIn: ['team-dev'] }));
  });

  it('words how a namespace uses a definition against its quota', () => {
    assert.deepEqual(usageState('ok'), { label: 'Within quota', type: 'success' });
    assert.deepEqual(usageState('warn'), { label: 'At warn level', type: 'warning' });
    assert.deepEqual(usageState('over'), { label: 'Over limit', type: 'error' });
    assert.deepEqual(usageState('exempt'), { label: 'Exempt', type: 'normal' });
    assert.deepEqual(usageState('unlimited'), { label: 'No quota', type: 'normal' });
  });
});
