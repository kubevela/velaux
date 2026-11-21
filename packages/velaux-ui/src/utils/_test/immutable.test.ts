import { expect } from 'chai';
import type { UIParam } from '@velaux/data';

import { immutableLocked } from '../immutable';

const param = (immutable: boolean): UIParam => ({
  jsonKey: 'zone',
  label: 'Zone',
  sort: 100,
  uiType: 'Input',
  validate: { immutable },
});

describe('immutableLocked', () => {
  it('locks a deployed immutable value when editing', () => {
    expect(immutableLocked(param(true), 'edit', true, { zone: 'eu-west-1a' })).to.equal(true);
  });
  it('assumes deployed when the form is not told', () => {
    expect(immutableLocked(param(true), 'edit', undefined, { zone: 'eu-west-1a' })).to.equal(true);
  });
  it('does not lock before the application is deployed', () => {
    expect(immutableLocked(param(true), 'edit', false, { zone: 'eu-west-1a' })).to.equal(false);
  });
  it('does not lock a value that was never set', () => {
    expect(immutableLocked(param(true), 'edit', true, {})).to.equal(false);
    expect(immutableLocked(param(true), 'edit', true, { zone: '' })).to.equal(false);
  });
  it('does not lock a new component or a mutable parameter', () => {
    expect(immutableLocked(param(true), 'new', true, { zone: 'x' })).to.equal(false);
    expect(immutableLocked(param(false), 'edit', true, { zone: 'x' })).to.equal(false);
  });
});
