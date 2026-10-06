import { expect } from 'chai';

import { recordStatus } from '../../components/PipelineGraph/status';
import { generatedStepProperties } from '../../pages/ApplicationWorkflowStatus/components/WorkflowRecord/status';

describe('recordStatus', () => {
  it('gives each phase a badge tone and label', () => {
    expect(recordStatus('succeeded')).to.deep.equal({ tone: 'healthy', label: 'Succeeded' });
    expect(recordStatus('terminated').tone).to.equal('failed');
    expect(recordStatus('suspending').tone).to.equal('progressing');
    expect(recordStatus('executing').tone).to.equal('progressing');
    expect(recordStatus('somethingNew')).to.deep.equal({ tone: 'neutral', label: 'SomethingNew' });
    expect(recordStatus(undefined).label).to.equal('Unknown');
  });
});

describe('generatedStepProperties', () => {
  it('gives a generated apply-component step its component', () => {
    expect(generatedStepProperties({ steps: [] }, { name: 'db', type: 'apply-component' })).to.deep.equal({
      component: 'db',
    });
    expect(generatedStepProperties(undefined, { name: 'db', type: 'apply-component' })).to.deep.equal({
      component: 'db',
    });
  });
  it('leaves declared steps and other types alone', () => {
    expect(generatedStepProperties({ steps: [{}] }, { name: 'db', type: 'apply-component' })).to.equal(undefined);
    expect(generatedStepProperties({ steps: [] }, { name: 'x', type: 'suspend' })).to.equal(undefined);
  });
});
