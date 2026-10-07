// toCSV writes a report's table as CSV, a header of column titles then a line
// per row, each value quoted where it holds a comma, quote or line break.
export function toCSV(
  columns: Array<{ key: string; title: string }>,
  rows: Array<{ values: Record<string, any> }>
): string {
  const cell = (v: any) => {
    const text = v === undefined || v === null ? '' : String(v);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [columns.map((c) => cell(c.title)).join(',')];
  rows.forEach((r) => lines.push(columns.map((c) => cell(r.values[c.key])).join(',')));
  return lines.join('\n') + '\n';
}
