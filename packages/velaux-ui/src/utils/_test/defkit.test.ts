import { expect } from 'chai';

import {
  addonMissing,
  apiMessage,
  autoText,
  gitCredentials,
  helpUnlessError,
  intervalError,
  rekeyOverrides,
  sequence,
  stepLabel,
  definitionLink,
  durationMs,
  minIntervalMs,
  repositoryOptions,
  stepTone,
  withOverride,
  groupPreview,
  parseSource,
  sourceText,
} from '../../pages/DefKitModules/defkit';

describe('defkit', () => {
  it('links a definition to its page by kind', () => {
    expect(definitionLink('TraitDefinition', 'scaler')).to.equal('/definitions/trait/scaler/doc');
    expect(definitionLink('WorkflowStepDefinition', 'deploy')).to.equal('/definitions/workflowstep/deploy/doc');
  });

  it('reads a URL as a git repository and anything else as a Go module', () => {
    expect(parseSource(' https://github.com/org/defs ', 'main', '', [])).to.deep.equal({
      git: 'https://github.com/org/defs',
      version: 'main',
      prefix: undefined,
      types: undefined,
    });
    expect(parseSource('github.com/org/defs', '', 'dk-', ['trait'])).to.deep.equal({
      ref: 'github.com/org/defs',
      version: undefined,
      prefix: 'dk-',
      types: ['trait'],
    });
    expect(parseSource('git@github.com:org/defs.git', '', '', []).git).to.equal('git@github.com:org/defs.git');
  });

  it('shows a source with its version', () => {
    expect(sourceText({ git: 'https://x/defs', version: 'v1' })).to.equal('https://x/defs@v1');
    expect(sourceText({ ref: 'github.com/org/defs' })).to.equal('github.com/org/defs');
  });

  it('puts what the review decides first and drops empty groups', () => {
    const groups = groupPreview([
      { kind: 'TraitDefinition', name: 'b', status: 'new' },
      { kind: 'TraitDefinition', name: 'a', status: 'new' },
      { kind: 'TraitDefinition', name: 'c', status: 'conflict' },
      { kind: 'TraitDefinition', name: 'd', status: 'unchanged' },
    ]);
    expect(groups.map((g) => g.status)).to.deep.equal(['conflict', 'new', 'unchanged']);
    expect(groups[1].items.map((i) => i.name)).to.deep.equal(['a', 'b']);
  });

  it('sets and clears a definition override', () => {
    const one = withOverride({ deletionPolicy: 'retain' }, 'TraitDefinition/x', 'delete');
    expect(one.overrides).to.deep.equal({ 'TraitDefinition/x': 'delete' });
    expect(withOverride(one, 'TraitDefinition/x', undefined).overrides).to.equal(undefined);
  });

  it('says how often a module updates itself', () => {
    expect(autoText({ autoUpdate: true })).to.equal('10m');
    expect(autoText({ autoUpdate: true, interval: '1h' })).to.equal('1h');
    expect(autoText({ interval: '1h' })).to.equal('');
  });

  it('reads a duration and holds the 5m minimum', () => {
    expect(durationMs('1h30m')).to.equal(5400000);
    expect(durationMs(' 10m ')).to.equal(600000);
    expect(durationMs('soon')).to.equal(undefined);
    expect(durationMs('4m59s')! < minIntervalMs).to.equal(true);
    expect(durationMs('5m')! >= minIntervalMs).to.equal(true);
  });

  it('colours a workflow step by its phase', () => {
    expect(stepTone('succeeded')).to.equal('healthy');
    expect(stepTone('suspending')).to.equal('suspended');
    expect(stepTone('skipped')).to.equal('neutral');
  });

  it('offers built-in repositories by name, filling in their address', () => {
    expect(
      repositoryOptions([
        { name: 'KubeVela definitions', git: 'https://github.com/kubevela/vela-go-definitions', version: 'main' },
        { name: 'Team defs', ref: 'github.com/org/defs' },
        { name: 'Broken' },
      ])
    ).to.deep.equal([
      {
        value: 'https://github.com/kubevela/vela-go-definitions',
        label: 'KubeVela definitions · https://github.com/kubevela/vela-go-definitions',
      },
      { value: 'github.com/org/defs', label: 'Team defs · github.com/org/defs' },
    ]);
  });

  it('rekeys overrides to a new prefix', () => {
    expect(
      rekeyOverrides({ 'TraitDefinition/dk-scaler': 'delete', 'ComponentDefinition/dk-web': 'retain' }, 'dk-', 'my-')
    ).to.deep.equal({ 'TraitDefinition/my-scaler': 'delete', 'ComponentDefinition/my-web': 'retain' });
    expect(rekeyOverrides({ 'TraitDefinition/scaler': 'delete' }, '', 'my-')).to.deep.equal({
      'TraitDefinition/my-scaler': 'delete',
    });
    expect(rekeyOverrides({ 'TraitDefinition/my-scaler': 'delete' }, 'my-', '')).to.deep.equal({
      'TraitDefinition/scaler': 'delete',
    });
    expect(rekeyOverrides({ 'TraitDefinition/other': 'delete' }, 'dk-', 'my-')).to.deep.equal({
      'TraitDefinition/other': 'delete',
    });
    expect(rekeyOverrides(undefined, 'dk-', 'my-')).to.equal(undefined);
  });

  it('labels a workflow step phase for translation', () => {
    expect(stepLabel('succeeded')).to.equal('Succeeded');
    expect(stepLabel('suspending')).to.equal('Suspended');
    expect(stepLabel(undefined)).to.equal('Pending');
    expect(stepLabel('custom')).to.equal('custom');
  });

  it('checks the auto update interval as the dialog does', () => {
    expect(intervalError('10m')).to.equal(undefined);
    expect(intervalError('5m')).to.equal(undefined);
    expect(intervalError('4m59s')).to.equal('At least 5m');
    expect(intervalError('300s')).to.equal(undefined);
    expect(intervalError('soon')).to.equal('A duration such as 10m or 1h');
    expect(intervalError('')).to.equal('A duration such as 10m or 1h');
  });

  it('spots credentials in a git URL', () => {
    expect(gitCredentials('https://user:token@github.com/org/defs')).to.equal(true);
    expect(gitCredentials(' https://token@github.com/org/defs ')).to.equal(true);
    expect(gitCredentials('https://github.com/org/defs')).to.equal(false);
    expect(gitCredentials('https://github.com/org/defs@main')).to.equal(false);
    expect(gitCredentials('git@github.com:org/defs.git')).to.equal(false);
    expect(gitCredentials('github.com/org/defs')).to.equal(false);
  });

  it('keeps only the latest reply, and none after a stop', () => {
    const seq = sequence();
    const first = seq.next();
    const second = seq.next();
    expect(seq.current(first)).to.equal(false);
    expect(seq.current(second)).to.equal(true);
    seq.stop();
    expect(seq.current(second)).to.equal(false);
    seq.start();
    expect(seq.current(seq.next())).to.equal(true);
  });

  it('reads the addon as missing only when a reply says so', () => {
    expect(addonMissing({ addonEnabled: false })).to.equal(true);
    expect(addonMissing({ addonEnabled: true })).to.equal(false);
    expect(addonMissing({})).to.equal(false);
    expect(addonMissing(undefined)).to.equal(false);
  });

  it('reads the message of a failed request', () => {
    expect(apiMessage({ BusinessCode: 23008, Message: 'private repositories are not supported' })).to.equal(
      'private repositories are not supported'
    );
    expect(apiMessage(undefined)).to.equal(undefined);
  });
});

describe('helpUnlessError', () => {
  it('drops the help while the field has an error, so the error shows in its place', () => {
    expect(helpUnlessError(['Remove the credentials from the URL'], 'Pick a repository')).to.equal(undefined);
  });
  it('keeps the help while the field is valid', () => {
    expect(helpUnlessError(null, 'Pick a repository')).to.equal('Pick a repository');
    expect(helpUnlessError([], 'Pick a repository')).to.equal('Pick a repository');
  });
});
