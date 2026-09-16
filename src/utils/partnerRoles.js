/**
 * Partner identity helpers — role + verification status.
 * Roles: guide | artisan | cooperative (not tourist-then-upgrade).
 * partnerStatus: pending_docs | pending_review | approved | rejected
 */

export const PARTNER_ROLES = ['guide', 'artisan', 'cooperative'];

export function isPartnerRole(role) {
  return PARTNER_ROLES.includes(role);
}

/** Legacy partners without partnerStatus count as approved. */
export function isPartnerApproved(profile) {
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  if (!isPartnerRole(profile.role)) return false;
  if (!profile.partnerStatus) return true;
  return profile.partnerStatus === 'approved';
}

export function isPartnerPending(profile) {
  if (!profile || !isPartnerRole(profile.role)) return false;
  return ['pending_docs', 'pending_review', 'pending'].includes(profile.partnerStatus);
}

export function partnerDashboardPath(role) {
  if (role === 'guide') return '/guide';
  if (role === 'artisan' || role === 'cooperative') return '/artisan';
  return '/partner';
}
