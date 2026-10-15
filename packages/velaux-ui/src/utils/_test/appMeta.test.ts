import { expect } from 'chai';

import { isDefaultDescription, syncInfo, visibleLabels } from '../appMeta';
import { beautifyTime } from '../common';

describe('application labels', () => {
  const labels = {
    'app.oam.dev/source-of-truth': 'from-k8s-resource',
    'ux.oam.dev/from-namespace': 'vela-system',
    'ux.oam.dev/synced-generation': '38',
    'ux.oam.dev/synced-revision': 'storefront-v2',
    team: 'shop',
    'app.oam.dev/owner': 'platform',
  };

  it('leaves out the labels VelaUX keeps for itself', () => {
    expect(visibleLabels(labels)).to.deep.equal(['team', 'app.oam.dev/owner']);
    expect(visibleLabels(undefined)).to.deep.equal([]);
  });

  it('reads what they say about the sync', () => {
    expect(syncInfo(labels)).to.deep.equal({
      fromCluster: true,
      namespace: 'vela-system',
      revision: 'storefront-v2',
      generation: '38',
    });
    expect(syncInfo({ 'app.oam.dev/source-of-truth': 'from-velaux' }).fromCluster).to.equal(false);
    expect(syncInfo(undefined)).to.deep.equal({ fromCluster: false });
  });
});

describe('application descriptions', () => {
  it('knows the one the sync writes', () => {
    expect(isDefaultDescription('Automatically converted from KubeVela Application in Kubernetes.')).to.equal(true);
    expect(isDefaultDescription('Checkout App')).to.equal(false);
    expect(isDefaultDescription(undefined)).to.equal(false);
  });
});

describe('beautifyTime', () => {
  const ago = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();
  it('says one of a unit in the singular', () => {
    expect(beautifyTime(ago(3600))).to.equal('1 hour ago');
    expect(beautifyTime(ago(60))).to.equal('1 minute ago');
    expect(beautifyTime(ago(86400))).to.equal('1 day ago');
  });
  it('says more in the plural', () => {
    expect(beautifyTime(ago(7200))).to.equal('2 hours ago');
  });
});
