import React, { useState, useEffect } from 'react';
// Removido Link não utilizado diretamente aqui para navegação, useNavigate está em useRoomManager
import { useRoomManager, ListedRoom } from '../hooks/useRoomManager';
import './LobbyPage.css'; // Criaremos este CSS compartilhado ou específico

const ClassicLobbyPage: React.FC = () => {
  const { createRoom, joinRoom, listAvailableRooms, isLoading } = useRoomManager();
  const [availableRooms, setAvailableRooms] = useState<ListedRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [roomVisibility, setRoomVisibility] = useState<'public' | 'private'>('public');
  const [roomPassword, setRoomPassword] = useState('');

  const fetchRooms = async () => {
    const rooms = await listAvailableRooms('classic');
    setAvailableRooms(rooms);
  };

  useEffect(() => {
    fetchRooms();
    // TODO: Adicionar listener para atualizações em tempo real ou um intervalo de atualização
  }, [listAvailableRooms]); // listAvailableRooms é estável, mas re-executa se a instância do hook mudar

  const handleCreateRoom = async () => {
    const roomName = newRoomName.trim() || undefined;
    const password = roomVisibility === 'private' ? roomPassword : undefined;
    // Adicionar validação de senha aqui se necessário (ex: não vazia para sala privada)
    if (roomVisibility === 'private' && !password) {
      alert("Salas privadas devem ter uma senha."); // Substituir por notificação do sistema depois
      return;
    }
    await createRoom('classic', roomName, roomVisibility, password);
    setNewRoomName('');
    setRoomPassword('');
    setRoomVisibility('public');
    fetchRooms(); // Atualiza a lista após criar
  };

  const handleJoinRoom = async (roomId: string) => {
    await joinRoom(roomId);
    // Navegação ocorre dentro de joinRoom se bem-sucedido
  };

  const handleRefreshRooms = () => {
    fetchRooms();
  };

  return (
    <div className="lobby-page-container page-content">
      <h2 className="lobby-title">Lobby - Jogo Clássico</h2>

      <div className="lobby-actions">
        <div className="create-room-section">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Nome da nova sala (opcional)"
            className="lobby-input"
            disabled={isLoading}
          />
          <div className="room-options">
            <label className="lobby-label">
              Visibilidade:
              <select value={roomVisibility} onChange={(e) => setRoomVisibility(e.target.value as 'public' | 'private')} disabled={isLoading} className="lobby-select">
                <option value="public">Pública</option>
                <option value="private">Privada</option>
              </select>
            </label>
            {roomVisibility === 'private' && (
              <input
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Senha da sala"
                className="lobby-input"
                disabled={isLoading}
              />
            )}
          </div>
          <button onClick={handleCreateRoom} disabled={isLoading} className="lobby-button create-button">
            {isLoading ? 'Criando...' : 'Criar Nova Sala'}
          </button>
        </div>
        <button onClick={handleRefreshRooms} disabled={isLoading} className="lobby-button refresh-button">
            {isLoading ? 'Atualizando...' : 'Atualizar Lista'}
        </button>
      </div>

      <div className="room-list-section">
        <h3>Salas Disponíveis (Modo Clássico)</h3>
        {isLoading && availableRooms.length === 0 && <p className="loading-text">Carregando salas...</p>}
        {!isLoading && availableRooms.length === 0 && <p className="no-rooms-text">Nenhuma sala clássica disponível. Crie uma!</p>}

        <ul className="room-list">
          {availableRooms.map(room => (
            <li key={room.id} className="room-list-item">
              <div className="room-info">
                <span className="room-name">
                  {room.visibility === 'private' && <span className="private-icon">🔒 </span>}
                  {room.roomName || `Sala de ${room.ownerName || room.owner?.substring(0,6)}`}
                </span>
                <span className="room-details">({room.playerCount}/2 jogadores) - Criada por: {room.ownerName || (room.owner ? room.owner.substring(0,6) : 'Desconhecido')}</span>
              </div>
              <button
                onClick={() => handleJoinRoom(room.id)}
                disabled={isLoading || room.playerCount >= 2}
                className="lobby-button join-button"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ClassicLobbyPage;
