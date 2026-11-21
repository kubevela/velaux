import { expect } from 'chai';

import { resourceOrigin } from '../../pages/ApplicationStatus/components/ApplicationGraph/origins';

describe('resourceOrigin', () => {
  const components: any[] = [
    { name: 'payments-api', componentType: 'webapp@v1.1.0' },
    { name: 'payments-receipts', componentType: 'aws-s3' },
  ];
  it("names the component that applied a resource, and that component's type", () => {
    expect(resourceOrigin({ name: 'web', component: 'payments-receipts', latest: true }, components)).to.deep.equal({
      component: 'payments-receipts',
      type: 'aws-s3',
    });
  });
  it('names the trait that applied it, where a trait did', () => {
    expect(
      resourceOrigin({ name: 'hpa', component: 'payments-api', trait: 'cpuscaler', latest: true }, components)
    ).to.deep.equal({ component: 'payments-api', type: 'webapp@v1.1.0', trait: 'cpuscaler' });
  });
  it("counts a resource the component's own template outputs as the component's, not a trait's", () => {
    expect(
      resourceOrigin({ name: 'svc', component: 'payments-api', trait: 'AuxiliaryWorkload', latest: true }, components)
    ).to.deep.equal({ component: 'payments-api', type: 'webapp@v1.1.0' });
  });
  it('leaves the type out for a component the application no longer lists', () => {
    expect(resourceOrigin({ name: 'old', component: 'gone', latest: true }, components)).to.deep.equal({
      component: 'gone',
    });
  });
  it('has no origin for a resource no component applied', () => {
    expect(resourceOrigin({ name: 'x', component: '', latest: true }, components)).to.equal(undefined);
  });

  describe('health', () => {
    const services: any[] = [
      {
        name: 'payments-api',
        namespace: 'shop-prod',
        cluster: 'local',
        healthy: true,
        message: '',
        traits: [{ type: 'cpuscaler', healthy: false, message: 'no metrics' }],
      },
    ];
    it("carries the component's health, and its trait's", () => {
      const origin = resourceOrigin(
        { name: 'hpa', component: 'payments-api', trait: 'cpuscaler', cluster: 'local', latest: true },
        components,
        services
      );
      expect(origin).to.include({ healthy: true, traitHealthy: false, traitMessage: 'no metrics' });
    });
    it('leaves health unknown for a component with no status on that cluster', () => {
      const origin = resourceOrigin(
        { name: 'web', component: 'payments-api', cluster: 'eu-1', latest: true },
        components,
        services
      );
      expect(origin?.healthy).to.equal(undefined);
    });
  });
});
