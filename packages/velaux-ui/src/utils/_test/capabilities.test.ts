import { expect } from 'chai';

import { allCapabilities, capabilitiesOf } from '../capabilities';

describe('controller capabilities', () => {
  it('are what system_info reports', () => {
    const caps = { velaCoreVersion: 'v1.10.10', reconcileInterval: false, workflowRestart: false };
    expect(capabilitiesOf({ capabilities: caps })).to.deep.equal(caps);
  });

  it('are all assumed from a server that reports none', () => {
    expect(capabilitiesOf({})).to.deep.equal(allCapabilities);
    expect(capabilitiesOf(undefined)).to.deep.equal(allCapabilities);
  });
});
