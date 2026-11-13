export function normalizeApiRoot(root: string): string {
  const trimmed = root.trim();
  const withSlash = trimmed.endsWith('/') ? trimmed : `${trimmed}/`;

  if (withSlash.startsWith('http://') || withSlash.startsWith('https://') || withSlash.startsWith('/')) {
    return withSlash;
  }

  return `/${withSlash}`;
}

export function buildApiUrl(apiRoot: string, path: string): string {
  const segment = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizeApiRoot(apiRoot)}${segment}`;
}
