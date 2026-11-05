import 'mocha';
import { assert } from 'chai';

import { quantityToScalar } from '../utils';

describe('test quantityToScalar', () => {
  it('reads CPU quantities in cores', () => {
    assert.equal(quantityToScalar('2'), 2);
    assert.equal(quantityToScalar('250m'), 0.25);
    assert.equal(quantityToScalar('500u'), 0.0005);
    assert.equal(quantityToScalar('5000000n'), 0.005);
  });

  it('gives the CPU usage share metrics-server reports in nanocores', () => {
    const usage = Number(quantityToScalar('25000000n'));
    const request = Number(quantityToScalar('100m'));
    assert.closeTo(usage / request, 0.25, 1e-9);
  });

  it('reads binary and decimal memory quantities in bytes', () => {
    assert.equal(quantityToScalar('64Ki'), BigInt(64 * 1024));
    assert.equal(quantityToScalar('128Mi'), BigInt(128 * 1024 * 1024));
    assert.equal(quantityToScalar('2Gi'), BigInt(2) * BigInt(1024 * 1024 * 1024));
    assert.equal(quantityToScalar('1k'), BigInt(1000));
    assert.equal(quantityToScalar('128M'), BigInt(128 * 1000 * 1000));
    assert.equal(quantityToScalar('1G'), BigInt(1000 * 1000 * 1000));
    assert.equal(quantityToScalar('1T'), BigInt(1000 * 1000 * 1000) * BigInt(1000));
  });

  it('reads an empty quantity as zero', () => {
    assert.equal(quantityToScalar(''), 0);
  });
});
