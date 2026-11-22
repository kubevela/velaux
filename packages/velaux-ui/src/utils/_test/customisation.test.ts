import { expect } from 'chai';

import { previewOf } from '../customisation';

describe('previewOf', () => {
  const stored = {
    pageTitle: 'Acme',
    logoURL: '/logo.svg',
    sidebarColor: '#e6f1f6',
    accentColor: '#00739d',
    terminology: { Cluster: { singular: 'Region', plural: 'Regions' } },
    resourceVersion: '7',
  };

  it('shows the draft over what is stored', () => {
    const p = previewOf(stored, {
      pageTitle: 'Beta',
      logoURL: 'https://example.com/b.svg',
      iconURL: 'data:image/png;base64,AA',
      sidebarColor: '#111',
      accentColor: '#3b82f6',
      showComingSoon: true,
    });
    expect(p).to.deep.equal({
      ...stored,
      pageTitle: 'Beta',
      logoURL: 'https://example.com/b.svg',
      iconURL: 'data:image/png;base64,AA',
      sidebarColor: '#111',
      accentColor: '#3b82f6',
      showComingSoon: true,
    });
  });

  it('keeps what is stored for a value not ready to show', () => {
    const p = previewOf(stored, {
      pageTitle: 'one\ntwo',
      logoURL: 'javascript:alert(1)',
      sidebarColor: '#12',
      accentColor: 'red',
    });
    expect(p.pageTitle).to.equal('Acme');
    expect(p.logoURL).to.equal('/logo.svg');
    expect(p.sidebarColor).to.equal('#e6f1f6');
    expect(p.accentColor).to.equal('#00739d');
  });

  it('shows a cleared value as the default', () => {
    const p = previewOf(stored, { pageTitle: '  ', logoURL: '', sidebarColor: '', showComingSoon: false });
    expect(p.pageTitle).to.equal(undefined);
    expect(p.logoURL).to.equal(undefined);
    expect(p.sidebarColor).to.equal(undefined);
    expect(p.showComingSoon).to.equal(false);
  });

  it('leaves the terminology as stored', () => {
    expect(previewOf(stored, {}).terminology).to.deep.equal(stored.terminology);
  });
});
