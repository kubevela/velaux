import { expect } from 'chai';

import { componentOriginTooltip, resourceTooltip, traitOriginTooltip } from '../../components/TreeGraph/tooltip';

const entry = (props: { summary?: Array<{ key: string; value: string }> }, key: string) =>
  props.summary?.find((e) => e.key === key)?.value;

describe('origin tooltips', () => {
  const origin = { component: 'storefront-web', type: 'webapp@v1.1.0', trait: 'cpuscaler' };

  it('describes the component alone: its type and revision', () => {
    const props = componentOriginTooltip(origin, 'latest (1.1.0 / v5)');
    expect(props.title).to.equal('storefront-web');
    expect(entry(props, 'Type')).to.equal('webapp');
    expect(entry(props, 'Revision')).to.equal('latest (1.1.0 / v5)');
    expect(entry(props, 'Trait')).to.equal(undefined);
  });

  it('describes the trait, on its component, with its revision', () => {
    const props = traitOriginTooltip(origin, 'latest (v3)');
    expect(props.title).to.equal('cpuscaler');
    expect(props.on).to.equal('storefront-web');
    expect(entry(props, 'Revision')).to.equal('latest (v3)');
    expect(entry(props, 'Type')).to.equal(undefined);
  });

  it("keeps a resource's own tooltip to the resource", () => {
    const props = resourceTooltip({ name: 'storefront-web', kind: 'HorizontalPodAutoscaler' });
    expect(entry(props, 'Component')).to.equal(undefined);
  });

  it("gives each card its own thing's health", () => {
    const withHealth = { ...origin, healthy: true, traitHealthy: false, traitPending: true, traitMessage: 'waiting' };
    expect(componentOriginTooltip(withHealth, 'v5').healthy).to.equal(true);
    const trait = traitOriginTooltip(withHealth, 'v3');
    expect(trait.healthy).to.equal(false);
    expect(trait.pending).to.equal(true);
    expect(trait.message).to.equal('waiting');
  });

  it("says where a resource's health came from, where kstatus read it", () => {
    const read = resourceTooltip({
      name: 'web',
      kind: 'Deployment',
      healthStatus: { statusCode: 'Healthy', reason: 'Current', message: '', source: 'kstatus' },
    });
    expect(read.healthSource).to.equal('kstatus');
    const own = resourceTooltip({
      name: 'web-1',
      kind: 'Pod',
      healthStatus: { statusCode: 'Healthy', reason: '', message: '' },
    });
    expect(own.healthSource).to.equal(undefined);
  });
});
