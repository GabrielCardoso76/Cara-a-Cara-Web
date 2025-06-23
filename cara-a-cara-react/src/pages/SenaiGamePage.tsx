import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SenaiGamePage: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <h2>Jogo Modo SENAI</h2>
      {/* Conteúdo da página do jogo modo SENAI virá aqui */}
      <p>Usuário logado: {currentUser.displayName || currentUser.email}</p>
    </div>
  );
};

export default SenaiGamePage;
