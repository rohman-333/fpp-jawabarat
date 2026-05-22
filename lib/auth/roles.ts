export type ProfileRole = 'superadmin' | 'admin' | 'operator' | 'team' | 'user';

export interface ProfileRoles {
  role?: ProfileRole;
  has_pesantren?: boolean;
  is_seller?: boolean;
  seller_status?: string;
  is_courier?: boolean;
  courier_status?: string;
  team_division?: string | null;
}

export function isSuperAdmin(profile?: ProfileRoles | null): boolean {
  return profile?.role === 'superadmin';
}

export function isAdmin(profile?: ProfileRoles | null): boolean {
  return profile?.role === 'superadmin' || profile?.role === 'admin';
}

export function isTeam(profile?: ProfileRoles | null): boolean {
  return profile?.role === 'team' || profile?.role === 'operator' || isAdmin(profile);
}

export function isUser(profile?: ProfileRoles | null): boolean {
  return profile?.role === 'user';
}

export function canAccessAdmin(profile?: ProfileRoles | null): boolean {
  return isAdmin(profile) || profile?.role === 'team' || profile?.role === 'operator';
}

export function canManageMarketplace(profile?: ProfileRoles | null): boolean {
  if (isAdmin(profile)) return true;
  if (profile?.role === 'team' && profile?.team_division === 'marketplace') return true;
  return false;
}

export function canManagePesantren(profile?: ProfileRoles | null): boolean {
  if (isAdmin(profile)) return true;
  if (profile?.role === 'team' && profile?.team_division === 'pesantren') return true;
  return false;
}

export function canManageCourier(profile?: ProfileRoles | null): boolean {
  if (isAdmin(profile)) return true;
  if (profile?.role === 'team' && profile?.team_division === 'kurir') return true;
  return false;
}

export function canSell(profile?: ProfileRoles | null): boolean {
  if (isAdmin(profile)) return true;
  return !!profile?.is_seller && profile?.seller_status === 'approved';
}

export function canCourier(profile?: ProfileRoles | null): boolean {
  if (isAdmin(profile)) return true;
  return !!profile?.is_courier && profile?.courier_status === 'approved';
}

export function getDisplayRole(profile?: ProfileRoles | null): string {
  if (!profile) return 'User';
  
  if (profile.role === 'superadmin') return 'Superadmin';
  if (profile.role === 'admin') return 'Admin';
  if (profile.role === 'team') return `Team WIBAWA${profile.team_division ? ` - ${profile.team_division}` : ''}`;
  
  const tags = [];
  if (profile.has_pesantren) tags.push('Pengelola Pesantren');
  if (profile.is_seller && profile.seller_status === 'approved') tags.push('Seller');
  if (profile.is_courier && profile.courier_status === 'approved') tags.push('Kurir');
  
  if (tags.length > 0) {
    return tags.join(', ');
  }
  
  return 'User';
}
