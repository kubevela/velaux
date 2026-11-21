import { expect } from 'chai';

import { asManifest } from '../manifest';

describe('asManifest', () => {
  it('writes an Application with its apiVersion and kind first, without empty server fields', () => {
    const got = asManifest('metadata:\n  creationTimestamp: null\n  name: shop\nspec:\n  components: []\n');
    expect(got).to.equal(
      'apiVersion: core.oam.dev/v1beta1\nkind: Application\nmetadata:\n  name: shop\nspec:\n  components: []\n'
    );
  });

  it('keeps an apiVersion and kind already there', () => {
    const got = asManifest('apiVersion: core.oam.dev/v1beta1\nkind: Application\nmetadata:\n  name: shop\n');
    expect(got.startsWith('apiVersion: core.oam.dev/v1beta1\nkind: Application\nmetadata:')).to.equal(true);
  });

  it('returns what it cannot read as it is', () => {
    expect(asManifest('{ not: [yaml')).to.equal('{ not: [yaml');
    expect(asManifest('')).to.equal('');
  });
});
