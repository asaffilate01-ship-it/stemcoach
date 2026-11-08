/** Visible navigation is only a convenience; server RLS and route guards remain authoritative. */
export interface NavigationAccessContext {
  signedIn: boolean;
  rolesLoading: boolean;
  roles: readonly string[];
}

export function canShowNavItem(item: { roles?: readonly string[] }, context: NavigationAccessContext): boolean {
  if (!item.roles) return true;
  if (!context.signedIn || context.rolesLoading) return false;
  return item.roles.some(role => context.roles.includes(role));
}
