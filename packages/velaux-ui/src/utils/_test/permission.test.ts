import 'mocha';
import { assert } from 'chai';

import { equalArray } from '../common';
import { resourceMatch, ResourceName } from '../permission';

describe('test permission', () => {
  it('test resourceMatch', () => {
    assert.equal(resourceMatch(new ResourceName('project:*'), new ResourceName('project:*')), true);
    assert.equal(
      resourceMatch(
        new ResourceName('projects:abc/application:bcd'),
        new ResourceName('projects:*/application:*'),
      ),
      true,
    );
  });
});

describe('test util', () => {
  it('test equal the array', () => {
    assert.equal(equalArray(['a', 'b'], ['b', 'a']), true);
    assert.equal(equalArray(['b'], ['b', 'a']), false);
    assert.equal(equalArray(undefined, ['b', 'a']), false);
  });
});
