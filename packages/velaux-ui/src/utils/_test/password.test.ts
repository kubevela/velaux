import { expect } from 'chai';

import { checkUserPassword } from '../common';

describe('checkUserPassword', () => {
  it('accepts 8-16 characters with a letter and a number, symbols included', () => {
    ['abcdefg1', 'Passw0rd!', 'p@ss-w0rd_#2026', 'a1b2c3d4e5f6g7h8'].forEach((p) =>
      expect(checkUserPassword.test(p), p).to.equal(true)
    );
  });

  it('refuses a password without a letter, without a number, or outside 8-16 characters', () => {
    ['12345678', 'abcdefgh', '!!!!!!!!1', 'abc1', 'a1b2c3d4e5f6g7h8i'].forEach((p) =>
      expect(checkUserPassword.test(p), p).to.equal(false)
    );
  });
});
