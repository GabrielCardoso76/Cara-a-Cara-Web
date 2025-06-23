import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext'; // Importando NotificationProvider
import NotificationDisplay from './components/notifications/NotificationDisplay'; // Importando Display
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClassicGamePage from './pages/ClassicGamePage';
import SenaiGamePage from './pages/SenaiGamePage';
import SettingsPage from './pages/SettingsPage';
import RankingPage from './pages/RankingPage';
import RulesPage from './pages/RulesPage';
import Header from './components/Header';
import Footer from './components/Footer';
import GlobalChat from './components/chat/GlobalChat';
import './App.css';

// Layout agora é envolvido por ThemeProvider no AppRoutes
const Layout: React.FC = () => {
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);

  const toggleGlobalChat = () => setIsGlobalChatOpen(prev => !prev);
  const closeGlobalChat = () => setIsGlobalChatOpen(false);

  return (
    <div className={`app-container ${isGlobalChatOpen ? 'global-chat-active' : ''}`}>
      <Header onToggleGlobalChat={toggleGlobalChat} isGlobalChatOpen={isGlobalChatOpen} />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <GlobalChat isOpen={isGlobalChatOpen} onClose={closeGlobalChat} />
    </div>
  );
};

const GameLayout: React.FC = () => (
  <GameProvider>
    <Layout />
  </GameProvider>
);

const HomePage: React.FC = () => (
  <div className="page-content">
    <h1>Bem-vindo ao Cara a Cara React!</h1>
    <p>Selecione uma opção no menu acima para começar.</p>
    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
      <Link to="/lobby-classic" className="main-button-react">Jogar Clássico</Link>
      <Link to="/lobby-senai" className="main-button-react">Jogar Modo SENAI</Link>
    </div>
  </div>
);

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="loading-fullscreen">Carregando autenticação...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

// Os imports de ClassicLobbyPage e SenaiLobbyPage já estão no topo do arquivo
// com os outros imports de página. A função App() antiga será removida.

// function App() { ... } // REMOVER ESTA FUNÇÃO ANTIGA COMPLETAMENTE

// Placeholder para página 404 que pode ser usado com o Layout
// const NotFoundPage: React.FC = () => (
//   <div className="page-content" style={{ textAlign: 'center' }}>
//     <h2>Página não encontrada!</h2>
//     <Link to="/" className="main-button-react">Voltar para Home</Link>
//   </div>
// );

// Refatorando a rota "*" para usar um elemento simples dentro do layout, se Layout for pai
// Ou, se Layout não for pai direto de todas as rotas, a página 404 precisa instanciar Header/Footer.
// A estrutura atual com Layout como pai de um grupo de rotas e GameLayout para outro grupo é boa.
// A rota "*" pode ser um problema se quisermos que ela tenha o Layout.
// Solução mais simples para 404:
const SimpleNotFound: React.FC<{onToggleGlobalChat?: () => void; isGlobalChatOpen?: boolean}> = ({onToggleGlobalChat, isGlobalChatOpen}) => (
  <div className="app-container">
    <Header onToggleGlobalChat={onToggleGlobalChat || (() => {})} isGlobalChatOpen={isGlobalChatOpen || false} />
    <main className="main-content page-content" style={{ textAlign: 'center'}}>
      <h2>Página não encontrada!</h2>
      <Link to="/" className="main-button-react">Voltar para Home</Link>
    </main>
    <Footer />
  </div>
);

// Re-declarando App para usar SimpleNotFound na rota *
function AppRoutes() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
            <Route path="/rules" element={<ProtectedRoute><RulesPage /></ProtectedRoute>} />
            <Route path="/lobby-classic" element={<ProtectedRoute><ClassicLobbyPage /></ProtectedRoute>} />
            <Route path="/lobby-senai" element={<ProtectedRoute><SenaiLobbyPage /></ProtectedRoute>} />
          </Route>

          <Route element={<GameLayout />}>
            <Route
              path="/play-classic/:roomId"
              element={<ProtectedRoute><ClassicGamePage /></ProtectedRoute>}
            />
            <Route
              path="/play-senai/:roomId"
              element={<ProtectedRoute><SenaiGamePage /></ProtectedRoute>}
            />
          </Route>

          <Route path="*" element={
             // Para a página 404 ter o layout consistente, incluindo o chat global
            <Layout /> // Use o Layout, que agora renderiza Outlet. Precisamos de um componente 404.
          } />
           {/* Substituindo o Route acima por um que renderize um conteúdo 404 dentro do Layout */}
           {/* Esta abordagem é mais complexa para 404. Simplificando por agora: */}
           {/* <Route path="*" element={<NotFoundPage />} /> // Onde NotFoundPage usa o Layout */}
           {/* Ou, para manter o Header/Footer simples: */}
           {/* <Route path="*" element={
            <div className="app-container">
              <Header onToggleGlobalChat={() => {}} isGlobalChatOpen={false} /> // Dummy props
              <main className="main-content page-content" style={{ textAlign: 'center'}}>
                <h2>Página não encontrada!</h2>
                <Link to="/" className="main-button-react">Voltar para Home</Link>
              </main>
              <Footer />
            </div>
          } /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
// Placeholder para página 404 que pode ser usado com o Layout
// const NotFoundPage: React.FC = () => (
//   <div className="page-content" style={{ textAlign: 'center' }}>
//     <h2>Página não encontrada!</h2>
//     <Link to="/" className="main-button-react">Voltar para Home</Link>
//   </div>
// );

// Refatorando a rota "*" para usar um elemento simples dentro do layout, se Layout for pai
// Ou, se Layout não for pai direto de todas as rotas, a página 404 precisa instanciar Header/Footer.
// A estrutura atual com Layout como pai de um grupo de rotas e GameLayout para outro grupo é boa.
// A rota "*" pode ser um problema se quisermos que ela tenha o Layout.
// Solução mais simples para 404:
const SimpleNotFound: React.FC<{onToggleGlobalChat?: () => void; isGlobalChatOpen?: boolean}> = ({onToggleGlobalChat, isGlobalChatOpen}) => (
  <div className="app-container">
    <Header onToggleGlobalChat={onToggleGlobalChat || (() => {})} isGlobalChatOpen={isGlobalChatOpen || false} />
    <main className="main-content page-content" style={{ textAlign: 'center'}}>
      <h2>Página não encontrada!</h2>
      <Link to="/" className="main-button-react">Voltar para Home</Link>
    </main>
    <Footer />
  </div>
);

// Re-declarando App para usar SimpleNotFound na rota *
function AppRoutes() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <Router>
            <NotificationDisplay /> {/* Renderiza o display de notificações globalmente */}
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
                <Route path="/rules" element={<ProtectedRoute><RulesPage /></ProtectedRoute>} />
                <Route path="/lobby-classic" element={<ProtectedRoute><ClassicLobbyPage /></ProtectedRoute>} />
                <Route path="/lobby-senai" element={<ProtectedRoute><SenaiLobbyPage /></ProtectedRoute>} />
              </Route>

              <Route element={<GameLayout />}>
                <Route
                  path="/play-classic/:roomId"
                  element={<ProtectedRoute><ClassicGamePage /></ProtectedRoute>}
                />
                <Route
                  path="/play-senai/:roomId"
                  element={<ProtectedRoute><SenaiGamePage /></ProtectedRoute>}
                />
              </Route>

              <Route path="*" element={<SimpleNotFound />} />
            </Routes>
          </Router>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}


export default AppRoutes; // Exportando o novo App
