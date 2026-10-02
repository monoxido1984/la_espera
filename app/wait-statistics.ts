export type WaitCell = {
  year: number; list: string; province: string; age: string; unit: string; n: number;
  average: number | null; median: number | null; p25: number | null; p75: number | null;
  status: string; consulted: string; source: string; sha256: string; reportUrl: string;
};
// Means combine with counts; quantiles do not. Missing cells never become zero.
export function summarizeWait(cells: WaitCell[], year: number, list: string, province: string | null, age: string) {
  const rows = cells.filter(row => row.year === year && row.list === list && (!province || row.province === province) && (age === 'all' || row.age === age));
  const expected = (province ? 1 : 24) * (age === 'all' ? 2 : 1);
  const n = rows.reduce((sum, row) => sum + row.n, 0);
  const complete = rows.length === expected && new Set(rows.map(row => `${row.province}/${row.age}`)).size === expected;
  const units = new Set(rows.map(row => row.unit));
  const exact = rows.length === 1 && n > 0 ? rows[0] : null;
  return {
    n, complete, unit: rows[0]?.unit ?? 'meses', rows,
    average: complete && n > 0 && units.size === 1 ? rows.reduce((sum, row) => sum + (row.average ?? 0) * row.n, 0) / n : null,
    median: exact?.median ?? null, p25: exact?.p25 ?? null, p75: exact?.p75 ?? null,
    status: !complete ? 'incompleto' : n === 0 ? 'sin_observaciones' : 'observado',
  };
}
