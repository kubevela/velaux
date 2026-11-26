import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

import { notFoundLines, pickNotFoundLine } from '../../pages/NotFound/lines';

describe('pickNotFoundLine', () => {
  it('maps the whole random range onto the list', () => {
    expect(pickNotFoundLine(() => 0)).to.equal(notFoundLines[0]);
    expect(pickNotFoundLine(() => 0.9999)).to.equal(notFoundLines[notFoundLines.length - 1]);
  });

  it('has a Chinese translation for every line', () => {
    const zh = JSON.parse(fs.readFileSync(path.join(__dirname, '../../locals/Zh/zh.json'), 'utf8'));
    notFoundLines.forEach((line) => expect(zh, line).to.have.property(line));
  });
});
