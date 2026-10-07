import { expect } from 'chai';

import { chartRows, formatCell, latestOnly, pieRows, statusColour, statusColours } from '../../pages/Reports/view';

describe('formatCell', () => {
  it('shows a percent', () => {
    expect(formatCell(80, 'percent')).to.equal('80%');
  });
  it('shows a duration in seconds as the largest units', () => {
    expect(formatCell(3725, 'duration')).to.equal('1h 2m');
    expect(formatCell(45, 'duration')).to.equal('45s');
  });
  it('shows nothing for a missing value, whatever the format', () => {
    expect(formatCell(null, 'percent')).to.equal('');
    expect(formatCell(undefined, 'time')).to.equal('');
  });
  it('shows anything else as text', () => {
    expect(formatCell(3, undefined)).to.equal('3');
    expect(formatCell(true, undefined)).to.equal('true');
  });
});

describe('chartRows', () => {
  it('is a row per point, a key per series, missing ones zero', () => {
    expect(
      chartRows({
        type: 'bar',
        series: ['a', 'b'],
        points: [
          { label: 'x', values: { a: 1 } },
          { label: 'y', values: { a: 2, b: 3 } },
        ],
      })
    ).to.deep.equal([
      { label: 'x', a: 1, b: 0 },
      { label: 'y', a: 2, b: 3 },
    ]);
  });
});

describe('latestOnly', () => {
  it('drops a response that is no longer for the latest request', async () => {
    const track = latestOnly();
    let slow: (v: string) => void = () => {};
    const first = track(new Promise<string>((resolve) => (slow = resolve)));
    const second = track(Promise.resolve('second'));
    const seen: string[] = [];
    first.then((v) => seen.push(v));
    second.then((v) => seen.push(v));
    await second;
    slow('first');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(seen).to.deep.equal(['second']);
  });
});

describe('pieRows', () => {
  const chart = (n: number) => ({
    type: 'pie' as const,
    series: ['count'],
    points: Array.from({ length: n }, (_, i) => ({ label: `t${i}`, values: { count: i + 1 } })),
  });
  it('is every slice, largest first, where there are few', () => {
    expect(pieRows(chart(3), 'count').map((r) => r.label)).to.deep.equal(['t2', 't1', 't0']);
  });
  it('folds all but the largest into Other where there are many', () => {
    const rows = pieRows(chart(10), 'count');
    expect(rows.map((r) => r.label)).to.deep.equal(['t9', 't8', 't7', 't6', 't5', 't4', 't3', 'Other']);
    expect(rows[7].count).to.equal(1 + 2 + 3);
  });
});

describe('statusColour', () => {
  it('colours outcomes by what they mean', () => {
    expect(statusColour('failed')).to.equal(statusColours.bad);
    expect(statusColour('Pinned to a missing version')).to.equal(statusColours.bad);
    expect(statusColour('succeeded')).to.equal(statusColours.good);
    expect(statusColour('Up to date')).to.equal(statusColours.good);
    expect(statusColour('suspending')).to.equal(statusColours.waiting);
    expect(statusColour('Pinned behind the latest')).to.equal(statusColours.waiting);
    expect(statusColour('running')).to.equal(statusColours.active);
  });
  it('leaves anything else to the palette', () => {
    expect(statusColour('webapp')).to.equal(undefined);
  });
});
