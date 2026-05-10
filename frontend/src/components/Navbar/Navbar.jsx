// components/Navbar/Navbar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Navbar.css';

function Navbar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="navbar">
      <div className="navbar-brand">💬 Live Chat</div>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          Home
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => isActive ? 'active' : ''}>
          Chat
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
          Profile
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
            Admin
          </NavLink>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
