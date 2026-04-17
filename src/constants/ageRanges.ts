// Overlapping ranges by design — users pick the one that fits best.
// Values must match the AgeRange enum in amplify/data/resource.ts.
export const AGE_RANGE_OPTIONS = [
  { value: 'R_18_25', label: '18–25' },
  { value: 'R_22_30', label: '22–30' },
  { value: 'R_25_35', label: '25–35' },
  { value: 'R_30_40', label: '30–40' },
  { value: 'R_35_45', label: '35–45' },
  { value: 'R_40_50', label: '40–50' },
  { value: 'R_45_55', label: '45–55' },
  { value: 'R_50_60', label: '50–60' },
  { value: 'R_55_65', label: '55–65' },
  { value: 'R_60_PLUS', label: '60+' },
] as const;

export type AgeRangeValue = (typeof AGE_RANGE_OPTIONS)[number]['value'];

export function ageRangeLabel(value: string | null | undefined): string {
  return AGE_RANGE_OPTIONS.find((o) => o.value === value)?.label ?? '—';
}
