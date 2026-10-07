import { expect } from 'chai';

import { componentRatio, healthOf, workflowLabel } from '../../pages/ApplicationList/components/AppStatus/health';

describe('application health', () => {
  it('is not deployed without a status', () => {
    expect(healthOf(undefined)).to.equal('undeployed');
    expect(healthOf({ health: 'unhealthy', components: 2, healthyComponents: 1 })).to.equal('unhealthy');
  });

  it('counts the share of components healthy', () => {
    expect(componentRatio({ health: 'unhealthy', components: 4, healthyComponents: 3 })).to.equal(0.75);
    expect(componentRatio({ health: 'undeployed', components: 0, healthyComponents: 0 })).to.equal(undefined);
  });

  it('writes a workflow phase as a word', () => {
    expect(workflowLabel('executing')).to.equal('Executing');
    expect(workflowLabel(undefined)).to.equal('');
  });
});
