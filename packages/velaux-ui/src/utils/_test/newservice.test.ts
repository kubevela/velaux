import { expect } from 'chai';

import { defaultEnvs, newServiceRequest } from '../../pages/ApplicationList/components/NewServiceDialog/request';

describe('new service', () => {
  it('asks for an application with no component, bound to its environments', () => {
    const req = newServiceRequest({ name: 'shop', project: 'default', envs: ['dev', 'prod'] });
    expect(req).to.deep.equal({
      name: 'shop',
      alias: undefined,
      description: undefined,
      project: 'default',
      labels: undefined,
      annotations: undefined,
      envBinding: [{ name: 'dev' }, { name: 'prod' }],
      workflowMode: undefined,
    });
    expect(req).to.not.have.property('component');
  });

  it('writes its settings as the metadata the controller reads', () => {
    const req = newServiceRequest({
      name: 'shop',
      project: 'default',
      labels: { team: 'a' },
      annotations: { note: 'x' },
      expressions: true,
      paused: true,
      resyncInterval: ' 10m ',
      workflowMode: 'DAG',
    });
    expect(req.labels).to.deep.equal({ team: 'a', 'controller.core.oam.dev/pause': 'true' });
    expect(req.annotations).to.deep.equal({
      note: 'x',
      'app.oam.dev/cel-expressions': 'true',
      'app.oam.dev/reconcile-interval': '10m',
    });
    expect(req.workflowMode).to.equal('DAG');
  });
});

describe('defaultEnvs', () => {
  it("binds a new service to a project's only environment", () => {
    expect(defaultEnvs(['production'], [])).to.deep.equal(['production']);
  });
  it('leaves the choice alone with several environments, or once one is chosen', () => {
    expect(defaultEnvs(['dev', 'prod'], [])).to.deep.equal([]);
    expect(defaultEnvs([], [])).to.deep.equal([]);
    expect(defaultEnvs(['production'], ['production'])).to.deep.equal(['production']);
  });
});
