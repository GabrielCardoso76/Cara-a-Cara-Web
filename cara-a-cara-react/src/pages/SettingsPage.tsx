import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase';
import './SettingsPage.css'; // Criaremos este arquivo

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme, setTheme, accentColor, setAccentColor, resetThemeSettings } = useTheme();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [newAccentColor, setNewAccentColor] = useState(accentColor);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loadingName, setLoadingName] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
    }
  }, [currentUser]);

  useEffect(() => {
    setNewAccentColor(accentColor); // Sincroniza o input de cor com o contexto
  }, [accentColor]);

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !displayName.trim()) {
      setFeedback({ type: 'error', message: 'Nome não pode estar vazio.' });
      return;
    }
    if (displayName.trim() === currentUser.displayName) {
        setFeedback({ type: 'info', message: 'O nome de exibição já é este.' }); // Info type
        return;
    }

    setLoadingName(true);
    setFeedback(null);
    try {
      await updateProfile(currentUser, { displayName: displayName.trim() });
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await updateDoc(userDocRef, { displayName: displayName.trim() });
      // O AuthContext irá pegar a atualização do currentUser.displayName automaticamente.
      // Se houver desnormalização de displayName em outros lugares (ex: stats), atualizar lá também.
      setFeedback({ type: 'success', message: 'Nome atualizado com sucesso!' });
    } catch (error: any) {
      console.error("Erro ao atualizar nome:", error);
      setFeedback({ type: 'error', message: `Falha ao atualizar nome: ${error.message}` });
    } finally {
      setLoadingName(false);
    }
  };

  const handleThemeChange = (selectedTheme: typeof theme) => {
    setTheme(selectedTheme);
     setFeedback({ type: 'success', message: `Tema ${selectedTheme} aplicado.` });
  };

  const handleAccentColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAccentColor(e.target.value);
  };

  const applyAccentColor = () => {
    setAccentColor(newAccentColor);
    setFeedback({ type: 'success', message: 'Cor de destaque aplicada.' });
  };

  const handleResetSettings = () => {
    resetThemeSettings();
    // Se quiser resetar o nome para o original, precisaria de mais lógica ou um estado inicial
    setFeedback({ type: 'success', message: 'Configurações de tema restauradas.' });
  };

  return (
    <div className="settings-page-container page-content">
      <h2 className="settings-title">Configurações</h2>

      {feedback && (
        <div className={`feedback-message ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleNameUpdate} className="settings-section">
        <h3>Alterar Nome de Exibição</h3>
        <div className="form-group">
          <label htmlFor="displayName">Novo nome:</label>
          <input
            type="text"
            id="displayName"
            className="settings-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loadingName}
          />
        </div>
        <button type="submit" className="settings-button" disabled={loadingName}>
          {loadingName ? "Salvando..." : "Salvar Nome"}
        </button>
      </form>

      <div className="settings-section">
        <h3>Tema da Interface</h3>
        <div className="theme-options">
          <button
            onClick={() => handleThemeChange('valorant')}
            className={`theme-option-button ${theme === 'valorant' ? 'active' : ''}`}
          >
            Valorant (Padrão)
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`theme-option-button ${theme === 'dark' ? 'active' : ''}`}
          >
            Escuro
          </button>
          <button
            onClick={() => handleThemeChange('light')}
            className={`theme-option-button ${theme === 'light' ? 'active' : ''}`}
          >
            Claro
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Cor de Destaque Principal</h3>
        <div className="color-picker-group">
          <input
            type="color"
            id="accent-color-input"
            className="settings-color-picker"
            value={newAccentColor}
            onChange={handleAccentColorChange}
          />
          <button onClick={applyAccentColor} className="settings-button apply-color-button">
            Aplicar Cor
          </button>
        </div>
         <p className="color-preview-text">Cor atual: <span style={{color: newAccentColor, fontWeight:'bold'}}>{newAccentColor}</span></p>
      </div>

      <div className="settings-section">
        <h3>Restaurar Padrões</h3>
        <button onClick={handleResetSettings} className="settings-button reset-button">
          Restaurar Tema e Cor
        </button>
      </div>

    </div>
  );
};

export default SettingsPage;
