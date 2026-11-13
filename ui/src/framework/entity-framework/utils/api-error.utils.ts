/**
 * Error thrown by entity data providers for a non-success API response.
 * Carries the HTTP status and parsed JSON body so callers can show the API's messages.
 */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/** Reads a JSON error body when present; returns undefined for empty / non-JSON bodies. */
export async function readApiErrorBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    return text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    return undefined;
  }
}

function readValidationErrorList(value: unknown): Record<string, string[]> | undefined {
  if (!Array.isArray(value)) return undefined;

  const result: Record<string, string[]> = {};
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const propertyId = String(entry.propertyId ?? entry.PropertyId ?? '').trim();
    const errors = entry.errors ?? entry.Errors;
    if (!propertyId || !Array.isArray(errors)) continue;
    const key = propertyId.charAt(0).toLowerCase() + propertyId.slice(1);
    const messages = errors.map((message) => String(message)).filter(Boolean);
    if (messages.length) {
      result[key] = [...(result[key] ?? []), ...messages];
    }
  }

  return Object.keys(result).length ? result : undefined;
}

export function extractValidationErrors(error: unknown): Record<string, string[]> | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const body = 'body' in error ? (error as { body: unknown }).body : error;
  if (!body || typeof body !== 'object') return undefined;

  const record = body as Record<string, unknown>;
  if (record.errors && typeof record.errors === 'object') {
    return record.errors as Record<string, string[]>;
  }

  const validationErrors = readValidationErrorList(record.validationErrors ?? record.ValidationErrors);
  if (validationErrors) {
    return validationErrors;
  }

  if (record.errorMessages && Array.isArray(record.errorMessages)) {
    const messages = record.errorMessages
      .map((item) => {
        if (typeof item === 'string') return item;
        return typeof item === 'object' && item && 'message' in item ? String(item.message) : '';
      })
      .filter(Boolean);
    return messages.length ? { _form: messages } : undefined;
  }

  return undefined;
}

export function getErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (error && typeof error === 'object' && 'body' in error) {
    const body = (error as { body: unknown }).body;
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      if (typeof record.message === 'string' && record.message) return record.message;
      if (Array.isArray(record.errorMessages) && record.errorMessages[0]) {
        const first = record.errorMessages[0] as { message?: string } | string;
        if (typeof first === 'string') return first;
        if (first.message) return first.message;
      }
    }
  }

  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (Array.isArray(record.errorMessages) && record.errorMessages[0]) {
      const first = record.errorMessages[0] as { message?: string } | string;
      if (typeof first === 'string') return first;
      if (first.message) return first.message;
    }
  }

  return fallback;
}
