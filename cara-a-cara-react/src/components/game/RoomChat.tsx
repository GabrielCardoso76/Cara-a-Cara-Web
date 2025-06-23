import React, { useState, useEffect, useRef } from 'react';
import { ref, push, serverTimestamp, onChildAdded, off, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { GameMessage } from '../../types/game'; // Supondo que GameMessage está em types/game
import './RoomChat.css';

interface RoomChatProps {
  roomId: string | null;
}

const RoomChat: React.FC<RoomChatProps> = ({ roomId }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null); // Para auto-scroll

  useEffect(() => {
    if (!roomId) {
      setMessages([]); // Limpa mensagens se não houver sala
      return;
    }

    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    // Query para pegar as últimas N mensagens, ordenadas por timestamp
    // O Firebase RTDB ordena por chave (push ID) por padrão se não houver orderBy,
    // o que geralmente é cronológico. Se usarmos serverTimestamp, orderByChild é mais robusto.
    const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(50)); // Pega as últimas 50

    const handleNewMessage = (snapshot: any) => {
      const msgData = snapshot.val();
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: snapshot.key, ...msgData } as GameMessage,
      ]);
    };

    onChildAdded(messagesQuery, handleNewMessage);

    return () => {
      // `off` precisa da mesma referência da query ou do ref original para desligar listeners específicos.
      // Se usarmos messagesQuery, precisamos garantir que a referência seja estável ou desligar tudo no path.
      // Por simplicidade e robustez, desligar todos os listeners 'child_added' no path é mais seguro aqui.
      off(ref(database, `rooms/${roomId}/messages`), 'child_added');
      setMessages([]); // Limpa mensagens ao sair da sala ou desmontar
    };
  }, [roomId]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !roomId) return;

    const messageData = {
      text: newMessage,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email || 'Anônimo',
      timestamp: serverTimestamp(), // Firebase substitui isso pelo timestamp do servidor
    };

    try {
      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      await push(messagesRef, messageData);
      setNewMessage(''); // Limpa o input
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Adicionar feedback de erro para o usuário
    }
  };

  if (!roomId) {
    return <div className="room-chat-disabled">Selecione uma sala para ver o chat.</div>;
  }

  return (
    <div className="room-chat-container">
      <div className="chat-messages-area">
        {messages.length === 0 && <p className="no-messages">Nenhuma mensagem ainda. Seja o primeiro!</p>}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.senderId === currentUser?.uid ? 'sent' : 'received'}`}
          >
            <div className="message-sender">{msg.senderName}</div>
            <div className="message-text">{msg.text}</div>
            {/* <div className="message-time">
              {msg.timestamp ? new Date(msg.timestamp as number).toLocaleTimeString() : 'Enviando...'}
            </div> */}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="chat-input"
          maxLength={250}
        />
        <button type="submit" className="send-button" disabled={!newMessage.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
};

export default RoomChat;
