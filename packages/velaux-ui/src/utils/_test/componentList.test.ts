import { expect } from 'chai';

import { flattenProperties } from '../../components/RowList/properties';
import {
  componentDependsOn,
  componentHealth,
  dependsOnOptions,
} from '../../pages/ApplicationConfig/components/ComponentList/model';

describe('component list', () => {
  it("gives a component's health in each env it is placed in", () => {
    const statuses = [
      { envName: 'dev', status: { services: [{ name: 'api', healthy: true }] } },
      { envName: 'prod', status: { services: [{ name: 'api', healthy: false, message: 'Ready:0/1' }] } },
      { envName: 'test', status: { services: [{ name: 'db', healthy: true }] } },
    ];
    expect(componentHealth('api', statuses)).to.deep.equal([
      { env: 'dev', health: 'healthy', message: undefined },
      { env: 'prod', health: 'unhealthy', message: 'Ready:0/1' },
    ]);
  });

  it('is unhealthy in an env where any placement is', () => {
    const statuses = [
      {
        envName: 'prod',
        status: {
          services: [
            { name: 'api', healthy: true, cluster: 'east' },
            { name: 'api', healthy: false, cluster: 'west', message: 'CrashLoop' },
          ],
        },
      },
    ];
    expect(componentHealth('api', statuses)[0]).to.deep.equal({
      env: 'prod',
      health: 'unhealthy',
      message: 'CrashLoop',
    });
  });

  it('lists properties by path', () => {
    expect(
      flattenProperties({
        image: 'api:1.4',
        ports: [{ port: 80, expose: true }, { port: 9090 }],
        env: { LOG: 'debug' },
        args: ['a', 'b'],
        replicas: 2,
      })
    ).to.deep.equal([
      { key: 'image', value: 'api:1.4' },
      { key: 'ports[0].port', value: '80' },
      { key: 'ports[0].expose', value: 'true' },
      { key: 'ports[1].port', value: '9090' },
      { key: 'env.LOG', value: 'debug' },
      { key: 'args', value: 'a, b' },
      { key: 'replicas', value: '2' },
    ]);
  });

  it('summarises a long list of objects by its length', () => {
    const volumes = [1, 2, 3, 4, 5, 6].map((i) => ({ name: `v${i}` }));
    expect(flattenProperties({ volumes })).to.deep.equal([{ key: 'volumes', value: '6 items' }]);
  });

  it('lists written dependencies, then inferred ones not already written', () => {
    const deps = componentDependsOn(
      ['db'],
      [
        { name: 'db', direction: 'outbound' },
        { name: 'db', direction: 'outbound', inferred: 'reads db' },
        { name: 'cache', direction: 'outbound', inferred: 'reads cache' },
        { name: 'web', direction: 'inbound' },
      ]
    );
    expect(deps.map((d) => [d.name, !!d.inferred])).to.deep.equal([
      ['db', false],
      ['cache', true],
    ]);
  });

  it('keeps an inferred read of another placement beside the written one', () => {
    const deps = componentDependsOn(['db'], [{ name: 'db', direction: 'outbound', inferred: 'reads', where: 'east' }]);
    expect(deps.map((d) => [d.name, d.where])).to.deep.equal([
      ['db', undefined],
      ['db', 'east'],
    ]);
  });

  it('offers no component that already depends on this one, written or inferred', () => {
    const components = [{ name: 'db' }, { name: 'api' }, { name: 'worker', dependsOn: ['db'] }, { name: 'cache' }];
    const items = [{ name: 'api', direction: 'inbound' as const, inferred: 'api reads db' }];
    expect(dependsOnOptions(components, 'db', items).map((o) => o.value)).to.deep.equal(['cache']);
  });

  it('marks a component this one reads already', () => {
    const options = dependsOnOptions([{ name: 'db' }, { name: 'api' }, { name: 'cache', alias: 'Cache' }], 'api', [
      { name: 'db', direction: 'outbound', inferred: 'api reads db' },
      { name: 'cache', direction: 'outbound', inferred: 'reads in east', where: 'east' },
    ]);
    expect(options).to.deep.equal([
      { label: 'db', value: 'db', inferred: 'api reads db' },
      { label: 'Cache(cache)', value: 'cache' },
    ]);
  });

  it('offers no component that depends on this one through others', () => {
    // worker depends on api (written), api reads db (inferred): db may not depend on worker.
    const components = [{ name: 'db' }, { name: 'api' }, { name: 'worker', dependsOn: ['api'] }, { name: 'cache' }];
    const edges = [{ component: 'api', dependsOn: 'db', source: 'expression' as const }];
    expect(dependsOnOptions(components, 'db', [], edges).map((o) => o.value)).to.deep.equal(['cache']);
  });
});
