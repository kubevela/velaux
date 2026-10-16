import { expect } from 'chai';

import { isLight, sidebarTheme } from '../theme';

describe('sidebar theme', () => {
  it('tells a pale colour from a dark one', () => {
    expect(isLight('#e6f1f6')).to.equal(true);
    expect(isLight('#fff')).to.equal(true);
    expect(isLight('#111827')).to.equal(false);
    expect(isLight('#00739d')).to.equal(false);
  });

  it('writes dark text on a pale sidebar and light text on a dark one', () => {
    const pale = sidebarTheme('#e6f1f6', '#00739d');
    expect(pale['--sb-bg']).to.equal('#e6f1f6');
    expect(pale['--sb-text-strong']).to.equal('#0f172a');
    expect(pale['--sb-accent']).to.equal('#00739d');
    const dark = sidebarTheme('#111827');
    expect(dark['--sb-text-strong']).to.equal('#f1f5f9');
  });

  it('is the default dark theme without colours', () => {
    expect(sidebarTheme()).to.deep.equal({});
  });
});
