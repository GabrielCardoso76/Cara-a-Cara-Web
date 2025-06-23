import React, { useState, useEffect } from 'react';
import { useRoomManager, ListedRoom } from '../hooks/useRoomManager';
import './LobbyPage.css'; // Reutiliza o mesmo CSS

const SenaiLobbyPage: React.FC = () => {
  const { createRoom, joinRoom, listAvailableRooms, isLoading } = useRoomManager();
  const [availableRooms, setAvailableRooms] = useState<ListedRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');

  const fetchRooms = async () => {
    const rooms = await listAvailableRooms('senai');
    setAvailableRooms(rooms);
  };

  useEffect(() => {
    fetchRooms();
  }, [listAvailableRooms]);

  const handleCreateRoom = async () => {
    await createRoom('senai', newRoomName.trim() || undefined);
    setNewRoomName('');
    fetchRooms();
  };

  const handleJoinRoom = async (roomId: string) => {
    await joinRoom(roomId);
  };

  const handleRefreshRooms = () => {
    fetchRooms();
  };

  return (
    <div className="lobby-page-container page-content">
      <h2 className="lobby-title">Lobby - Jogo Modo SENAI</h2>

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
          <button onClick={handleCreateRoom} disabled={isLoading} className="lobby-button create-button">
            {isLoading ? 'Criando...' : 'Criar Nova Sala (SENAI)'}
          </button>
        </div>
        <button onClick={handleRefreshRooms} disabled={isLoading} className="lobby-button refresh-button">
          {isLoading ? 'Atualizando...' : 'Atualizar Lista'}
        </button>
      </div>

      <div className="room-list-section">
        <h3>Salas Disponíveis (Modo SENAI)</h3>
        {isLoading && availableRooms.length === 0 && <p className="loading-text">Carregando salas...</p>}
        {!isLoading && availableRooms.length === 0 && <p className="no-rooms-text">Nenhuma sala modo SENAI disponível. Crie uma!</p>}

        <ul className="room-list">
          {availableRooms.map(room => (
            <li key={room.id} className="room-list-item">
              <div className="room-info">
                <span className="room-name">{room.roomName || `Sala de ${room.owner?.substring(0,6)}`}</span>
                <span className="room-details">({room.playerCount}/2 jogadores) - Criada por: {room.owner ? room.owner.substring(0,6) : 'Desconhecido'}</span>
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

export default SenaiLobbyPage;
