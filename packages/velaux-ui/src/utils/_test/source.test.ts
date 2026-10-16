import { expect } from 'chai';

import { sourceBindingName, sourceFields, sourceNamePattern } from '../source';

describe('sourceFields', () => {
  const schema = {
    type: 'object',
    properties: {
      endpoint: {
        type: 'object',
        description: 'Where the database listens',
        properties: { host: { type: 'string' }, port: { type: 'integer' } },
      },
      replicas: { type: 'array', items: { type: 'object', properties: { host: { type: 'string' } } } },
      labels: { type: 'object', additionalProperties: { type: 'string' } },
      tls: { type: 'boolean' },
    },
  };

  it('lists every readable path with its type, in declaration order', () => {
    expect(sourceFields('db', schema)).to.deep.equal([
      { path: 'source.db.endpoint', type: 'object', description: 'Where the database listens' },
      { path: 'source.db.endpoint.host', type: 'string', description: undefined },
      { path: 'source.db.endpoint.port', type: 'integer', description: undefined },
      { path: 'source.db.replicas', type: 'array<object>', description: undefined },
      { path: 'source.db.labels', type: 'map<string>', description: undefined },
      { path: 'source.db.tls', type: 'boolean', description: undefined },
    ]);
  });

  it('is empty for a source without a schema', () => {
    expect(sourceFields('db', undefined)).to.deep.equal([]);
  });
});

describe('sourceBindingName', () => {
  it('names the binding after the type, as an identifier', () => {
    expect(sourceBindingName('cluster-info')).to.equal('clusterInfo');
    expect(sourceBindingName('service-catalog-demo')).to.equal('serviceCatalogDemo');
    expect(sourceBindingName('vela.config')).to.equal('velaConfig');
    expect(sourceBindingName('2fa-keys')).to.equal('source2faKeys');
  });

  it('produces names the source name rule accepts', () => {
    ['cluster-info', 'service-catalog-demo', 'vela.config', '2fa-keys'].forEach((t) =>
      expect(sourceNamePattern.test(sourceBindingName(t))).to.equal(true)
    );
    expect(sourceNamePattern.test('cluster-info')).to.equal(false);
  });
});
