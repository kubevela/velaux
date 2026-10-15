import { expect } from 'chai';

import { definitionPlaceFrom, definitionPlaceQuery, definitionResource } from '../definitionPlace';

describe('definition place', () => {
  it('reads and writes the query', () => {
    const place = definitionPlaceFrom('?project=shop&where=project');
    expect(place).to.deep.equal({ project: 'shop', where: 'project' });
    expect(definitionPlaceQuery(place)).to.equal('?project=shop&where=project');
  });

  it('is the global one with no query, and ignores an unknown where', () => {
    expect(definitionPlaceFrom('')).to.deep.equal({ project: '', where: undefined });
    expect(definitionPlaceFrom('?where=elsewhere').where).to.equal(undefined);
    expect(definitionPlaceQuery({ project: '' })).to.equal('');
  });

  it('changes a project one under the project and a global one under the platform', () => {
    expect(definitionResource({ project: 'shop', where: 'project' }, 'web')).to.equal('project:shop/definition:web');
    expect(definitionResource({ project: 'shop', where: 'global' }, 'web')).to.equal('definition:web');
    expect(definitionResource({ project: 'shop' }, 'web')).to.equal('definition:web');
  });
});
