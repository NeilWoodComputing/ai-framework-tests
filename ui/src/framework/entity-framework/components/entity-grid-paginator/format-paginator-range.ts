/** Same range text as Angular Material paginator — e.g. `1 – 10 of 35`. */
export function formatPaginatorRangeLabel(
  pageIndex: number,
  pageSize: number,
  totalRows: number
): string {
  if (totalRows === 0 || pageSize === 0) {
    return `0 of ${formatGroupedNumber(totalRows)}`;
  }

  const startIndex = pageIndex * pageSize;
  const endIndex =
    startIndex < totalRows
      ? Math.min(startIndex + pageSize, totalRows)
      : startIndex + pageSize;

  return `${formatGroupedNumber(startIndex + 1)} – ${formatGroupedNumber(endIndex)} of ${formatGroupedNumber(totalRows)}`;
}

function formatGroupedNumber(value: number): string {
  return value.toLocaleString('en-GB');
}
