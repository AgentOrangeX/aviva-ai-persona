import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles.css';

import { AuthProvider } from './lib/auth.jsx';
import { TopBar, ToastProvider, ProtectedRoute, AdminRoute } from './components/UI.jsx';

import IntroPage from './pages/IntroPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import MyResultsPage from './pages/MyResultsPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminPage from './pages/AdminPage.jsx';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="aurora" aria-hidden="true" />
        <TopBar />
        <main>
          <Routes>
            <Route path="/" element={<IntroPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/my-results" element={<ProtectedRoute><MyResultsPage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="*" element={<div className="center-msg">Page not found.</div>} />
          </Routes>
        </main>
        <footer>
          Aviva AI Persona · A playful way to grow our AI culture
        </footer>
      </ToastProvider>
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
