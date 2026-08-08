/**
 * Turns an array of flat objects into a CSV string. Minimal on purpose —
 * every field here is a number, short label, or percentage, never free
 * text, so we don't need a full CSV-escaping library.
 */
function toCsv(rows, columns) {
  const header = columns.map((c) => c.label).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const v = c.get(row);
        const s = v === null || v === undefined ? '' : String(v);
        // Quote only if the value could otherwise break a column boundary.
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(',')
  );
  return [header, ...lines].join('\n') + '\n';
}

export function distributionToCsv(distribution) {
  return toCsv(distribution.distribution, [
    { label: 'Persona', get: (r) => r.name },
    { label: 'Count', get: (r) => r.count },
    { label: 'Percent', get: (r) => r.pct },
  ]);
}

export function heatmapToCsv(heatmap) {
  const dimKeys = heatmap.dimensions.map((d) => d.key);
  return toCsv(heatmap.areas, [
    { label: 'Business area', get: (r) => r.area },
    { label: 'Respondents', get: (r) => r.n },
    ...dimKeys.map((k, i) => ({
      label: heatmap.dimensions[i].label,
      get: (r) => r.values[k],
    })),
  ]);
}

export function analyticsToCsv(analytics) {
  const headline = toCsv(
    [
      { label: 'Quiz starts', value: analytics.starts },
      { label: 'Completions', value: analytics.completions },
      { label: 'Completion rate (%)', value: Math.round(analytics.completionRate * 100) },
      { label: 'Unique visitors', value: analytics.uniqueVisitors },
      { label: 'Repeat visitors', value: analytics.repeatVisitors },
    ],
    [
      { label: 'Metric', get: (r) => r.label },
      { label: 'Value', get: (r) => r.value },
    ]
  );
  const areas = toCsv(analytics.areas, [
    { label: 'Business area', get: (r) => r.area },
    { label: 'Starts', get: (r) => r.starts },
    { label: 'Completion rate (%)', get: (r) => (r.suppressed ? 'Too small to show' : Math.round(r.completionRate * 100)) },
  ]);
  return `${headline}\n${areas}`;
}
