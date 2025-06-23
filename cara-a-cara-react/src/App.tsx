import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext'; // Importando NotificationProvider
import NotificationDisplay from './components/notifications/NotificationDisplay'; // Importando Display
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClassicLobbyPage from './pages/ClassicLobbyPage'; // Adicionado
import SenaiLobbyPage from './pages/SenaiLobbyPage';   // Adicionado
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
  const location = useLocation();
  const [isSenaiRoute, setIsSenaiRoute] = useState(false);

  useEffect(() => {
    const senaiPath = location.pathname.startsWith('/lobby-senai') || location.pathname.startsWith('/play-senai');
    setIsSenaiRoute(senaiPath);

    // Adiciona/remove a classe do body também para maior flexibilidade
    if (senaiPath) {
      document.body.classList.add('senai-theme');
    } else {
      document.body.classList.remove('senai-theme');
    }
    // Cleanup para remover a classe do body quando o componente desmontar ou a rota mudar
    return () => {
      document.body.classList.remove('senai-theme');
    };
  }, [location.pathname]);

  const toggleGlobalChat = () => setIsGlobalChatOpen(prev => !prev);
  const closeGlobalChat = () => setIsGlobalChatOpen(false);

  const appContainerClasses = [
    'app-container',
    isGlobalChatOpen ? 'global-chat-active' : '',
    isSenaiRoute ? 'senai-theme' : '' // Adiciona a classe ao app-container
  ].filter(Boolean).join(' ');

  return (
    <div className={appContainerClasses}>
      <Header onToggleGlobalChat={toggleGlobalChat} isGlobalChatOpen={isGlobalChatOpen} />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <GlobalChat isOpen={isGlobalChatOpen} onClose={closeGlobalChat} />
    </div>
  );
};

// GameLayout já usa Layout, então as classes senai-theme serão aplicadas automaticamente.
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
// Os imports de ClassicLobbyPage e SenaiLobbyPage já estão no topo do arquivo
// com os outros imports de página.

// Solução mais simples para 404:
// A primeira definição de SimpleNotFound e AppRoutes foi removida.
// Mantendo a segunda (e mais completa) definição abaixo.

const SimpleNotFound: React.FC<{onToggleGlobalChat?: () => void; isGlobalChatOpen?: boolean}> = ({onToggleGlobalChat, isGlobalChatOpen}) => (
  <div className="app-container">
    {/* O Header/Footer aqui é para o caso de SimpleNotFound ser usado fora de um Layout que já os proveja.
        No entanto, AppRoutes agora usa SimpleNotFound diretamente na rota '*', então ele terá seu próprio Header/Footer.
        Se quiséssemos que a página 404 usasse o mesmo Layout e chat global,
        teríamos que ter uma rota dentro do <Route element={<Layout />}> que levasse a um componente NotFound
        ou passar as props de chat para SimpleNotFound se ele for renderizado fora do Layout.
        A abordagem atual com SimpleNotFound tendo seu próprio Header/Footer é mais simples para uma página 404 autônoma.
    */}
    <Header onToggleGlobalChat={onToggleGlobalChat || (() => {})} isGlobalChatOpen={isGlobalChatOpen || false} />
    <main className="main-content page-content" style={{ textAlign: 'center'}}>
      <h2>Página não encontrada!</h2>
      <Link to="/" className="main-button-react">Voltar para Home</Link>
    </main>
    <Footer />
  </div>
);

// AppRoutes agora é a única função exportada e contém todos os Providers.
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

              {/* Rotas que usam o Layout principal (com Header, Footer, GlobalChat) */}
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
                <Route path="/rules" element={<ProtectedRoute><RulesPage /></ProtectedRoute>} />
                <Route path="/lobby-classic" element={<ProtectedRoute><ClassicLobbyPage /></ProtectedRoute>} />
                <Route path="/lobby-senai" element={<ProtectedRoute><SenaiLobbyPage /></ProtectedRoute>} />
              </Route>

              {/* Rotas de Jogo que usam o GameLayout (GameProvider + Layout) */}
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

              {/* Rota para páginas não encontradas */}
              <Route path="*" element={<SimpleNotFound />} />
            </Routes>
          </Router>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default AppRoutes; // Exportando o AppRoutes principal
