import { expect } from 'chai';

import { nextExpiry, timeLeft, sourcePhase, sourceReads } from '../sourceStatus';

describe('sourcePhase', () => {
  it('reads each phase as a label and tone', () => {
    expect(sourcePhase('Resolved')).to.deep.equal({ label: 'Fresh', tone: 'healthy' });
    expect(sourcePhase('Stale')).to.deep.equal({ label: 'Stale', tone: 'suspended' });
    expect(sourcePhase('Failed')).to.deep.equal({ label: 'Failed', tone: 'failed' });
    expect(sourcePhase('Unused')).to.deep.equal({ label: 'Unused', tone: 'neutral' });
  });

  it('reads a missing phase as pending', () => {
    expect(sourcePhase(undefined)).to.deep.equal({ label: 'Pending', tone: 'progressing' });
  });
});

describe('nextExpiry', () => {
  it('is the soonest entry to expire', () => {
    const resolutions = [
      { expiresAt: '2026-10-01T20:00:00Z' },
      { expiresAt: '2026-10-01T19:30:00Z' },
      { expiresAt: '2026-10-01T21:00:00Z' },
    ];
    expect(nextExpiry(resolutions)?.toISOString()).to.equal('2026-10-01T19:30:00.000Z');
  });

  it('skips entries with no or an unreadable expiry', () => {
    expect(nextExpiry([{}, { expiresAt: 'soon' }])).to.equal(undefined);
    expect(nextExpiry(undefined)).to.equal(undefined);
  });
});

describe('timeLeft', () => {
  const now = new Date('2026-10-01T19:00:00Z');
  const at = (iso: string) => timeLeft(new Date(iso), now);

  it('counts down in the largest whole unit', () => {
    expect(at('2026-10-01T19:00:40Z')).to.equal('40s');
    expect(at('2026-10-01T19:42:10Z')).to.equal('42m');
    expect(at('2026-10-01T22:05:00Z')).to.equal('3h 5m');
    expect(at('2026-10-04T19:00:00Z')).to.equal('3d');
  });

  it('is nothing once the expiry has passed', () => {
    expect(at('2026-10-01T19:00:00Z')).to.equal(undefined);
    expect(at('2026-10-01T18:00:00Z')).to.equal(undefined);
  });
});

describe('sourceReads', () => {
  it('lists every value read, with who read it and where', () => {
    const reads = sourceReads({
      name: 'db',
      consumedBy: [
        {
          definitionKind: 'component',
          name: 'api',
          type: 'webservice',
          cluster: 'local',
          namespace: 'shop',
          values: [
            { sourceAttr: 'host', property: 'env[0].value', value: 'db.internal' },
            { sourceAttr: 'port', property: 'env[1].value', value: 5432 },
          ],
        },
        { definitionKind: 'trait', name: 'api/scaler', values: [{ sourceAttr: 'limits', value: { cpu: '1' } }] },
      ],
    });
    expect(reads).to.deep.equal([
      {
        attr: 'host',
        value: 'db.internal',
        reader: 'api',
        readerKind: 'component',
        readerType: 'webservice',
        property: 'env[0].value',
        placement: 'local/shop',
      },
      {
        attr: 'port',
        value: '5432',
        reader: 'api',
        readerKind: 'component',
        readerType: 'webservice',
        property: 'env[1].value',
        placement: 'local/shop',
      },
      {
        attr: 'limits',
        value: '{"cpu":"1"}',
        reader: 'api/scaler',
        readerKind: 'trait',
        readerType: undefined,
        property: undefined,
        placement: undefined,
      },
    ]);
  });

  it('lists a reader whose values are withheld, without a value', () => {
    const reads = sourceReads({ name: 'db', consumedBy: [{ definitionKind: 'component', name: 'api' }] });
    expect(reads).to.deep.equal([
      {
        attr: undefined,
        value: undefined,
        reader: 'api',
        readerKind: 'component',
        readerType: undefined,
        property: undefined,
        placement: undefined,
      },
    ]);
  });
});
