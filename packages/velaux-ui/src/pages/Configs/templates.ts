import type { Config, ConfigTemplate } from '@velaux/data';

// systemNamespace holds the global templates.
const systemNamespace = 'vela-system';

export type TemplateOption = { name: string; alias?: string; global: boolean };

// templateOptions are the templates the list can be filtered by: those it can
// create from, and those of every config it shows, which in a project include
// the global configs shared with it, whose templates it cannot create from.
export function templateOptions(templates: ConfigTemplate[], configs: Config[]): TemplateOption[] {
  const isGlobal = (namespace?: string) => !namespace || namespace === systemNamespace;
  const options: TemplateOption[] = templates.map((t) => ({
    name: t.name,
    alias: t.alias,
    global: isGlobal(t.namespace),
  }));
  for (const c of configs) {
    const name = c.template?.name;
    if (name && !options.some((o) => o.name === name)) {
      options.push({ name, alias: c.templateAlias, global: isGlobal(c.template?.namespace) });
    }
  }
  return options;
}

type Item = { label: string; value: string };

// templateFilterItems are the options as the filter shows them: in a project,
// grouped as the project's and the global ones, an empty group left out; on
// the global page, one list.
export function templateFilterItems(
  options: TemplateOption[],
  groups?: { project: string; global: string }
): Array<Item | { label: string; children: Item[] }> {
  const item = (o: TemplateOption): Item => ({ label: o.alias || o.name, value: o.name });
  if (!groups) {
    return options.map(item);
  }
  return [
    { label: groups.project, children: options.filter((o) => !o.global).map(item) },
    { label: groups.global, children: options.filter((o) => o.global).map(item) },
  ].filter((group) => group.children.length > 0);
}
