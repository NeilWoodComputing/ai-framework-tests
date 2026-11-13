/**
 * Shared client-side permission rule: true when no permissions are required, otherwise
 * when the session has ANY of the required permissions. Used by the entity grid's row
 * actions (`GridRowAction.requiredPermissions`) and by pages that gate on a permission.
 */
export function hasAnyPermission(
  permissions: readonly string[] | null | undefined,
  required: readonly string[] | null | undefined
): boolean {
  if (!required || required.length === 0) return true;
  if (!permissions || permissions.length === 0) return false;
  return required.some((permission) => permissions.includes(permission));
}
