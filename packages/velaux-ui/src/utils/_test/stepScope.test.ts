import { expect } from 'chai';

import { scopeParams, stepScope } from '../../components/WorkflowStudio/step-scope';
import type { ExpressionEnv } from '../../extends/ExpressionEditor/completion';
import { suggest } from '../../extends/ExpressionEditor/completion';

const steps = [
  { name: 'names', type: 'make-names', outputs: [{ name: 'list', valueFrom: 'names' }] },
  {
    name: 'rollout',
    type: 'step-group',
    mode: 'StepByStep',
    forEach: { items: [{ region: 'eu' }] },
    subSteps: [{ name: 'deploy', type: 'deploy', outputs: [{ name: 'done', valueFrom: 'ok' }] }],
  },
  { name: 'canary', type: 'deploy', dependsOn: ['names'], forEach: { items: '$(steps.names.outputs.list)' } },
  { name: 'fromVar', type: 'deploy', forEach: { from: 'regions' } },
  { name: 'plain', type: 'suspend' },
];

describe('stepScope', () => {
  it("lists the workflow's steps as it runs them: outputs, dependsOn, loops and groups", () => {
    expect(stepScope(steps, 'plain').steps).to.deep.equal([
      { name: 'names', outputs: ['list'] },
      {
        name: 'rollout',
        outputs: [],
        forEach: true,
        mode: 'StepByStep',
        subSteps: [{ name: 'deploy', outputs: ['done'] }],
      },
      { name: 'canary', outputs: [], dependsOn: ['names'], forEach: true },
      { name: 'fromVar', outputs: [], forEach: true },
      { name: 'plain', outputs: [] },
    ]);
  });

  it("carries how the workflow's steps run", () => {
    const scope = stepScope(steps, 'plain', { mode: 'DAG', subMode: 'StepByStep' });
    expect(scope.mode).to.equal('DAG');
    expect(scope.subMode).to.equal('StepByStep');
    expect(stepScope(steps, 'plain').mode).to.equal(undefined);
  });

  it('makes a looping step a loop body over its items as written', () => {
    const scope = stepScope(steps, 'canary');
    expect(scope.step).to.equal('canary');
    expect(scope.loopBody).to.equal(true);
    expect(scope.forEachItems).to.equal('$(steps.names.outputs.list)');
  });

  it("makes a looping group's sub-step a loop body over the group's items", () => {
    const scope = stepScope(steps, 'deploy');
    expect(scope.loopBody).to.equal(true);
    expect(scope.forEachItems).to.deep.equal([{ region: 'eu' }]);
  });

  it('leaves out items read from a workflow variable, and a group itself', () => {
    const fromVar = stepScope(steps, 'fromVar');
    expect(fromVar.loopBody).to.equal(true);
    expect(fromVar.forEachItems).to.equal(undefined);
    expect(stepScope(steps, 'rollout').loopBody).to.equal(undefined);
    expect(stepScope(steps, 'plain').loopBody).to.equal(undefined);
  });
});

describe('scopeParams', () => {
  it('sends the list and the items as JSON', () => {
    const params = scopeParams(stepScope(steps, 'deploy'));
    expect(params.step).to.equal('deploy');
    expect(params.loopBody).to.equal(true);
    expect(JSON.parse(params.forEachItems as string)).to.deep.equal([{ region: 'eu' }]);
    expect(JSON.parse(params.steps as string)).to.have.length(5);
  });

  it('sends nothing without a scope', () => {
    expect(scopeParams(undefined)).to.deep.equal({});
    expect(scopeParams({}).loopBody).to.equal(undefined);
  });
});

describe('step expression suggestions', () => {
  const env: ExpressionEnv = {
    enabled: true,
    optedIn: true,
    surface: 'workflowstep',
    variables: [
      { name: 'context', type: 'object', children: [] },
      {
        name: 'steps',
        type: 'object',
        children: [
          {
            name: 'names',
            type: 'object',
            children: [{ name: 'outputs', type: 'object', children: [{ name: 'list', type: 'dyn' }] }],
          },
        ],
      },
      {
        name: 'each',
        type: 'object',
        children: [
          { name: 'item', type: 'object', children: [{ name: 'region', type: 'string' }] },
          { name: 'index', type: 'int' },
        ],
      },
    ],
  };
  const labels = (before: string) => suggest(before, env).items.map((i) => i.label);

  it('lists the steps and each roots the server offers a step', () => {
    expect(labels('$(')).to.include.members(['steps', 'each']);
    expect(labels('$(steps.names.outputs.')).to.deep.equal(['list']);
    expect(labels('$(each.')).to.deep.equal(['item', 'index']);
    expect(labels('$(each.item.')).to.include('region');
  });
});
