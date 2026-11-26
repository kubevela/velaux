# Topology Picker

A definition plugin for VelaUX. It replaces the properties form of the `topology` policy with a list of
the clusters VelaUX knows about, as checkboxes, plus the namespace. It writes the same `clusters` and
`namespace` properties the generated form does, and keeps every other property as it is.

The plugin.json lists the definitions it applies to:

```json
"type": "definition",
"definitions": [{ "kind": "policy", "name": "topology" }]
```

and `module.ts` sets the form and a validator:

```ts
export const plugin = new DefinitionPlugin().setForm(TopologyForm).setValidator(validateTopology);
```
