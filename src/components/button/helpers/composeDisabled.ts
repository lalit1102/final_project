export function composeDisabled(disabled: boolean | undefined, permissionBlocked: boolean | undefined) {
  return Boolean(disabled || permissionBlocked);
}
