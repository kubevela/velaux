import 'mocha';
import { assert } from 'chai';
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
