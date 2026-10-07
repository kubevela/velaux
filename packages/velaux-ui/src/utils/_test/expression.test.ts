import { expect } from 'chai';

import type { ExpressionEnv } from '../../extends/ExpressionEditor/completion';
import { expressionSpans, fixesFor, hoverAt, openExpression, suggest } from '../../extends/ExpressionEditor/completion';

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
  it('offers to start an expression only once a $ is typed, replacing it', () => {
    expect(labels('http://')).to.deep.equal([]);
    expect(labels('$(context.appName) done')).to.deep.equal([]);
    expect(labels('http://$')).to.deep.equal(['$( )']);
    expect(suggest('http://$', env).replace).to.equal(1);
    expect(labels('$(context.appName) and $')).to.deep.equal(['$( )']);
  });
  it('offers nothing after $$, which writes a literal $(', () => {
    expect(labels('cost $$')).to.deep.equal([]);
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

describe('component read suggestions', () => {
  const withComponents: ExpressionEnv = {
    ...env,
    variables: [
      ...(env.variables || []),
      {
        name: 'component',
        type: 'object',
        children: [
          {
            name: 'db',
            type: 'object',
            children: [
              {
                name: 'output',
                type: 'object',
                children: [{ name: 'data', type: 'object', children: [{ name: 'host', type: 'string' }] }],
              },
              { name: 'outputs', type: 'object' },
            ],
          },
        ],
      },
    ],
  };
  const items = (before: string) => suggest(before, withComponents).items.map((i) => i.label);

  it('offers a component its output and the placements it can be read at', () => {
    expect(items('$(component.db.')).to.deep.equal(['output', 'outputs', 'cluster', 'namespace']);
  });
  it('reads through a placement call to the output beyond it', () => {
    expect(items('$(component.db.cluster("east").')).to.deep.equal(['output', 'outputs', 'namespace']);
    expect(items('$(component.db.cluster("east").namespace("orders").output.data.')).to.deep.equal(['host']);
  });
  it('offers no placement anywhere but straight after the component', () => {
    expect(items('$(component.db.output.')).to.deep.equal(['data']);
  });
  it('hovers a field read past a placement call', () => {
    const text = '$(component.db.namespace("orders").output.data.host)';
    expect(hoverAt(text, text.indexOf('host'), withComponents)?.path).to.deep.equal([
      'component',
      'db',
      'output',
      'data',
      'host',
    ]);
  });
});

describe('hyphenated component names', () => {
  const env2: ExpressionEnv = {
    enabled: true,
    optedIn: true,
    surface: 'component',
    variables: [
      {
        name: 'component',
        type: 'object',
        children: [
          { name: 'db', type: 'object', children: [{ name: 'output', type: 'object' }] },
          {
            name: 'my-db',
            type: 'object',
            children: [
              {
                name: 'output',
                type: 'object',
                children: [{ name: 'data', type: 'object', children: [{ name: 'host', type: 'string' }] }],
              },
              { name: 'outputs', type: 'object' },
            ],
          },
        ],
      },
    ],
  };
  const items = (before: string) => suggest(before, env2).items;

  it('inserts a name that is not an identifier by index, replacing the dot', () => {
    const myDb = items('$(component.').find((i) => i.label === 'my-db');
    expect(myDb?.insertText).to.equal('["my-db"]');
    expect(myDb?.replaceBefore).to.equal(1);
    const db = items('$(component.').find((i) => i.label === 'db');
    expect(db?.insertText).to.equal('db');
    expect(db?.replaceBefore).to.equal(undefined);
  });
  it('reads through an index to the fields beyond it', () => {
    expect(items('$(component["my-db"].').map((i) => i.label)).to.deep.equal([
      'output',
      'outputs',
      'cluster',
      'namespace',
    ]);
    expect(items('$(component["my-db"].cluster("east").output.data.').map((i) => i.label)).to.deep.equal(['host']);
  });
  it('hovers a field read past an index', () => {
    const text = '$(component["my-db"].output.data.host)';
    expect(hoverAt(text, text.indexOf('host'), env2)?.path).to.deep.equal([
      'component',
      'my-db',
      'output',
      'data',
      'host',
    ]);
  });
});

describe('quick fixes', () => {
  it('finds the fix for a marker by where it starts and what it says', () => {
    const fixes = [
      { start: 2, end: 17, text: 'component["my-db"]', message: 'write component["my-db"]: ...' },
      { start: 30, end: 40, text: 'other', message: 'other issue' },
    ];
    expect(
      fixesFor([{ startColumn: 3, message: 'write component["my-db"]: ...' }], fixes).map((f) => f.text)
    ).to.deep.equal(['component["my-db"]']);
    expect(fixesFor([{ startColumn: 3, message: 'different' }], fixes)).to.deep.equal([]);
  });
});
