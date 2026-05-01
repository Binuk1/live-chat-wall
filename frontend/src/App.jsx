// App.jsx — Dumb Router Shell
// CRITICAL: This file contains NO logic, NO state, NO socket/ API calls
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout/Layout.jsx';
import Home from './pages/Home/Home.jsx';
import Chat from './pages/Chat/Chat.jsx';
import Profile from './pages/Profile/Profile.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="chat" element={<Chat />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;