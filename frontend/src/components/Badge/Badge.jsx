// components/Badge/Badge.jsx — Reusable badge component
import { getBadge } from '../../config/badges.js';
import './Badge.css';

/**
 * Badge component - renders a badge with icon
 * @param {Object} props
 * @param {string} props.type - Badge type from BADGE_REGISTRY
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Badge size
 * @param {boolean} [props.showLabel=true] - Show text label
 */
function Badge({ type, size = 'md', showLabel = true }) {
  const badge = getBadge(type);
  
  if (!badge) {
    console.warn(`Badge type "${type}" not found in registry`);
    return null;
  }
  
  const Icon = badge.icon;
  
  return (
    <span 
      className={`badge badge-${size}`}
      style={{ 
        color: badge.color,
        backgroundColor: badge.bgColor 
      }}
      title={badge.label}
    >
      <Icon className="badge-icon" />
      {showLabel && <span className="badge-label">{badge.label}</span>}
    </span>
  );
}

export default Badge;
