import { expect } from 'chai';

import { componentNodeHeight, layoutTraits, traitChipWidth } from '../../components/TreeGraph/traits';

describe('trait chip layout', () => {
  it('fits every trait when they fit the rows', () => {
    const got = layoutTraits(['scaler', 'labels'], 300, 2);
    expect(got.rows).to.deep.equal([['scaler', 'labels']]);
    expect(got.hidden).to.deep.equal([]);
  });

  it('wraps onto the next row when a row is full', () => {
    const types = ['annotations', 'service-binding', 'scaler', 'labels'];
    const got = layoutTraits(types, traitChipWidth('annotations') + traitChipWidth('service-binding') + 6, 2);
    expect(got.rows).to.deep.equal([
      ['annotations', 'service-binding'],
      ['scaler', 'labels'],
    ]);
    expect(got.hidden).to.deep.equal([]);
  });

  it('keeps room for the more chip on the last row, and hides the rest', () => {
    const types = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'];
    const width = traitChipWidth('a1') * 3 + 8;
    const got = layoutTraits(types, width, 2);
    expect(got.rows.length).to.equal(2);
    const shown = got.rows.flat();
    expect([...shown, ...got.hidden]).to.deep.equal(types, 'every trait is shown or hidden, in order');
    expect(got.hidden.length).to.be.greaterThan(0);
  });

  it('sizes a component node by its rows of traits', () => {
    expect(componentNodeHeight(0)).to.equal(60);
    expect(componentNodeHeight(2)).to.be.greaterThan(componentNodeHeight(1));
  });
});
