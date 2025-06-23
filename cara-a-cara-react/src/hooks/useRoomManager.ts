import { useCallback, useState } from 'react';
// Adicionado limitToLast na importação
import { ref, push, serverTimestamp, set, get, update, query, orderByChild, equalTo, limitToFirst, limitToLast, runTransaction } from 'firebase/database';
import { database } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { RoomData, Player } from '../types/game'; // Supondo que Player e RoomData estejam definidos
import { useNavigate } from 'react-router-dom';

export interface ListedRoom extends Partial<RoomData> { // RoomData agora tem roomName opcional
    id: string;
    playerCount: number;
    ownerName?: string; // Adicionado para exibição no lobby
    visibility?: 'public' | 'private'; // Adicionado para ícone de cadeado e lógica de entrada
    // roomName?: string; // Já herdado de Partial<RoomData> se RoomData for atualizado
    // gameMode já está em RoomData
}

export const useRoomManager = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const createRoom = useCallback(async (
    gameMode: 'classic' | 'senai',
    roomName?: string,
    visibility: 'public' | 'private' = 'public',
    password?: string
  ) => {
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
      ownerName: initialPlayer.displayName, // <-- Adicionado ownerName
      players: {
        [currentUser.uid]: initialPlayer, // Jogador criador
      },
      createdAt: serverTimestamp() as any, // Firebase irá converter para timestamp
      gameMode: gameMode,
      visibility: visibility,
      password: visibility === 'private' && password ? password : undefined, // Salva senha apenas se privada e fornecida
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
      // Busca os dados da sala ANTES da transação para checar visibilidade e senha
      const roomSnapshot = await get(roomRef);
      if (!roomSnapshot.exists()) {
        addNotification("Sala não encontrada.", "error");
        setIsLoading(false);
        return false;
      }

      const currentRoomData = roomSnapshot.val() as RoomData;

      // Se o usuário já é jogador na sala, permite a reentrada sem checagens.
      if (!(currentRoomData.players && currentRoomData.players[currentUser.uid])) {
        // Se não é jogador, aplicar checagens de sala cheia, jogo terminado, ou senha.
        if (currentRoomData.gameEnded) {
            addNotification("Este jogo já terminou.", "info");
            setIsLoading(false);
            return false;
        }
        if (Object.keys(currentRoomData.players || {}).length >= 2) {
            addNotification("A sala está cheia.", "warning");
            setIsLoading(false);
            return false;
        }
        if (currentRoomData.visibility === 'private') {
          const enteredPassword = prompt("Esta sala é privada. Por favor, digite a senha:");
          if (enteredPassword !== currentRoomData.password) {
            addNotification("Senha incorreta.", "error");
            setIsLoading(false);
            return false;
          }
        }
      }

      // Agora, a transação para adicionar o jogador
      const result = await runTransaction(roomRef, (currentData: RoomData | null) => {
        if (currentData === null) {
          // Esta condição não deve ser atingida se a checagem anterior (roomSnapshot.exists()) funcionou,
          // mas é uma salvaguarda.
          return; // Aborta a transação, sala não existe
        }

        // Se o usuário já é jogador na sala, permite a reentrada sem checagens adicionais de senha ou lotação.
        if (currentData.players && currentData.players[currentUser.uid]) {
          return currentData;
        }

        if (currentData.gameEnded) {
          // addNotification("Este jogo já terminou.", "info"); // Será tratado fora
          return; // Aborta, jogo terminado
        }
        if (Object.keys(currentData.players || {}).length >= 2) {
          // addNotification("A sala está cheia.", "warning"); // Será tratado fora
          return; // Aborta, sala cheia
        }

        // Lógica de senha movida para antes da transação para evitar chamadas de prompt dentro dela.
        // A transação agora apenas adiciona o jogador se todas as condições (incluindo senha) forem satisfeitas.

        const newPlayer: Player = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email || 'Jogador Anônimo',
        };

        if (!currentData.players) {
          currentData.players = {};
        }
        currentData.players[currentUser.uid] = newPlayer;
        return currentData;
      });

      if (result.committed && result.snapshot.exists()) {
        const roomData = result.snapshot.val() as RoomData;
        addNotification("Você entrou na sala!", "success");
        navigate(`/play-${roomData.gameMode}/${roomId}`);
        return true;
      } else {
        // Tratar os motivos de falha da transação ou condições pré-transação
        const latestRoomData = (await get(roomRef)).val() as RoomData | null; // Re-busca dados atuais
        if (!latestRoomData) {
          addNotification("Sala não encontrada.", "error");
        } else if (latestRoomData.gameEnded) {
          addNotification("Este jogo já terminou.", "info");
        } else if (Object.keys(latestRoomData.players || {}).length >= 2 && (!latestRoomData.players || !latestRoomData.players[currentUser.uid])) {
          addNotification("A sala está cheia.", "warning");
        } else if (latestRoomData.visibility === 'private' && (!latestRoomData.players || !latestRoomData.players[currentUser.uid])) {
          // Se a falha foi por senha incorreta (ou não fornecida), a notificação de senha já teria sido dada.
          // Se chegou aqui e é privada, e o usuário não está, pode ser um estado inesperado ou falha silenciosa de senha.
          // A lógica de senha está antes da transação, então esta condição pode não ser o principal motivo de falha aqui.
          // A notificação de "senha incorreta" já teria sido emitida.
        } else {
          addNotification("Não foi possível entrar na sala.", "error");
        }
        return false;
      }
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
      let activeRooms: ListedRoom[] = []; // Renomeado para activeRooms para clareza
      const twelveMinutesAgo = Date.now() - 12 * 60 * 1000;

      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          const room = childSnapshot.val() as RoomData;
          const playerCount = Object.keys(room.players || {}).length;

          // Filtro principal: não terminada E (com menos de 2 jogadores OU jogador atual está na sala)
          // E criada nos últimos 12 minutos
          if (
            !room.gameEnded &&
            (playerCount < 2 || (currentUser && room.players[currentUser.uid])) &&
            (room.createdAt && room.createdAt > twelveMinutesAgo) // Filtro de tempo
          ) {
            if (gameMode && room.gameMode !== gameMode) return; // Filtra por modo de jogo se especificado

            activeRooms.push({ // Adiciona a activeRooms
              id: childSnapshot.key!,
              roomName: room.roomName,
              owner: room.owner, // Mantido por enquanto, pode ser útil
              ownerName: room.ownerName, // Adicionado para exibição
              playerCount: playerCount,
              gameMode: room.gameMode,
              visibility: room.visibility || 'public', // Adiciona visibilidade com fallback para public
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
