import { expect } from 'chai';

import { menuShown } from '../menus';

describe('menuShown', () => {
  it('shows a menu that is built', () => {
    expect(menuShown({}, {})).to.equal(true);
    expect(menuShown({ comingSoon: false }, {})).to.equal(true);
  });

  it('shows what is coming only when the customisation asks for it', () => {
    expect(menuShown({ comingSoon: true }, {})).to.equal(false);
    expect(menuShown({ comingSoon: true }, { showComingSoon: false })).to.equal(false);
    expect(menuShown({ comingSoon: true }, { showComingSoon: true })).to.equal(true);
  });
});
