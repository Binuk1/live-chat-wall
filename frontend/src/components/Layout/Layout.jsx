// components/Layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar.jsx';
import './Layout.css';

function Layout() {
  return (
    <div className="app">
      <Navbar />
      <div className="layout-content">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
