import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import WelcomeScreen from './components/WelcomeScreen';
import LoginScreen from './components/LoginScreen';
import QuizScreen from './components/QuizScreen';
import RankingBoard from './components/RankingBoard';
import AdminPanel from './components/AdminPanel';
import { incrementAccessCount, saveScore } from './firebase';

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [role, setRole]     = useState('');
  const [user, setUser]     = useState({ name: '', class: '', role: '' });
  const [currentUserScoreId, setCurrentUserScoreId] = useState(null);

  // ── THEME ──────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('quiz-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quiz-theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  // ── ACCESS COUNTER ─────────────────────────────────────
  useEffect(() => {
    incrementAccessCount().catch(console.error);
  }, []);

  // ── NAVIGATION ─────────────────────────────────────────
  const handleNextFromWelcome = () => setScreen('login');
  const handleBackFromLogin   = () => setScreen('welcome');
  const handleAdminTrigger    = () => setScreen('admin');

  const handleLogin = (userDetails) => {
    setUser(userDetails);
    setScreen('quiz');
  };

  const handleQuizComplete = async ({ score, timeTaken }) => {
    try {
      const savedRecord = await saveScore(
        user.name, user.role, user.class, score, timeTaken
      );
      if (savedRecord?.id) setCurrentUserScoreId(savedRecord.id);
    } catch (e) {
      console.error('Erro ao salvar pontuação:', e);
    }
    setScreen('ranking');
  };

  const handleRestart = () => {
    setRole('');
    setUser({ name: '', class: '', role: '' });
    setCurrentUserScoreId(null);
    setScreen('welcome');
  };

  const handleCloseAdmin = () => {
    setRole('');
    setScreen('welcome');
  };

  return (
    <>
      {/* ── Fixed Theme Toggle ── */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        id="btn-theme-toggle"
        aria-label="Alternar tema"
        title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
      >
        {theme === 'dark'
          ? <><Sun size={16} /> Claro</>
          : <><Moon size={16} /> Escuro</>
        }
      </button>

      {/* ── App ── */}
      <main className="app-wrapper">
        {screen === 'welcome' && (
          <WelcomeScreen
            role={role}
            setRole={setRole}
            onNext={handleNextFromWelcome}
          />
        )}

        {screen === 'login' && (
          <LoginScreen
            role={role}
            onBack={handleBackFromLogin}
            onLogin={handleLogin}
            onAdminTrigger={handleAdminTrigger}
          />
        )}

        {screen === 'quiz' && (
          <QuizScreen
            userName={user.name}
            userClass={user.class}
            userRole={user.role}
            onQuizComplete={handleQuizComplete}
          />
        )}

        {screen === 'ranking' && (
          <RankingBoard
            currentUserScoreId={currentUserScoreId}
            onRestart={handleRestart}
          />
        )}

        {screen === 'admin' && (
          <AdminPanel onClose={handleCloseAdmin} />
        )}
      </main>
    </>
  );
}
