// App.jsx — Router Shell with Authentication
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout/Layout.jsx';
import Home from './pages/Home/Home.jsx';
import Chat from './pages/Chat/Chat.jsx';
import Profile from './pages/Profile/Profile.jsx';
import Login from './pages/Auth/Login.jsx';
import Signup from './pages/Auth/Signup.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes (outside Layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Routes with Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;