import { expect } from 'chai';

import { clusterTooltip, resourceTooltip, targetTooltip, traitTooltip } from '../../components/TreeGraph/tooltip';

describe('graph tooltips', () => {
  it('summarises a resource with its health and message', () => {
    expect(
      resourceTooltip({
        name: 'web',
        kind: 'Deployment',
        apiVersion: 'apps/v1',
        namespace: 'shop',
        cluster: 'east',
        healthStatus: { statusCode: 'UnHealthy', reason: 'ProgressDeadlineExceeded', message: '0/2 ready' },
      })
    ).to.deep.equal({
      title: 'web',
      healthy: false,
      progressing: false,
      summary: [
        { key: 'Kind', value: 'Deployment' },
        { key: 'API Version', value: 'apps/v1' },
        { key: 'Namespace', value: 'shop' },
        { key: 'Cluster', value: 'east' },
        { key: 'Reason', value: 'ProgressDeadlineExceeded' },
      ],
      message: '0/2 ready',
    });
  });

  it('reads progressing as neither healthy nor unhealthy, and unknown health as none', () => {
    const progressing = resourceTooltip({
      name: 'web',
      kind: 'Deployment',
      healthStatus: { statusCode: 'Progressing', reason: '', message: '' },
    });
    expect(progressing.progressing).to.equal(true);
    expect(progressing.healthy).to.equal(undefined);
    const unknown = resourceTooltip({ name: 'cfg', kind: 'ConfigMap' });
    expect(unknown.healthy).to.equal(undefined);
    expect(unknown.progressing).to.equal(false);
  });

  it('adds a pod its status, readiness, restarts and age', () => {
    const pod = resourceTooltip({
      name: 'web-1',
      kind: 'Pod',
      namespace: 'shop',
      healthStatus: { statusCode: 'Healthy', reason: '', message: '' },
      additionalInfo: { Status: 'Running', Ready: '1/1', Restarts: 0, Age: '5m' },
    });
    expect(pod.healthy).to.equal(true);
    expect(pod.summary).to.deep.include.members([
      { key: 'Status', value: 'Running' },
      { key: 'Ready', value: '1/1' },
      { key: 'Restarts', value: '0' },
      { key: 'Age', value: '5m' },
    ]);
  });

  it('summarises a cluster and a target', () => {
    expect(clusterTooltip('east')).to.deep.equal({ title: 'east', summary: [{ key: 'Kind', value: 'Cluster' }] });
    expect(targetTooltip('east/shop')).to.deep.equal({
      title: 'east/shop',
      summary: [
        { key: 'Cluster', value: 'east' },
        { key: 'Namespace', value: 'shop' },
      ],
    });
  });

  it('gives every trait an overlay, pending or not', () => {
    expect(traitTooltip({ type: 'scaler', healthy: true })).to.deep.equal({
      title: 'scaler',
      healthy: true,
      pending: undefined,
      summary: [{ key: 'Kind', value: 'Trait' }],
      message: undefined,
      details: undefined,
    });
    expect(
      traitTooltip({ type: 'gateway', healthy: false, pending: true, message: 'waits for the workload' }).pending
    ).to.equal(true);
  });
});
