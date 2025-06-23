import { useState, useCallback } from 'react';
import { ref, get, query, orderByChild, startAt } from 'firebase/database'; // Removido serverTimestamp, update, equalTo, limitToFirst que não são usados aqui
import { database } from '../services/firebase'; // Assumindo que este é o caminho correto
import { useNotifications } from '../contexts/NotificationContext'; // Assumindo que este é o caminho correto

// Adicione esta interface no topo do arquivo para definir a estrutura de uma sala
interface Room {
  id: string;
  name: string;
  ownerName: string;
  playerCount: number;
  isPrivate: boolean;
  createdAt: number;
}

const useRoomManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();

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
  return { isLoading, fetchRooms };
};

export default useRoomManager;
