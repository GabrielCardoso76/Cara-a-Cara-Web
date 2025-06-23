import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onValue, ref, update } from 'firebase/database';
import { database } from '../services/firebase';
import { RoomData, GameContextType, Player } from '../types/game'; // Adicionado Player
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext'; // Importar useNotification
import { useParams } from 'react-router-dom';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame deve ser usado dentro de um GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification(); // Usar o hook de notificação
  const routeParams = useParams<{ roomId: string }>();
  const [roomId, setRoomIdInternal] = useState<string | null>(routeParams.roomId || null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState<boolean>(false);
  const [errorRoom, setErrorRoom] = useState<string | null>(null);

  const [isRoomOwner, setIsRoomOwner] = useState<boolean | null>(null);
  const [myCharacterPath, setMyCharacterPath] = useState<string | null>(null);
  const [opponentCharacterPath, setOpponentCharacterPath] = useState<string | null>(null);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string|null>(null);
  // wrongAttempts removido completamente do estado do GameContext

  // Atualiza o roomId interno se o parâmetro da rota mudar
  useEffect(() => {
    setRoomIdInternal(routeParams.roomId || null);
  }, [routeParams.roomId]);

  // Efeito para ouvir dados da sala
  useEffect(() => {
    if (!roomId || !currentUser) {
      setRoomData(null); // Limpa dados da sala se não houver ID ou usuário
      // ... outros resets
      return;
    }

    setIsLoadingRoom(true);
    setErrorRoom(null);
    const roomRef = ref(database, `rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val() as RoomData | null; // Pode ser null se a sala for deletada
      if (data) {
        setRoomData(data);
        const owner = data.owner === currentUser.uid;
        setIsRoomOwner(owner);
        // Convertendo undefined para null para compatibilidade com o estado que espera string | null
        setMyCharacterPath(owner ? data.sortedCharacterOwner || null : data.sortedCharacterVisitor || null);
        setOpponentCharacterPath(owner ? data.sortedCharacterVisitor || null : data.sortedCharacterOwner || null);
        setCurrentTurnPlayerId(data.currentPlayer || null);

        // Lógica de processamento de dados do dado (QUEM COMEÇA)
        if (data.charactersSorted && data.diceValues?.ownerReady && data.diceValues.visitorReady && !data.diceResultsShown) {
          const { owner: ownerDice, visitor: visitorDice } = data.diceValues;
          if (ownerDice !== null && ownerDice !== undefined && visitorDice !== null && visitorDice !== undefined) {
            const roomUpdates: Partial<RoomData> = {};
            if (ownerDice === visitorDice) {
              // Empate no dado
              roomUpdates.diceValues = { owner: null, visitor: null, ownerReady: false, visitorReady: false };
              roomUpdates.diceResultsShown = false; // Garante que possam jogar de novo
              addNotification("Empate no dado! Joguem os dados novamente.", 'info');
            } else {
              // Determina quem começa
              const visitorUid = Object.keys(data.players!).find(uid => uid !== data.owner)!;
              roomUpdates.currentPlayer = ownerDice > visitorDice ? data.owner : visitorUid;
              roomUpdates.diceResultsShown = true;

              let starterName = 'Jogador';
              if (roomUpdates.currentPlayer) {
                const starterPlayer = data.players[roomUpdates.currentPlayer] as Player; // Type assertion
                starterName = starterPlayer?.displayName || roomUpdates.currentPlayer.substring(0,6);
              }
              addNotification(`Dados sorteados! ${starterName} começa.`, 'success');
            }
            update(roomRef, roomUpdates).catch(err => {
              console.error("Erro ao atualizar sala após dados:", err);
              addNotification("Erro ao processar resultado dos dados.", "error");
            });
          }
        }
        // Se o jogo terminou, limpar roomId localmente pode ser uma opção para "sair" da sala
        if (data.gameEnded) {
            // alert(data.endMessage || "O jogo terminou!");
            // setTimeout(() => setRoomIdInternal(null), 5000); // Exemplo: sair da sala após 5s
        }

      } else {
        setErrorRoom("Sala não encontrada ou foi excluída.");
        setRoomData(null);
        setRoomIdInternal(null); // Limpa o ID se a sala não existe mais
      }
      setIsLoadingRoom(false);
    }, (error) => {
      console.error("Erro ao ouvir dados da sala:", error);
      setErrorRoom(`Falha ao carregar dados da sala: ${error.message}`);
      addNotification(`Erro ao carregar dados da sala: ${error.message}`, 'error');
      setIsLoadingRoom(false);
    });

    return () => unsubscribe();
  }, [roomId, currentUser, addNotification]); // Adicionado addNotification às dependências

  // Função para permitir que componentes externos (como lobby) definam o ID da sala
  // Isso é útil se a navegação para a sala acontecer antes do parâmetro da rota estar disponível
  // ou para cenários de criação de sala.
  const setRoomId = useCallback((id: string | null) => {
    // Navegar para a URL da sala seria o ideal aqui, e deixar o useEffect acima lidar com isso.
    // Por simplicidade, apenas definimos o ID interno.
    // Em uma app real: navigate(`/play-classic/${id}`);
    setRoomIdInternal(id);
    if (id === null) {
        setRoomData(null);
        setIsRoomOwner(null);
        // ... outros resets
    }
  }, []);


  const value: GameContextType = {
    roomId,
    setRoomId,
    roomData,
    isLoadingRoom,
    errorRoom,
    isRoomOwner,
    myCharacterPath,
    opponentCharacterPath,
    currentTurnPlayerId,
    // wrongAttempts removido do valor do contexto
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
