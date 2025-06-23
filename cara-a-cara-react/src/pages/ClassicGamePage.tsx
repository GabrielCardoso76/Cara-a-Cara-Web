import React, { useState, useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom'; // Link adicionado
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import { useNotification } from '../contexts/NotificationContext';
import CharacterBoard from '../components/game/CharacterBoard';
import MyCharacterDisplay from '../components/game/MyCharacterDisplay';
import DiceDisplay from '../components/game/DiceDisplay';
import RoomChat from '../components/game/RoomChat';
// Adicionada importação de DICE_FACES
import { CLASSIC_CHARACTERS, getCharacterNameFromPath, DICE_FACES } from '../types/game';
import './GamePage.css'; // Um CSS compartilhado para as páginas de jogo

const ClassicGamePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { roomId: routeRoomId } = useParams<{ roomId: string }>();
  const {
    roomId,
    setRoomId,
    roomData,
    isLoadingRoom,
    errorRoom,
    myCharacterPath,
    currentTurnPlayerId,
    isRoomOwner
  } = useGame();
  const { sortCharacter, rollDice, checkGuess } = useGameActions();
  const { addNotification } = useNotification();

  const [eliminatedCharacters, setEliminatedCharacters] = useState<{ [imagePath: string]: boolean }>({});
  const [guessInput, setGuessInput] = useState<string>('');
  // Estado local para tentativas erradas, para feedback imediato e para passar para checkGuess
  const [localWrongAttempts, setLocalWrongAttempts] = useState<number>(0);

  // Define o roomId no contexto quando o parâmetro da rota estiver disponível
  useEffect(() => {
    if (routeRoomId && routeRoomId !== roomId) {
      setRoomId(routeRoomId);
    }
    // Resetar o estado local do jogo ao mudar de sala ou sair
    return () => {
      setEliminatedCharacters({});
      setGuessInput('');
      setLocalWrongAttempts(0);
    }
  }, [routeRoomId, setRoomId, roomId]);

  // Reseta as tentativas erradas locais se o jogador da vez mudar ou o jogo reiniciar
  useEffect(() => {
    if (roomData && (!roomData.currentPlayer || roomData.currentPlayer !== currentUser?.uid)) {
      // Se não for meu turno, ou se o jogo resetou (currentPlayer é null e não gameEnded)
      // Considerar também resetar se roomData.gameEnded for true e depois false (novo jogo na mesma sala)
       if (!roomData.gameEnded) setLocalWrongAttempts(0);
    }
     // Se o jogo terminou, exibe a notificação de fim de jogo que vem do GameContext (via listener)
     if (roomData?.gameEnded && roomData.endMessage) {
        const messageType = roomData.winner === currentUser?.uid ? 'success' : 'error';
        // Evitar notificações duplicadas se o endMessage não mudar
        // Poderia se basear em um ID de jogo ou timestamp de finalização se disponível
        addNotification(roomData.endMessage, messageType);
    }

  }, [roomData, currentUser, addNotification]); // Array de dependências corrigido


  const handleToggleEliminate = (imagePath: string) => {
    setEliminatedCharacters(prev => ({
      ...prev,
      [imagePath]: !prev[imagePath],
    }));
  };

  const handleGuessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) {
      addNotification("Selecione ou digite um personagem para adivinhar.", "warning");
      return;
    }
    // Passa o estado local de tentativas para checkGuess
    await checkGuess(guessInput, localWrongAttempts, setLocalWrongAttempts);
    setGuessInput(''); // Limpa input após palpite
  };

  const characterList = CLASSIC_CHARACTERS; // Para este modo de jogo

  if (!currentUser) return <Navigate to="/login" />;
  if (isLoadingRoom) return <div className="game-loading">Carregando sala...</div>;
  if (errorRoom) return <div className="game-error">Erro ao carregar sala: {errorRoom}. <Link to="/lobby-classic">Voltar ao Lobby</Link></div>;
  if (!roomData) return <div className="game-error">Sala não encontrada. <Link to="/lobby-classic">Voltar ao Lobby</Link></div>;

  const myTurn = roomData.currentPlayer === currentUser.uid;
  const gamePhase = roomData.charactersSorted
    ? (roomData.diceResultsShown ? 'guessing' : 'dice_roll')
    : 'character_selection';

  return (
    <div className="game-page-container classic-game">
      <h2 className="game-title">Jogo Clássico - Sala: {roomData.roomName || roomId}</h2>

      {roomData.gameEnded && (
        <div className={`game-ended-message ${roomData.winner === currentUser.uid ? 'win' : 'loss'}`}>
          <h3>{roomData.endMessage || "O jogo terminou!"}</h3>
          <Link to="/lobby-classic" className="lobby-button">Voltar ao Lobby</Link>
        </div>
      )}

      <div className="game-main-area">
        <div className="game-left-panel">
          <CharacterBoard
            characterImagePaths={characterList}
            eliminatedCharacters={eliminatedCharacters}
            onToggleEliminate={handleToggleEliminate}
          />
        </div>

        <div className="game-right-panel">
          <MyCharacterDisplay
            characterImagePath={myCharacterPath}
            label="Seu Personagem"
          />

          {gamePhase === 'character_selection' && !myCharacterPath && (
            <button onClick={sortCharacter} className="game-action-button" disabled={!!myCharacterPath}>
              Sortear Meu Personagem
            </button>
          )}
           {gamePhase === 'character_selection' && myCharacterPath && <p className="waiting-text">Aguardando oponente sortear...</p>}


          {gamePhase === 'dice_roll' && (
             <DiceDisplay
                diceImagePath={(isRoomOwner ? (roomData.diceValues?.owner && DICE_FACES[roomData.diceValues.owner - 1]) : (roomData.diceValues?.visitor && DICE_FACES[roomData.diceValues.visitor - 1])) || null}
                onRollDice={rollDice}
                rolling={false} // O estado de "rolling" seria gerenciado localmente se quiséssemos feedback mais complexo
                label="Sorteie o Dado"
             />
          )}
          {gamePhase === 'dice_roll' && <p className="waiting-text">Ambos devem sortear o dado para definir quem começa.</p>}

          {gamePhase === 'guessing' && !roomData.gameEnded && (
            <div className="guessing-area">
              <h3>{myTurn ? "Sua Vez de Adivinhar!" : `Aguardando ${roomData.players[roomData.currentPlayer!]?.displayName || 'Oponente'}...`}</h3>
              {myTurn && (
                <form onSubmit={handleGuessSubmit} className="guess-form">
                  <select
                    value={guessInput}
                    onChange={(e) => setGuessInput(e.target.value)}
                    className="guess-select"
                  >
                    <option value="">Selecione um personagem...</option>
                    {characterList.filter(p => !eliminatedCharacters[p]).map(charPath => (
                      <option key={charPath} value={getCharacterNameFromPath(charPath)}>
                        {getCharacterNameFromPath(charPath)}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="game-action-button" disabled={!guessInput}>
                    Adivinhar
                  </button>
                </form>
              )}
              <p className="attempts-info">Tentativas erradas nesta rodada: {localWrongAttempts} / 5</p>
            </div>
          )}
          <RoomChat roomId={roomId} />
        </div>
      </div>
    </div>
  );
};

export default ClassicGamePage;
