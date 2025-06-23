import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Adicionado Link
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, firestore } from '../services/firebase'; // Adicionado firestore
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // Para salvar dados adicionais do usuário
import './RegisterPage.css'; // Importando o CSS

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });

      // Salvar informações adicionais do usuário no Firestore
      const userDocRef = doc(firestore, "users", userCredential.user.uid);
      // Salva dados principais/perfil e stats desnormalizados para ranking no mesmo documento
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        displayName: displayName,
        email: email,
        createdAt: serverTimestamp(),
        // Stats desnormalizados para ranking eficiente
        wins: 0,
        losses: 0,
        matches: 0,
        winRate: 0, // Inicialmente 0
      });

      // Opcional: Ainda manter o subdocumento de stats se houver estatísticas mais detalhadas no futuro
      // ou se a estrutura de 'users/{uid}/stats/gameStats' for usada por outra lógica.
      // Por agora, com a desnormalização acima, este pode não ser estritamente necessário para o ranking.
      // Se for mantido, garanta que updateUserStats atualize ambos.
      // Para simplificar, se o ranking SÓ usa os campos acima, podemos remover este.
      // Mas vamos manter por enquanto, caso updateUserStats precise de um local separado.
      const userStatsSubDocRef = doc(firestore, `users/${userCredential.user.uid}/stats`, 'detailedGameStats');
      await setDoc(userStatsSubDocRef, {
        wins: 0,
        losses: 0,
        matches: 0,
        // Poderiam entrar outras stats aqui: longestWinStreak, etc.
      });

      navigate('/'); // Redireciona para a home após o registro
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('Senha muito fraca. Use pelo menos 6 caracteres.');
      } else {
        setError('Falha ao registrar. Tente novamente mais tarde.');
      }
      console.error("Erro no registro:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-container">
      <div className="register-auth-box">
        <h2 className="auth-title">Criar Conta</h2>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="displayName">Nome de Exibição:</label>
            <input
              type="text"
              id="displayName"
              className="auth-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome ou apelido"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha (mín. 6 caracteres):</label>
            <input
              type="password"
              id="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha forte"
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>
        <p className="auth-switch">
          Já tem uma conta?{' '}
          <Link to="/login" className="auth-switch-link">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
