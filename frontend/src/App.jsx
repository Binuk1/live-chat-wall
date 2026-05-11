// App.jsx — Router Shell with Authentication
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout/Layout.jsx';
import Home from './pages/Home/Home.jsx';
import Chat from './pages/Chat/Chat.jsx';
import Profile from './pages/Profile/Profile.jsx';
import Admin from './pages/Admin/Admin.jsx';
import Settings from './pages/Settings/Settings.jsx';
import Login from './pages/Auth/Login.jsx';
import Signup from './pages/Auth/Signup.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';
import Banned from './pages/Banned/Banned.jsx';
import ProtectedRoute from './components/ProtectedRoute/index.jsx';
import DevToolsWarning from './components/DevToolsWarning/DevToolsWarning.jsx';

function App() {
  return (
    <AuthProvider>
      <DevToolsWarning />
      <Routes>
        {/* Public routes (outside Layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/banned" element={<Banned />} />

        {/* Routes with Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="profile/:username" element={<Profile />} />
          <Route path="settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="admin" element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          } />
          {/* Catch-all 404 route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;