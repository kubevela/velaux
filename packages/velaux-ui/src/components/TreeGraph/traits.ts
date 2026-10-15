// Component nodes on the service graph show their traits as chips below the
// name, on at most a few rows, with the rest behind a "+N" chip.

// componentNodeWidth is a component node's width on the service graph.
export const componentNodeWidth = 360;
// traitArea is the width the chips have: the node less its icon and padding.
export const traitArea = componentNodeWidth - 72;
// maxTraitRows is how many rows of chips a node shows before the rest are hidden.
export const maxTraitRows = 2;

const chipHeight = 26;
const chipGap = 6;
const moreChipWidth = 44;

// traitChipWidth estimates a chip's width from its text: a dot, the type and padding.
export function traitChipWidth(type: string): number {
  return type.length * 7 + 30;
}

// layoutTraits places trait chips in rows of the given width, in order, keeping
// room for the "+N" chip on the last row when some do not fit.
export function layoutTraits(types: string[], width: number, maxRows: number): { rows: string[][]; hidden: string[] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let used = 0;
  for (let i = 0; i < types.length; i++) {
    const w = traitChipWidth(types[i]);
    const lastRow = rows.length === maxRows - 1;
    const remainingAfter = types.length - i - 1;
    const reserve = lastRow && remainingAfter > 0 ? moreChipWidth + chipGap : 0;
    if (row.length > 0 && used + chipGap + w + reserve > width) {
      rows.push(row);
      if (rows.length === maxRows) {
        return { rows, hidden: types.slice(i) };
      }
      row = [];
      used = 0;
    }
    if (row.length === 0 && lastRow && remainingAfter > 0 && w + chipGap + moreChipWidth > width) {
      rows.push([types[i]]);
      return { rows, hidden: types.slice(i + 1) };
    }
    used += (row.length > 0 ? chipGap : 0) + w;
    row.push(types[i]);
  }
  if (row.length > 0) {
    rows.push(row);
  }
  return { rows, hidden: [] };
}

// componentNodeHeight is a component node's height with its rows of chips.
export function componentNodeHeight(rows: number): number {
  return 44 + rows * (chipHeight + 4);
}
