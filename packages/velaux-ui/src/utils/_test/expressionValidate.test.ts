import { expect } from 'chai';

import { blockingIssue, hasExpression } from '../../extends/ExpressionEditor/completion';

describe('expression validation', () => {
  it('checks only values holding an expression', () => {
    expect(hasExpression('$(source.env.tier)')).to.equal(true);
    expect(hasExpression('prefix-$(context.name)')).to.equal(true);
    expect(hasExpression('2')).to.equal(false);
    expect(hasExpression(2)).to.equal(false);
    expect(hasExpression(undefined)).to.equal(false);
  });
  it('blocks on the first error, never on a warning', () => {
    const typeError = { message: 'this value is string, but the parameter expects int', start: 2, end: 17 };
    expect(blockingIssue([typeError])).to.equal(typeError);
    expect(blockingIssue([{ ...typeError, warning: true }])).to.equal(undefined);
    expect(blockingIssue([{ ...typeError, warning: true }, typeError])).to.equal(typeError);
    expect(blockingIssue(undefined)).to.equal(undefined);
  });
});
