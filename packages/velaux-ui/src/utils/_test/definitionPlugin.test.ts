import 'mocha';
import { assert } from 'chai';
import type { PluginMeta } from '@velaux/data';
import { createDefinitionPluginFinder, definitionKind, matchDefinitionPlugin } from '../definitionPlugin';

function meta(id: string, extra: Partial<PluginMeta> = {}): PluginMeta {
  return {
    id,
    name: id,
    type: 'definition',
    module: `plugins/${id}/module`,
    baseUrl: `public/plugins/${id}`,
    definitions: [{ kind: 'policy', name: 'topology' }],
    ...extra,
  } as unknown as PluginMeta;
}

describe('definitionKind', () => {
  it('maps the form definition types to plugin kinds', () => {
    assert.equal(definitionKind('component'), 'component');
    assert.equal(definitionKind('trait'), 'trait');
    assert.equal(definitionKind('policy'), 'policy');
    assert.equal(definitionKind('source'), 'source');
    assert.equal(definitionKind('workflowstep'), 'workflow-step');
    assert.equal(definitionKind('workflow-step'), 'workflow-step');
  });
  it('has no kind for anything else', () => {
    assert.isUndefined(definitionKind('addon'));
    assert.isUndefined(definitionKind(undefined));
  });
});

describe('matchDefinitionPlugin', () => {
  it('finds the plugin that lists the definition', () => {
    assert.equal(matchDefinitionPlugin([meta('picker')], 'policy', 'topology')?.id, 'picker');
  });
  it('needs both the kind and the name to match', () => {
    assert.isUndefined(matchDefinitionPlugin([meta('picker')], 'trait', 'topology'));
    assert.isUndefined(matchDefinitionPlugin([meta('picker')], 'policy', 'override'));
  });
  it('skips disabled plugins and plugins of other types', () => {
    assert.isUndefined(matchDefinitionPlugin([meta('picker', { enabled: false })], 'policy', 'topology'));
    assert.isUndefined(matchDefinitionPlugin([meta('picker', { type: 'page-app' } as any)], 'policy', 'topology'));
  });
  it('takes the first plugin when two list the same definition', () => {
    assert.equal(matchDefinitionPlugin([meta('first'), meta('second')], 'policy', 'topology')?.id, 'first');
  });
});

describe('createDefinitionPluginFinder', () => {
  it('loads the matching plugin once and lists plugins once', async () => {
    let lists = 0;
    let loads = 0;
    const find = createDefinitionPluginFinder(
      () => {
        lists++;
        return Promise.resolve([meta('picker')]);
      },
      (m) => {
        loads++;
        return Promise.resolve({ meta: m, form: () => null });
      }
    );
    const first = await find('policy', 'topology');
    const second = await find('policy', 'topology');
    assert.equal(first.status, 'loaded');
    assert.equal(second.status, 'loaded');
    assert.equal(lists, 1);
    assert.equal(loads, 1);
  });
  it('reports none when no plugin lists the definition', async () => {
    const find = createDefinitionPluginFinder(
      () => Promise.resolve([meta('picker')]),
      () => Promise.reject(new Error('should not load'))
    );
    assert.equal((await find('trait', 'gateway')).status, 'none');
  });
  it('reports a failure when the plugin will not load', async () => {
    const find = createDefinitionPluginFinder(
      () => Promise.resolve([meta('picker')]),
      () => Promise.reject(new Error('boom'))
    );
    const result = await find('policy', 'topology');
    assert.equal(result.status, 'failed');
    assert.equal(result.status === 'failed' && result.pluginID, 'picker');
  });
  it('reports a failure when the module sets no form', async () => {
    const find = createDefinitionPluginFinder(
      () => Promise.resolve([meta('picker')]),
      (m) => Promise.resolve({ meta: m })
    );
    assert.equal((await find('policy', 'topology')).status, 'failed');
  });
  it('treats a failed plugin list as none, and asks again next time', async () => {
    let lists = 0;
    const find = createDefinitionPluginFinder(
      () => {
        lists++;
        return lists === 1 ? Promise.reject(new Error('offline')) : Promise.resolve([meta('picker')]);
      },
      (m) => Promise.resolve({ meta: m, form: () => null })
    );
    assert.equal((await find('policy', 'topology')).status, 'none');
    assert.equal((await find('policy', 'topology')).status, 'loaded');
  });
});
