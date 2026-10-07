import { expect } from 'chai';

import type { Config, ConfigTemplate } from '@velaux/data';
import { templateFilterItems, templateOptions } from '../../pages/Configs/templates';

describe('config template filter', () => {
  const template = (name: string, namespace: string, alias?: string) => ({ name, namespace, alias } as ConfigTemplate);
  const config = (name: string, templateName: string, templateAlias?: string) =>
    ({ name, template: { name: templateName, namespace: 'vela-system' }, templateAlias } as Config);
  const labels = { project: 'Project', global: 'Global' };

  it('offers the templates the page can create from', () => {
    expect(templateOptions([template('image-registry', 'vela-system', 'Image registry')], [])).to.deep.equal([
      { name: 'image-registry', alias: 'Image registry', global: true },
    ]);
  });

  it('adds the templates of the configs shown, once each', () => {
    const options = templateOptions(
      [template('image-registry', 'vela-system')],
      [
        config('cluster-info', 'cluster-info', 'Cluster info'),
        config('other', 'cluster-info'),
        config('reg', 'image-registry'),
      ]
    );
    expect(options.map((o) => o.name)).to.deep.equal(['image-registry', 'cluster-info']);
    expect(options[1].alias).to.equal('Cluster info');
  });

  it("groups the project's templates and the global ones", () => {
    const items = templateFilterItems(
      templateOptions([template('team-registry', 'shop'), template('image-registry', 'vela-system')], []),
      labels
    );
    expect(items).to.deep.equal([
      { label: 'Project', children: [{ label: 'team-registry', value: 'team-registry' }] },
      { label: 'Global', children: [{ label: 'image-registry', value: 'image-registry' }] },
    ]);
  });

  it('shows the global group alone in a project with no templates of its own', () => {
    const items = templateFilterItems(templateOptions([template('image-registry', 'vela-system')], []), labels);
    expect(items).to.deep.equal([
      { label: 'Global', children: [{ label: 'image-registry', value: 'image-registry' }] },
    ]);
  });

  it('is one list on the global page', () => {
    const items = templateFilterItems(templateOptions([template('image-registry', 'vela-system')], []));
    expect(items).to.deep.equal([{ label: 'image-registry', value: 'image-registry' }]);
  });
});
