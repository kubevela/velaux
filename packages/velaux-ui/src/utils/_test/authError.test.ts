import { expect } from 'chai';

import { signedOutTitle } from '../authError';

describe('signedOutTitle', () => {
  it('names the session ending when the server ended it', () => {
    expect(signedOutTitle(12013)).to.equal('Your session has ended(12013)');
  });
  it('names an invalid token as invalid', () => {
    expect(signedOutTitle(12004)).to.equal('The token is invalid(12004)');
  });
  it('names an expired refresh token, or a refresh that failed, as expired', () => {
    expect(signedOutTitle(12010)).to.equal('The token is expired(12010)');
    expect(signedOutTitle(undefined)).to.equal('The token is expired(12010)');
  });
});
