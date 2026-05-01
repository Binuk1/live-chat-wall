// components/OnlineBadge/OnlineBadge.jsx
import './OnlineBadge.css';

function OnlineBadge({ count }) {
  return (
    <span className="online-badge">
      {count} online
    </span>
  );
}

export default OnlineBadge;
