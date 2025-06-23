import { useCallback, useState } from 'react';
import { ref, push, serverTimestamp, set, get, update, query, orderByChild, equalTo, limitToFirst, runTransaction } from 'firebase/database';
import { database } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { RoomData, Player } from '../types/game'; // Supondo que Player e RoomData estejam definidos
import { useNavigate } from 'react-router-dom';

export interface ListedRoom extends Partial<RoomData> {
    id: string;
    playerCount: number;
    // gameMode já está em RoomData
}

export const useRoomManager = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const createRoom = useCallback(async (gameMode: 'classic' | 'senai', roomName?: string /* Opcional */) => {
    if (!currentUser) {
      addNotification("Você precisa estar logado para criar uma sala.", "error");
      return null;
    }
    setIsLoading(true);
    const roomsRef = ref(database, 'rooms');
    const newRoomRef = push(roomsRef); // Gera um ID único
    const roomId = newRoomRef.key;

    if (!roomId) {
      addNotification("Falha ao gerar ID da sala.", "error");
      setIsLoading(false);
      return null;
    }

    const initialPlayer: Player = {
      uid: currentUser.uid,
      displayName: currentUser.displayName || currentUser.email || 'Jogador Anônimo',
    };

    const newRoomData: RoomData = {
      roomId: roomId,
      roomName: roomName || `Sala de ${initialPlayer.displayName}`, // Nome da sala
      owner: currentUser.uid,
      players: {
        [currentUser.uid]: initialPlayer, // Jogador criador
      },
      createdAt: serverTimestamp() as any, // Firebase irá converter para timestamp
      gameMode: gameMode,
      // Estado inicial do jogo
      sortedCharacterOwner: null,
      sortedCharacterVisitor: null,
      ownerCharacterReady: false,
      visitorCharacterReady: false,
      charactersSorted: false,
      diceValues: { owner: null, visitor: null, ownerReady: false, visitorReady: false },
      diceResultsShown: false,
      currentPlayer: null,
      gameEnded: false,
      messages: {}, // Inicializa o chat vazio
      notifications: {}, // Inicializa notificações vazias
    };

    try {
      await set(newRoomRef, newRoomData);
      addNotification(`Sala "${newRoomData.roomName}" criada com sucesso!`, "success");
      setIsLoading(false);
      navigate(`/play-${gameMode}/${roomId}`); // Navega para a sala
      return roomId;
    } catch (error: any) {
      console.error("Erro ao criar sala:", error);
      addNotification(`Falha ao criar sala: ${error.message}`, "error");
      setIsLoading(false);
      return null;
    }
  }, [currentUser, addNotification, navigate]);

  const joinRoom = useCallback(async (roomId: string) => {
    if (!currentUser) {
      addNotification("Você precisa estar logado para entrar em uma sala.", "error");
      return false;
    }
    if (!roomId) {
      addNotification("ID da sala inválido.", "error");
      return false;
    }
    setIsLoading(true);
    const roomRef = ref(database, `rooms/${roomId}`);

    try {
      const result = await runTransaction(roomRef, (currentData: RoomData | null) => {
        if (currentData === null) {
          addNotification("Sala não encontrada.", "error");
          return; // Aborta a transação
        }
        if (currentData.gameEnded) {
            addNotification("Este jogo já terminou.", "info");
            return;
        }
        if (Object.keys(currentData.players || {}).length >= 2 && !currentData.players[currentUser.uid]) {
          addNotification("A sala está cheia.", "warning");
          return; // Aborta a transação
        }
        if (currentData.players[currentUser.uid]) {
            // Usuário já está na sala (pode ser o dono ou reentrando)
            // Não precisa fazer nada na transação, apenas permitir a navegação
            return currentData;
        }

        const newPlayer: Player = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email || 'Jogador Anônimo',
        };
        // Adiciona o novo jogador
        if (!currentData.players) {
          currentData.players = {};
        }
        currentData.players[currentUser.uid] = newPlayer;

        // Se for o segundo jogador, pode definir quem começa ou alguma lógica de "pronto"
        // Por exemplo, se o dono já sorteou o personagem, o visitante pode sortear agora.
        // A lógica de quem começa já está no GameContext baseada nos dados.

        return currentData;
      });

      if (result.committed && result.snapshot.exists()) {
        addNotification("Você entrou na sala!", "success");
        setIsLoading(false);
        const roomData = result.snapshot.val() as RoomData;
        navigate(`/play-${roomData.gameMode}/${roomId}`);
        return true;
      } else if (!result.committed && result.snapshot.val() === null) {
        // A transação foi abortada porque a sala não existe (currentData era null)
        // addNotification já foi chamado dentro da transação
        setIsLoading(false);
        return false;
      } else if (!result.committed) {
        // A transação foi abortada por outro motivo (sala cheia, jogo terminado)
        // addNotification já foi chamado dentro da transação
        setIsLoading(false);
        return false;
      }

      setIsLoading(false);
      return false; // Caso padrão
    } catch (error: any) {
      console.error("Erro ao entrar na sala:", error);
      addNotification(`Falha ao entrar na sala: ${error.message}`, "error");
      setIsLoading(false);
      return false;
    }
  }, [currentUser, addNotification, navigate]);

  const listAvailableRooms = useCallback(async (gameMode?: 'classic' | 'senai'): Promise<ListedRoom[]> => {
    setIsLoading(true);
    const roomsRef = ref(database, 'rooms');
    // Query para buscar salas: não terminadas, e com menos de 2 jogadores (ou onde o jogador atual já está)
    // Firebase RTDB tem limitações em queries complexas.
    // Uma forma é buscar todas e filtrar no cliente, ou desnormalizar playerCount e gameEnded.
    // Para uma lista simples, vamos buscar e filtrar. Para apps maiores, desnormalizar seria melhor.

    let roomsQuery = query(roomsRef, orderByChild('createdAt'), limitToLast(50)); // Pega as mais recentes
    // Se gameMode for fornecido, precisaria de um índice composto ou filtrar no cliente.
    // Ex: query(roomsRef, orderByChild('gameMode'), equalTo(gameMode), limitToLast(20))
    // Isso requer que `gameMode` seja indexado no Firebase rules.

    try {
      const snapshot = await get(roomsQuery);
      const roomsData: ListedRoom[] = [];
      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          const room = childSnapshot.val() as RoomData;
          const playerCount = Object.keys(room.players || {}).length;
          if (!room.gameEnded && (playerCount < 2 || (currentUser && room.players[currentUser.uid]))) {
            if (gameMode && room.gameMode !== gameMode) return; // Filtra por modo de jogo se especificado

            roomsData.push({
              id: childSnapshot.key!,
              roomName: room.roomName,
              owner: room.owner, // Pode ser útil para mostrar quem criou
              playerCount: playerCount,
              gameMode: room.gameMode,
              createdAt: room.createdAt,
            });
          }
        });
      }
      setIsLoading(false);
      return roomsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Mais recentes primeiro
    } catch (error: any) {
      console.error("Erro ao listar salas:", error);
      addNotification(`Falha ao buscar salas: ${error.message}`, "error");
      setIsLoading(false);
      return [];
    }
  }, [currentUser, addNotification]);


  return { createRoom, joinRoom, listAvailableRooms, isLoading };
};
