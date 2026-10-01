import 'mocha';
import { assert } from 'chai';

import { transComponentDefinitions } from '../utils';

describe('component type groups', () => {
  it('leaves out a group with no types', () => {
    const groups = transComponentDefinitions([{ name: 'webapp' } as any]);
    assert.deepEqual(
      groups.map((g) => g.label),
      ['Custom']
    );
  });

  it('keeps the groups in order where each has types', () => {
    const groups = transComponentDefinitions([
      { name: 'webapp' } as any,
      { name: 'webservice' } as any,
      { name: 'rds', workloadType: 'configurations.terraform.core.oam.dev' } as any,
    ]);
    assert.deepEqual(
      groups.map((g) => g.label),
      ['Core', 'Custom', 'Cloud']
    );
  });
});
