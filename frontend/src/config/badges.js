// config/badges.js — Badge registry for scalable badge management
// Add new badges here to make them available across the app

import { MdOutlineVerified, MdOutlineManageAccounts } from 'react-icons/md';
import { FaHelmetSafety } from 'react-icons/fa6';

/**
 * Badge registry - add new badges here
 * @type {Object.<string, BadgeConfig>}
 */
export const BADGE_REGISTRY = {
  // Role-based badges
  user: {
    icon: MdOutlineVerified,
    label: 'Verified',
    color: '#22c55e',      // green
    bgColor: '#dcfce7',    // light green
  },
  moderator: {
    icon: FaHelmetSafety,
    label: 'Moderator',
    color: '#8b5cf6',      // purple
    bgColor: '#ede9fe',    // light purple
  },
  admin: {
    icon: MdOutlineManageAccounts,
    label: 'Admin',
    color: '#f59e0b',      // orange
    bgColor: '#fef3c7',    // light orange
  },
  
  // Future badges can be added here:
  // premium: { icon: ..., label: 'Premium', color: ..., bgColor: ... },
  // contributor: { icon: ..., label: 'Contributor', color: ..., bgColor: ... },
  // earlyAdopter: { icon: ..., label: 'Early Adopter', color: ..., bgColor: ... },
};

/**
 * Get badge config by type
 * @param {string} type - Badge type key
 * @returns {BadgeConfig|undefined}
 */
export const getBadge = (type) => BADGE_REGISTRY[type];

/**
 * Get all available badge types
 * @returns {string[]}
 */
export const getBadgeTypes = () => Object.keys(BADGE_REGISTRY);
