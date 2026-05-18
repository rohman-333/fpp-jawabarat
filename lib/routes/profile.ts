export function getProfileUrl(profile: { id?: string; username?: string | null } | null): string {
  if (!profile) return '/';
  
  if (profile.username) {
    return `/u/${profile.username}`;
  }
  
  if (profile.id) {
    return `/u/id/${profile.id}`;
  }
  
  return '/';
}
