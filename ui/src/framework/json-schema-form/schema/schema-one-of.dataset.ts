export type SchemaOneOfLike = readonly {
  readonly const?: unknown;
  readonly title?: unknown;
}[];

/** Case-insensitive equality for schema option values (e.g. industry role GUIDs). */
export function compareSchemaOptionValues(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }

  if (left == null || right == null) {
    return false;
  }

  return String(left).localeCompare(String(right), undefined, { sensitivity: 'base' }) === 0;
}

/** Finds a schema oneOf option by const or title (case-insensitive). */
export function findSchemaOneOfOption(
  oneOf: SchemaOneOfLike | undefined,
  value: unknown
): SchemaOneOfLike[number] | undefined {
  if (!oneOf?.length || value == null || value === '') {
    return undefined;
  }

  const raw = String(value).trim();
  const byConst = oneOf.find(
    (option) => option.const != null && compareSchemaOptionValues(option.const, raw)
  );
  if (byConst) {
    return byConst;
  }

  return oneOf.find(
    (option) =>
      option.title != null &&
      String(option.title).localeCompare(raw, undefined, { sensitivity: 'base' }) === 0
  );
}

/** Returns the schema oneOf const for form binding, or the original value when unmatched. */
export function resolveSchemaOneOfConst(
  oneOf: SchemaOneOfLike | undefined,
  value: unknown
): string {
  const raw = value == null ? '' : String(value).trim();
  if (!raw) {
    return '';
  }

  const match = findSchemaOneOfOption(oneOf, raw);
  return match?.const != null ? String(match.const) : raw;
}
