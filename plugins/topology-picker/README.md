# Writing a definition plugin

VelaUX draws the properties form of every component, trait, policy, workflow step and source from the
definition's parameters. A definition plugin replaces that form for the definitions it names, with your
own React component. It writes the same `properties` the generated form would; only the editing changes.

This plugin is the worked example: it replaces the `topology` policy's form with the clusters VelaUX
knows about, as checkboxes, plus the namespace.

## plugin.json

```json
{
  "type": "definition",
  "id": "topology-picker",
  "name": "Topology Picker",
  "definitions": [{ "kind": "policy", "name": "topology" }]
}
```

| Field | What it does |
| --- | --- |
| `type` | `definition`. |
| `definitions` | The definitions this plugin replaces the form of, each by `kind` and `name`. At least one. |
| `definitions[].kind` | `component`, `trait`, `policy`, `workflow-step` or `source`. |
| `definitions[].name` | The definition's name, as it appears in the type picker (`topology`, `webservice`, ...). |

VelaUX refuses to load a definition plugin that names no definition, an unknown kind or an empty name,
and any other type of plugin that names one. If two enabled plugins name the same definition, the first
one listed wins.

## module.ts

The module exports `plugin`, a `DefinitionPlugin` with its form and, optionally, a validator:

```ts
import { DefinitionPlugin } from '@velaux/data';
import { TopologyForm, validateTopology } from './components/TopologyForm';

export const plugin = new DefinitionPlugin().setForm(TopologyForm).setValidator(validateTopology);
```

## The form

The form is an ordinary React component. It gets `DefinitionFormProps`:

| Prop | What it is |
| --- | --- |
| `value` | The current properties, or nothing for a new one. |
| `onChange(value)` | Report every change with the whole properties object. Keep the keys you don't edit, so nothing set elsewhere (in the YAML mode, say) is lost. |
| `definition` | `{ kind, name, description }` of the definition being filled in. |
| `context` | `{ project, appName }` where the form is open; a field is absent where the form has no such scope (the workflow step form of a pipeline has no application). |

`@velaux/ui` gives you VelaUX's own components and services, so the form looks at home and can call the
API: `TopologyForm` lists clusters with `getBackendSrv().get('/api/v1/clusters')` and draws them with
`Checkbox` and `Input`.

## Validation

`setValidator` takes a function of the properties that returns a message to block saving, or nothing:

```ts
export function validateTopology(value?: TopologyProperties): string | undefined {
  if (!value || !value.clusters || value.clusters.length === 0) {
    return 'Pick at least one cluster';
  }
  return undefined;
}
```

The message shows under the form when someone presses Create or Update. With no validator, anything the
form produces is accepted; the controller still checks it against the definition when the application
deploys.

## What VelaUX keeps for you

- **The YAML mode.** The coding button on the properties card still switches to the YAML editor, which
  edits the same properties. Your form isn't used there.
- **Fallback.** If the module fails to load, sets no form, or throws while rendering, VelaUX shows the
  generated form with a one-line notice, so nobody is locked out of a definition by a broken plugin.
- **Every other definition** keeps the generated form.

The plugin list and each module are loaded once per session, so after enabling or updating a plugin,
reload the page.

## Building and trying it

```sh
yarn workspace @velaux-plugins/topology-picker build
```

The build lands in `dist/`. Point a local VelaUX server at a folder holding it with `--plugin-path`, or
package `dist/` as a `.tar.gz` and install it from the Plugins page, then enable it there. Add a Topology
policy to any application and the cluster picker shows in place of the generated form.
