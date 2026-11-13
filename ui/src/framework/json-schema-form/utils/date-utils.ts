/** ISO date-only string (yyyy-MM-dd) for API date fields. */
export function formatDateForApiDateOnly(value: Date): string | undefined {
  if (Number.isNaN(value.getTime())) {
    return undefined;
  }

  return value.toISOString().slice(0, 10);
}
