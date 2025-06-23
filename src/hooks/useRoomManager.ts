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
      const roomsData: Room[] = []; // <<< CORREÇÃO: Variável declarada aqui.

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          roomsData.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
      }

      setIsLoading(false);
      // CORREÇÃO: Tipos adicionados e variável correta sendo retornada.
      return roomsData.sort((a: Room, b: Room) => (b.createdAt || 0) - (a.createdAt || 0));

    } catch (error: any) {
      console.error("Erro ao listar salas:", error);
      addNotification(`Falha ao buscar salas: ${error.message}`, "error");
      setIsLoading(false);
      return []; // Retorna um array vazio para não quebrar a interface.
    }
  }, [addNotification]);

  // Outras funções do hook podem ser adicionadas aqui

  // Função para criar uma nova sala
  const createRoom = async (roomDetails: { name: string; isPrivate: boolean; password?: string }) => {
    if (!currentUser) {
      addNotification("Você precisa estar logado para criar uma sala.", "error");
      return;
    }

    try {
      const newRoomRef = push(ref(database, 'rooms'));

      const roomData: any = {
        id: newRoomRef.key,
        name: roomDetails.name,
        ownerId: currentUser.uid,
        ownerName: currentUser.displayName || 'Anônimo',
        players: { [currentUser.uid]: true },
        playerCount: 1,
        isPrivate: roomDetails.isPrivate,
        createdAt: serverTimestamp(),
        gameState: 'waiting',
      };

      // <<< LÓGICA CORRIGIDA: Adiciona a senha apenas se a sala for privada
      if (roomDetails.isPrivate) {
        if (!roomDetails.password) {
          addNotification("Salas privadas precisam de uma senha.", "error");
          return;
        }
        roomData.password = roomDetails.password;
      }

      await set(newRoomRef, roomData);
      navigate(`/game/${newRoomRef.key}`);
    } catch (error: any) {
      console.error("Erro ao criar sala:", error);
      addNotification(`Falha ao criar sala: ${error.message}`, "error");
    }
  };

  return { isLoading, fetchRooms, createRoom };
};

export default useRoomManager;
