import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import './Header.css';

// Ícone de Chat (SVG simples)
const ChatIcon: React.FC<{ color?: string }> = ({ color = "white" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={color} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);


interface HeaderProps {
  onToggleGlobalChat: () => void;
  isGlobalChatOpen: boolean; // Para mudar o estilo do botão se o chat estiver aberto
}

const Header: React.FC<HeaderProps> = ({ onToggleGlobalChat, isGlobalChatOpen }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      alert("Erro ao sair. Tente novamente.");
    }
  };

  return (
    <header className="header-container">
      <div className="logo" onClick={() => navigate('/')}>
        Cara a Cara
      </div>
      <nav className="nav-buttons">
        <Link to="/settings" className="nav-button">Configurações</Link>
        {/* Os links de Jogar foram para a HomePage/Lobby, mas poderiam estar aqui também se o usuário estiver logado */}
        {/* {currentUser && <Link to="/lobby-classic" className="nav-button">Jogar Clássico</Link>}
        {currentUser && <Link to="/lobby-senai" className="nav-button">Jogar Modo SENAI</Link>} */}
        <Link to="/ranking" className="nav-button">Ranking</Link>
        <Link to="/rules" className="nav-button">Regras</Link>
      </nav>
      <div className="header-right-controls">
        <div className="auth-status">
          {currentUser ? (
            <>
              <span className="user-greeting">Olá, {currentUser.displayName || currentUser.email?.split('@')[0]}</span>
              <button onClick={handleLogout} className="logout-button">Sair</button>
            </>
          ) : (
            <Link to="/login" className="login-link">Fazer Login</Link>
          )}
        </div>
        <button
          id="menu-toggle" // Mantendo ID para referência se o GlobalChat precisar (embora props seja melhor)
          className={`menu-toggle-button ${isGlobalChatOpen ? 'chat-open' : ''}`}
          onClick={onToggleGlobalChat}
          aria-label={isGlobalChatOpen ? "Fechar chat global" : "Abrir chat global"}
        >
          <ChatIcon color={isGlobalChatOpen ? '#ff4655' : 'white'} />
        </button>
      </div>
    </header>
  );
};

export default Header;
