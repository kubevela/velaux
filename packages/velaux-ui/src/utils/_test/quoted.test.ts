import 'mocha';
import { assert } from 'chai';

import { splitQuoted } from '../quoted';

describe('test splitQuoted', () => {
  it('splits a message on its double-quoted values', () => {
    assert.deepEqual(splitQuoted('ComponentDefinition "webservice" in namespace "team-dev" is using 1 of 1.'), [
      { text: 'ComponentDefinition ', quoted: false },
      { text: 'webservice', quoted: true },
      { text: ' in namespace ', quoted: false },
      { text: 'team-dev', quoted: true },
      { text: ' is using 1 of 1.', quoted: false },
    ]);
  });

  it('keeps text with no quotes, or an unpaired quote, as it is', () => {
    assert.deepEqual(splitQuoted('no quotes here'), [{ text: 'no quotes here', quoted: false }]);
    assert.deepEqual(splitQuoted('a "b'), [{ text: 'a "b', quoted: false }]);
    assert.deepEqual(splitQuoted(''), []);
  });
});
