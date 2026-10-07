import { expect } from 'chai';

import type { ExpressionEnv } from '../../extends/ExpressionEditor/completion';
import { expressionSpans, hoverAt, openExpression, suggest } from '../../extends/ExpressionEditor/completion';

const env: ExpressionEnv = {
  enabled: true,
  optedIn: true,
  surface: 'component',
  variables: [
    {
      name: 'context',
      type: 'object',
      children: [
        { name: 'appName', type: 'string', description: 'The application name' },
        { name: 'clusterVersion', type: 'object', children: [{ name: 'minor', type: 'int' }] },
        { name: 'appLabels', type: 'map(string, string)' },
      ],
    },
    {
      name: 'source',
      type: 'object',
      children: [{ name: 'db', type: 'object', children: [{ name: 'host', type: 'string' }] }],
    },
  ],
};

const labels = (before: string) => suggest(before, env).items.map((i) => i.label);

describe('expression suggestions', () => {
  it('offers to start an expression outside one', () => {
    expect(labels('http://')).to.deep.equal(['$( )']);
    expect(labels('$(context.appName) done')).to.deep.equal(['$( )']);
  });
  it('offers the roots and functions at the start of an expression', () => {
    expect(labels('$(')).to.include.members(['context', 'source', 'has', 'int']);
  });
  it('offers the fields of what precedes a dot', () => {
    expect(labels('$(context.')).to.include.members(['appName', 'clusterVersion']);
    expect(labels('$(context.clusterVersion.')).to.deep.equal(['minor']);
    expect(labels('x-$(source.db.')).to.deep.equal(['host']);
  });
  it('replaces the part of a name already typed', () => {
    expect(suggest('$(context.app', env).replace).to.equal(3);
  });
  it('offers the methods of a string', () => {
    expect(labels('$(context.appName.')).to.include.members(['startsWith', 'lowerAscii']);
  });
  it('knows when a quoted paren does not close the expression', () => {
    expect(openExpression('$(context.appName == ")"')).to.equal(2);
    expect(openExpression('$(a) and $$(b')).to.equal(undefined);
  });
});

describe('expression spans', () => {
  it('frames each expression, parens and all', () => {
    expect(expressionSpans('img/$(context.appName):$(string(context.appRevisionNum))')).to.deep.equal([
      [4, 22],
      [23, 56],
    ]);
  });
  it('ignores a paren inside quotes and an escaped $$(', () => {
    expect(expressionSpans('$(a == ")") $$(b)')).to.deep.equal([[0, 11]]);
  });
  it('runs an unclosed expression to the end', () => {
    expect(expressionSpans('x $(context.')).to.deep.equal([[2, 12]]);
  });
});

describe('expression hover', () => {
  const value = 'img/$(context.clusterVersion.minor)';
  it('names the hovered field with the path before it', () => {
    const at = value.indexOf('minor') + 2;
    const hovered = hoverAt(value, at, env);
    expect(hovered?.path).to.deep.equal(['context', 'clusterVersion', 'minor']);
    expect(hovered?.variable.type).to.equal('int');
    expect([hovered?.start, hovered?.end]).to.deep.equal([value.indexOf('minor'), value.indexOf('minor') + 5]);
  });
  it('names a segment in the middle of a chain', () => {
    expect(hoverAt(value, value.indexOf('clusterVersion') + 1, env)?.path).to.deep.equal(['context', 'clusterVersion']);
  });
  it('names nothing outside an expression or for an unknown name', () => {
    expect(hoverAt(value, 1, env)).to.equal(undefined);
    expect(hoverAt('$(context.nope)', 11, env)).to.equal(undefined);
  });
});
