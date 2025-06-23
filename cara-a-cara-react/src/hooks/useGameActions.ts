import { useCallback } from 'react';
import { ref, update as rtdbUpdate, push, serverTimestamp } from 'firebase/database';
import { doc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { database, firestore } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext'; // Importar useNotification
import { useGame } from '../contexts/GameContext';
import { RoomData, CLASSIC_CHARACTERS, SENAI_CHARACTERS, DICE_FACES, getCharacterNameFromPath } from '../types/game';

const MAX_WRONG_ATTEMPTS = 5;

export const useGameActions = () => {
  const { currentUser } = useAuth();
  const { roomId, roomData, isRoomOwner, setRoomId } = useGame();
  const { addNotification } = useNotification(); // Usar o hook de notificação

  const getCharacterList = useCallback(() => {
    return roomData?.gameMode === 'senai' ? SENAI_CHARACTERS : CLASSIC_CHARACTERS;
  }, [roomData?.gameMode]);

  // Atualizado para usar Firestore e desnormalizar dados para ranking
  const updateUserStats = useCallback(async (userId: string, result: 'win' | 'loss') => {
    if (!userId) return;

    const userDocRef = doc(firestore, `users/${userId}`);
    const userStatsSubDocRef = doc(firestore, `users/${userId}/stats/detailedGameStats`);

    try {
      // Usar uma transação para garantir atomicidade ao ler e depois escrever stats
      await runTransaction(firestore, async (transaction) => {
        const userDocSnap = await transaction.get(userDocRef);
        const userStatsSubDocSnap = await transaction.get(userStatsSubDocRef);

        if (!userDocSnap.exists()) {
          throw new Error(`Documento do usuário ${userId} não encontrado.`);
        }

        let currentWins = userDocSnap.data()?.wins || 0;
        let currentLosses = userDocSnap.data()?.losses || 0;
        let currentMatches = userDocSnap.data()?.matches || 0;

        // Se o subdocumento de stats existir, usar seus valores como fonte da verdade se forem diferentes
        // Isso é para o caso de querermos manter o subdocumento como mestre e o principal como cópia.
        // Por ora, vamos assumir que o documento principal é o mestre para os campos desnormalizados.
        if (userStatsSubDocSnap.exists()) {
             // Poderia haver lógica para reconciliar se eles divergissem.
             // Por simplicidade, vamos assumir que os valores no documento principal são os que incrementamos.
        }

        const newMatches = currentMatches + 1;
        let newWins = currentWins;
        let newLosses = currentLosses;

        if (result === 'win') {
          newWins += 1;
        } else {
          newLosses += 1;
        }

        const newWinRate = newMatches > 0 ? Math.round((newWins / newMatches) * 100) : 0;

        // Atualiza o documento principal do usuário (desnormalizado)
        transaction.update(userDocRef, {
          matches: newMatches,
          wins: newWins,
          losses: newLosses,
          winRate: newWinRate,
        });

        // Atualiza o subdocumento de estatísticas detalhadas
        // Se o subdocumento não existir, setDoc o criará, updateDoc falharia.
        // Como garantimos a criação em RegisterPage, updateDoc deve funcionar se ele existir.
        // Para ser mais robusto, podemos usar set com merge:true ou verificar a existência.
        if (userStatsSubDocSnap.exists()) {
            transaction.update(userStatsSubDocRef, {
                matches: newMatches, // ou increment(1) se preferir não ler antes
                wins: newWins,    // ou increment(result === 'win' ? 1 : 0)
                losses: newLosses,  // ou increment(result === 'loss' ? 1 : 0)
            });
        } else {
            // Se por algum motivo não existir, cria.
            transaction.set(userStatsSubDocRef, {
                matches: newMatches,
                wins: newWins,
                losses: newLosses,
            });
        }
      });

    } catch (error) {
      console.error("Erro ao atualizar estatísticas do usuário (transação):", error);
      // Poderia tentar gravar no RTDB como fallback se crítico, mas geralmente é melhor consistência.
    }
  }, []);

  const sortCharacter = useCallback(async () => {
    if (!currentUser || !roomId || !roomData) {
      addNotification('Usuário não logado, sala não encontrada ou dados da sala não carregados.', 'error');
      return;
    }
    if (roomData.charactersSorted) {
      addNotification('Personagens já foram sorteados!', 'info');
      return;
    }
    // Verifica se este jogador já sorteou
    if ((isRoomOwner && roomData.ownerCharacterReady) || (!isRoomOwner && roomData.visitorCharacterReady)) {
        addNotification('Você já sorteou seu personagem.', 'info');
        return;
    }

    const characterList = getCharacterList();
    const randomIndex = Math.floor(Math.random() * characterList.length);
    const sortedCharacter = characterList[randomIndex];

    const updates: Partial<RoomData> = {};
    if (isRoomOwner) {
      updates.sortedCharacterOwner = sortedCharacter;
      updates.ownerCharacterReady = true;
    } else {
      updates.sortedCharacterVisitor = sortedCharacter;
      updates.visitorCharacterReady = true;
    }

    // Se ambos estiverem prontos após esta atualização, marca charactersSorted
    // Esta lógica é um pouco complexa para fazer atomicamente aqui sem transação na raiz da sala
    // O listener em GameContext vai pegar a atualização e poderá definir charactersSorted se ambos true
    // Ou podemos fazer uma leitura e depois escrita:
    const currentOwnerReady = updates.ownerCharacterReady || roomData.ownerCharacterReady;
    const currentVisitorReady = updates.visitorCharacterReady || roomData.visitorCharacterReady;

    if (currentOwnerReady && currentVisitorReady) {
        updates.charactersSorted = true;
        // Poderia também iniciar a fase de dados aqui, ou deixar para a UI/listener
        updates.diceValues = { owner: null, visitor: null, ownerReady: false, visitorReady: false };
        updates.diceResultsShown = false;
    }

    try {
      await rtdbUpdate(ref(database, `rooms/${roomId}`), updates); // rtdbUpdate
      // A UI será atualizada pelo listener no GameContext
    } catch (error) {
      console.error("Erro ao sortear personagem:", error);
      addNotification("Falha ao sortear personagem.", 'error');
    }
  }, [currentUser, roomId, roomData, isRoomOwner, getCharacterList, addNotification]); // addNotification já estava aqui

  const rollDice = useCallback(async () => {
    if (!currentUser || !roomId || !roomData || !roomData.charactersSorted) {
      addNotification('Personagens ainda não foram sorteados por ambos ou sala inválida.', 'warning');
      return;
    }
    if (roomData.diceResultsShown) {
      addNotification('Dados já foram sorteados e o resultado mostrado.', 'info');
      return;
    }
    // Verifica se este jogador já sorteou o dado
    if ((isRoomOwner && roomData.diceValues?.ownerReady) || (!isRoomOwner && roomData.diceValues?.visitorReady)) {
        addNotification('Você já sorteou o dado.', 'info');
        return;
    }

    const randomIndex = Math.floor(Math.random() * DICE_FACES.length);
    // const sortedDiceImagePath = DICE_FACES[randomIndex]; // Se quiser guardar o path da imagem
    const diceValue = randomIndex + 1; // Valor de 1 a 6

    const updates: any = {}; // Usando 'any' para facilitar a construção do path
    const basePath = `rooms/${roomId}/diceValues`;

    if (isRoomOwner) {
      updates[`${basePath}/owner`] = diceValue;
      updates[`${basePath}/ownerReady`] = true;
    } else {
      updates[`${basePath}/visitor`] = diceValue;
      updates[`${basePath}/visitorReady`] = true;
    }

    try {
      await rtdbUpdate(ref(database), updates);
    } catch (error) {
      console.error("Erro ao sortear dado:", error);
      addNotification("Falha ao sortear dado.", 'error');
    }
  }, [currentUser, roomId, roomData, isRoomOwner, addNotification]);

  const checkGuess = useCallback(async (guessedCharacterName: string, currentWrongAttempts: number, setWrongAttemptsLocal: (attempts: number) => void) => {
    if (!currentUser || !roomId || !roomData || !roomData.charactersSorted || roomData.gameEnded) {
      addNotification('Não é possível fazer um palpite agora.', 'warning');
      return;
    }
    if (roomData.currentPlayer !== currentUser.uid) {
      addNotification('Não é sua vez de jogar.', 'info');
      return;
    }

    const opponentCharPath = isRoomOwner ? roomData.sortedCharacterVisitor : roomData.sortedCharacterOwner;
    if (!opponentCharPath) {
        addNotification('Personagem do oponente não definido.', 'error');
        return;
    }
    const opponentCharacterName = getCharacterNameFromPath(opponentCharPath);

    const roomRef = ref(database, `rooms/${roomId}`);
    let newWrongAttempts = currentWrongAttempts;

    if (guessedCharacterName === opponentCharacterName) {
      // Acertou!
      const loserUid = Object.keys(roomData.players || {}).find(uid => uid !== currentUser.uid && uid !== roomData.owner) || (isRoomOwner ? Object.keys(roomData.players!)[1] : roomData.owner); // Encontrar oponente

      await updateUserStats(currentUser.uid, 'win');
      if (loserUid) {
        await updateUserStats(loserUid, 'loss');
      }

      await update(roomRef, {
        winner: currentUser.uid,
        loser: loserUid,
        gameEnded: true,
        endMessage: `${currentUser.displayName || currentUser.email} acertou! O personagem era ${opponentCharacterName}.`,
        currentPlayer: null,
      });
      addNotification(`🎉 Parabéns! Você acertou! O personagem era ${opponentCharacterName}.`, 'success');
      // setRoomId(null); // Opcional: limpar a sala do contexto local ao finalizar

    } else {
      // Errou!
      newWrongAttempts++;
      setWrongAttemptsLocal(newWrongAttempts); // Atualiza estado local de tentativas para UI imediata

      const opponentUid = isRoomOwner
        ? Object.keys(roomData.players!).find(key => key !== currentUser.uid)
        : roomData.owner;

      // Notificação para o oponente (opcional, mas bom ter)
      if (roomData.notifications !== undefined) { // Verifica se notifications existe
        const notificationsRef = ref(database, `rooms/${roomId}/notifications`);
        await push(notificationsRef, {
          type: "wrong_guess",
          from: currentUser.uid,
          fromName: currentUser.displayName || "Jogador",
          guessedCharacter: guessedCharacterName,
          attempts: `${newWrongAttempts}/${MAX_WRONG_ATTEMPTS}`,
          timestamp: serverTimestamp(),
        });
      }


      if (newWrongAttempts >= MAX_WRONG_ATTEMPTS) {
        // Perdeu por tentativas
        await updateUserStats(currentUser.uid, 'loss');
        if (opponentUid) {
          await updateUserStats(opponentUid, 'win');
        }
        await update(roomRef, {
          winner: opponentUid,
          loser: currentUser.uid,
          gameEnded: true,
          endMessage: `${currentUser.displayName || currentUser.email} errou ${MAX_WRONG_ATTEMPTS} vezes. O personagem era ${opponentCharacterName}.`,
          currentPlayer: null,
        });
        addNotification(`⏰ Você perdeu! Errou ${MAX_WRONG_ATTEMPTS} vezes. O personagem era ${opponentCharacterName}.`, 'error');
        // setRoomId(null); // Opcional
      } else {
        // Apenas errou, passa a vez
        await update(roomRef, {
          currentPlayer: opponentUid, // Passa a vez para o oponente
        });
        addNotification(`❌ Errou! Tentativas: ${newWrongAttempts}/${MAX_WRONG_ATTEMPTS}. Vez do oponente.`, 'info');
      }
    }
  }, [currentUser, roomId, roomData, isRoomOwner, updateUserStats, setRoomId, addNotification]); // addNotification já estava aqui


  // A função de gerenciamento de sala (criar/entrar) será em outro hook ou serviço.
  // A função de chat também.

  return {
    updateUserStats,
    sortCharacter,
    rollDice,
    checkGuess,
  };
};
