import { expect } from 'chai';

import {
  forEachProblem,
  forEachWarning,
  itemColumns,
  loopInputs,
  setLoop,
} from '../../components/WorkflowStudio/loop-edit';

const steps = [
  { name: 'shared', type: 'apply-component' },
  {
    name: 'rollout',
    type: 'step-group',
    forEach: {
      items: [
        { name: 'east', cluster: 'a' },
        { name: 'west', replicas: 2 },
      ],
    },
    subSteps: [{ name: 'deploy', type: 'deploy' }],
  },
  { name: 'canary', type: 'deploy', forEach: { items: ['east', 'west'] } },
  { name: 'regions', type: 'step-group', subSteps: [{ name: 'plain', type: 'suspend' }] },
];

describe('setLoop', () => {
  it('makes a step repeat, and stops it repeating', () => {
    const looped = setLoop(steps, 'shared', { items: ['a'] });
    expect(looped[0]).to.deep.equal({ name: 'shared', type: 'apply-component', forEach: { items: ['a'] } });
    expect(looped[1]).to.equal(steps[1]);
    expect(setLoop(looped, 'shared', undefined)[0]).to.deep.equal({ name: 'shared', type: 'apply-component' });
  });
});

describe('loopInputs', () => {
  it("offers a group's steps the item, its index, its key and each key of the items", () => {
    expect(loopInputs(steps, 'deploy')).to.deep.equal([
      'each.item',
      'each.index',
      'each.key',
      'each.item.name',
      'each.item.cluster',
      'each.item.replicas',
    ]);
  });
  it('offers a looped step the item, index and key, with no item keys for scalar items', () => {
    expect(loopInputs(steps, 'canary')).to.deep.equal(['each.item', 'each.index', 'each.key']);
  });
  it('offers nothing outside a loop', () => {
    expect(loopInputs(steps, 'shared')).to.deep.equal([]);
    expect(loopInputs(steps, 'plain')).to.deep.equal([]);
  });
});

describe('itemColumns', () => {
  it('is every key of object items, in first-seen order', () => {
    expect(
      itemColumns([
        { name: 'east', cluster: 'a' },
        { name: 'west', replicas: 2 },
      ])
    ).to.deep.equal(['name', 'cluster', 'replicas']);
  });
  it('is empty for a list of plain values', () => {
    expect(itemColumns(['east', 'west'])).to.deep.equal([]);
  });
});

describe('forEachProblem', () => {
  it('passes a list, a variable or a whole expression', () => {
    expect(forEachProblem({ items: ['east'] })).to.equal(undefined);
    expect(forEachProblem({ from: 'regions' })).to.equal(undefined);
    expect(forEachProblem({ items: '$(source.platform.regions)' })).to.equal(undefined);
  });
  it('names what is missing or wrong', () => {
    expect(forEachProblem({ items: [] })).to.equal('Add at least one item');
    expect(forEachProblem({ from: '' })).to.equal('Pick the output the items come from');
    expect(forEachProblem({ items: 'regions' })).to.equal(
      'An expression is written $( ... ), and gives the whole list'
    );
  });
});

describe('forEachWarning', () => {
  it("warns over the controller's default limit, which a cluster can raise", () => {
    expect(forEachWarning({ items: new Array(50).fill('x') })).to.equal(undefined);
    expect(forEachWarning({ items: new Array(51).fill('x') })).to.equal(
      "Over 50 items, the controller's default limit. The run fails unless the cluster raised it"
    );
  });
});

describe('forEachProblem, keyed', () => {
  const items = [
    { cluster: 'prod', region: 'us', n: 1 },
    { cluster: 'prod', region: 'eu', n: 2 },
  ];
  it('passes a key whose parts name every item uniquely', () => {
    expect(forEachProblem({ items, key: ['cluster', 'region'] })).to.equal(undefined);
    expect(forEachProblem({ items, key: ['n'] })).to.equal(undefined);
  });
  it('names a key part an item lacks, or one that is not a string or integer', () => {
    expect(forEachProblem({ items, key: ['zone'] })).to.equal('Item 0 has no zone');
    expect(forEachProblem({ items: [{ k: 1.5 }], key: ['k'] })).to.equal(
      'In item 0, k must be a string or a whole number'
    );
  });
  it('refuses keys that repeat, or would not make a step name', () => {
    expect(forEachProblem({ items, key: ['cluster'] })).to.equal('Items 0 and 1 have the same key, prod');
    expect(forEachProblem({ items: [{ k: 'Us East' }], key: ['k'] })).to.equal(
      'In item 0, the key Us East is not a step name (lower case letters, digits and -)'
    );
    expect(forEachProblem({ items: [{ k: 'x'.repeat(64) }], key: ['k'] })).to.equal(
      'In item 0, the key is over 63 characters'
    );
  });
});
