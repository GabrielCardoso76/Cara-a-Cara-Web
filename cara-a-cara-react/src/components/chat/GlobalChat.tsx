import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ref, push, serverTimestamp, onChildAdded, off, query, orderByChild, limitToLast, get } from 'firebase/database'; // Adicionado get
import { doc, getDoc } from 'firebase/firestore';
import { database, firestore } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { GameMessage } from '../../types/game';
import { Link } from 'react-router-dom'; // Adicionada importação do Link
import './GlobalChat.css';

interface GlobalChatProps {
  isOpen: boolean;
  onClose: () => void;
}

// Cache simples em memória para nomes de usuário
const userNamesCache = new Map<string, string>();

const GlobalChat: React.FC<GlobalChatProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const getDisplayName = useCallback(async (uid: string): Promise<string> => {
    if (!uid) return "Anônimo";
    if (userNamesCache.has(uid)) {
      return userNamesCache.get(uid)!;
    }

    try {
      // Tenta buscar do Firestore primeiro (onde os perfis são criados/atualizados)
      const userDocRef = doc(firestore, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const name = userData.displayName || userData.email?.split("@")[0] || `Jogador_${uid.substring(0, 4)}`;
        userNamesCache.set(uid, name);
        return name;
      } else {
        // Fallback para Realtime Database se não encontrado no Firestore (como no original)
        const userRtdbRef = ref(database, `users/${uid}`);
        const snapshot = await get(userRtdbRef); // Corrigido para get(ref(...))
        if (snapshot.exists()) {
            const rtdbUserData = snapshot.val();
            const name = rtdbUserData?.displayName || rtdbUserData?.email?.split("@")[0] || `Jogador_${uid.substring(0, 4)}`;
            userNamesCache.set(uid, name);
            return name;
        }
      }
      const fallbackName = `Usuário_${uid.substring(0, 4)}`;
      userNamesCache.set(uid, fallbackName);
      return fallbackName;

    } catch (error) {
      console.error("Erro ao buscar nome de usuário:", error);
      const errorName = `Erro_${uid.substring(0, 4)}`;
      userNamesCache.set(uid, errorName); // Cache para não tentar de novo imediatamente
      return errorName;
    }
  }, []);


  useEffect(() => {
    if (!isOpen) return; // Só carrega mensagens se o chat estiver aberto

    const globalChatRef = ref(database, "global-chat");
    const messagesQuery = query(globalChatRef, orderByChild('timestamp'), limitToLast(50));

    onChildAdded(messagesQuery, async (snapshot) => { // Variável 'listeners' removida
      const msgData = snapshot.val();
      const senderName = msgData.senderName || await getDisplayName(msgData.senderUid);

      setMessages((prevMessages) => {
        // Evita duplicatas se o listener for acionado múltiplas vezes rapidamente (improvável com onChildAdded)
        if (prevMessages.find(m => m.id === snapshot.key)) return prevMessages;
        return [...prevMessages, {
            id: snapshot.key!,
            ...msgData,
            senderName // Garante que o nome resolvido seja usado
        } as GameMessage];
      });
    });

    return () => {
      off(globalChatRef, 'child_added'); // Desliga todos os child_added listeners no path
      setMessages([]);
    };
  }, [isOpen, getDisplayName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && chatContainerRef.current && !chatContainerRef.current.contains(event.target as Node)) {
        // Verifica se o clique não foi no botão de toggle (que será gerenciado pelo Header)
        const menuToggle = document.getElementById("menu-toggle"); // Supondo que o ID ainda é usado ou uma ref é passada
        if (menuToggle && menuToggle.contains(event.target as Node)) {
          return;
        }
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const senderName = userNamesCache.get(currentUser.uid) || await getDisplayName(currentUser.uid);

    const messageData = {
      senderUid: currentUser.uid, // Alterado de senderId para senderUid para consistência
      senderName: senderName,
      text: newMessage,
      timestamp: serverTimestamp(),
    };

    try {
      await push(ref(database, "global-chat"), messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem global:', error);
      // Adicionar feedback de erro para o usuário
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp || typeof timestamp !== 'number') return "";
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "timestamp inválido";
    }
  };


  return (
    <div ref={chatContainerRef} className={`global-chat-panel ${isOpen ? 'open' : ''}`}>
      <div className="global-chat-header">
        <h3>Chat Global</h3>
        <button onClick={onClose} className="close-chat-button">&times;</button>
      </div>
      <div className="global-chat-messages-area">
        {messages.length === 0 && <p className="no-messages">Nenhuma mensagem global ainda.</p>}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`global-chat-message ${msg.senderUid === currentUser?.uid ? 'sent' : 'received'}`}
          >
            <div className="global-message-header">
                <span className="global-message-user">{msg.senderName}</span>
                <span className="global-message-time">{formatTime(msg.timestamp)}</span>
            </div>
            <div className="global-message-text">{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {currentUser ? (
        <form onSubmit={handleSendMessage} className="global-chat-input-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem global..."
            className="global-chat-input"
            maxLength={200}
          />
          <button type="submit" className="global-send-button" disabled={!newMessage.trim()}>
            Enviar
          </button>
        </form>
      ) : (
        <div className="global-chat-login-prompt">
          Faça <Link to="/login">login</Link> para participar do chat.
        </div>
      )}
    </div>
  );
};

export default GlobalChat;
