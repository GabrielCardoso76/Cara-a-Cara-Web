import { useState, useCallback } from 'react';
import { ref, get, query, orderByChild, startAt, push, serverTimestamp, set } from 'firebase/database';
import { database } from '../services/firebase';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext'; // Assuming AuthContext provides currentUser
import { useNavigate } from 'react-router-dom'; // Assuming react-router-dom for navigation

// Adicione esta interface no topo do arquivo para definir a estrutura de uma sala
interface Room {
  id: string;
  name: string;
  ownerName: string;
  playerCount: number;
  isPrivate: boolean;
  createdAt: number;
  password?: string; // Added password to Room interface
}

const useRoomManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth(); // Get currentUser from AuthContext
  const navigate = useNavigate(); // Get navigate function

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    const roomsRef = ref(database, 'rooms');
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const recentRoomsQuery = query(roomsRef, orderByChild('createdAt'), startAt(fifteenMinutesAgo));

    try {
      const snapshot = await get(recentRoomsQuery);
      const roomsData: Room[] = []; // <<< DECLARAÇÃO CORRETA DA VARIÁVEL

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          // Garantir que o objeto childSnapshot.val() não é null e tem a propriedade createdAt
          const roomValue = childSnapshot.val();
          if (roomValue && typeof roomValue === 'object') {
            roomsData.push({
              id: childSnapshot.key!, // Usar non-null assertion operator pois o key sempre existirá se snapshot.exists() é true
              ...roomValue
            } as Room); // Type assertion para garantir a estrutura
          }
        });
      }

      setIsLoading(false);
      // Tipando os parâmetros 'a' e 'b' e retornando a variável correta
      return roomsData.sort((a: Room, b: Room) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (error: any) {
      console.error("Erro ao listar salas:", error);
      addNotification(`Falha ao buscar salas: ${error.message}`, "error");
      setIsLoading(false);
      return []; // Retorna um array vazio em caso de erro
    }
  }, [addNotification, setIsLoading]); // Adicionado setIsLoading às dependências do useCallback

  // Outras funções do hook podem ser adicionadas aqui

  // Função para criar uma nova sala
  const createRoom = async (roomDetails: { name: string; isPrivate: boolean; password?: string }) => {
    if (!currentUser) throw new Error("Usuário não autenticado.");

    const newRoomRef = push(ref(database, 'rooms'));

    const roomData: Partial<Room> & { ownerId: string; players: { [key: string]: boolean }; gameState: string; createdAt: object } = {
      id: newRoomRef.key,
      name: roomDetails.name,
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || 'Anônimo',
      players: { [currentUser.uid]: true },
      playerCount: 1,
      isPrivate: roomDetails.isPrivate,
      createdAt: serverTimestamp(), // 'serverTimestamp' deve ser importado de 'firebase/database'
      gameState: 'waiting',
    };

    if (roomDetails.isPrivate) {
      roomData.password = roomDetails.password || '';
    }

    await set(newRoomRef, roomData);
    navigate(`/game/${newRoomRef.key}`);
  };

  return { isLoading, fetchRooms, createRoom };
};

export default useRoomManager;
