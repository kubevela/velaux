import { expect } from 'chai';

import { toCSV } from '../../pages/Reports/csv';

describe('report CSV', () => {
  it('writes the titles, then a line per row, quoting where needed', () => {
    const csv = toCSV(
      [
        { key: 'app', title: 'Application' },
        { key: 'message', title: 'Message' },
      ],
      [{ values: { app: 'storefront', message: 'step "deploy", failed\nretrying' } }, { values: { app: 'cart' } }]
    );
    expect(csv).to.equal('Application,Message\nstorefront,"step ""deploy"", failed\nretrying"\ncart,\n');
  });
});
