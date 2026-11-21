import 'mocha';
import { assert } from 'chai';
import { Field } from '@alifd/next';
import type { PluginMeta } from '@velaux/data';
import {
  createDefinitionPluginFinder,
  definitionKind,
  matchDefinitionPlugin,
  pluginValidation,
  propertiesRule,
} from '../definitionPlugin';
import type { DefinitionPluginLookup } from '../definitionPlugin';

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

describe('propertiesRule', () => {
  const validateField = (rule: any): Promise<string[] | undefined> =>
    new Promise((resolve) => {
      const ctx: any = { state: {}, setState() {}, forceUpdate() {} };
      const field = new Field(ctx);
      field.init('properties', { rules: [rule] });
      field.validate((errors: any) => resolve(errors ? errors.properties.errors : undefined));
    });

  it("shows a plugin's own message when it blocks the save", async () => {
    const form = { validate: (cb: (e?: string) => void) => cb('Pick at least one cluster') };
    const errors = await validateField(propertiesRule(() => form, 'Please check the properties of this policy'));
    assert.deepEqual(errors, ['Pick at least one cluster']);
  });
  it('shows the generic message when the generated form blocks the save', async () => {
    const form = { validate: (cb: (e?: string) => void, generic?: string) => cb(generic) };
    const errors = await validateField(propertiesRule(() => form, 'Please check the properties of this policy'));
    assert.deepEqual(errors, ['Please check the properties of this policy']);
  });
  it('passes when the form passes, or is not there yet', async () => {
    assert.isUndefined(await validateField(propertiesRule(() => ({ validate: (cb: any) => cb() }), 'generic')));
    assert.isUndefined(await validateField(propertiesRule(() => null, 'generic')));
  });
});

describe('pluginValidation', () => {
  const loaded = (validator?: (v: any) => string | undefined): DefinitionPluginLookup => ({
    status: 'loaded',
    plugin: { meta: meta('picker'), form: () => null, validator },
  });
  it("runs a loaded plugin's validator", () => {
    assert.deepEqual(
      pluginValidation(
        loaded(() => 'Pick at least one cluster'),
        false,
        {}
      ),
      {
        applies: true,
        error: 'Pick at least one cluster',
      }
    );
    assert.deepEqual(pluginValidation(loaded(), false, {}), { applies: true, error: undefined });
  });
  it('leaves the coding mode and the generated form to UISchema', () => {
    assert.deepEqual(
      pluginValidation(
        loaded(() => 'no'),
        true,
        {}
      ),
      { applies: false }
    );
    assert.deepEqual(pluginValidation({ status: 'none' }, false, {}), { applies: false });
    assert.deepEqual(pluginValidation({ status: 'failed', pluginID: 'picker', error: 'x' }, false, {}), {
      applies: false,
    });
    assert.deepEqual(pluginValidation(undefined, false, {}), { applies: false });
  });
});
