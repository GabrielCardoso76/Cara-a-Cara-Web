import React, { useState, useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import { useNotification } from '../contexts/NotificationContext';
import CharacterBoard from '../components/game/CharacterBoard';
import MyCharacterDisplay from '../components/game/MyCharacterDisplay';
import DiceDisplay from '../components/game/DiceDisplay';
import RoomChat from '../components/game/RoomChat';
import { SENAI_CHARACTERS, CLASSIC_CHARACTERS, getCharacterNameFromPath, DICE_FACES } from '../types/game'; // Importa ambas as listas
import './GamePage.css'; // Um CSS compartilhado para as páginas de jogo
// import './SenaiGamePage.css'; // Futuro CSS específico para tema SENAI

const SenaiGamePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { roomId: routeRoomId } = useParams<{ roomId: string }>();
  const {
    roomId,
    setRoomId,
    roomData,
    isLoadingRoom,
    errorRoom,
    myCharacterPath,
    // currentTurnPlayerId, // Não usado diretamente aqui, mas disponível em roomData
    isRoomOwner
  } = useGame();
  const { sortCharacter, rollDice, checkGuess } = useGameActions();
  const { addNotification } = useNotification();

  const [eliminatedCharacters, setEliminatedCharacters] = useState<{ [imagePath: string]: boolean }>({});
  const [guessInput, setGuessInput] = useState<string>('');
  const [localWrongAttempts, setLocalWrongAttempts] = useState<number>(0);

  // Define o roomId no contexto quando o parâmetro da rota estiver disponível
  useEffect(() => {
    if (routeRoomId && routeRoomId !== roomId) {
      setRoomId(routeRoomId);
    }
    return () => {
      setEliminatedCharacters({});
      setGuessInput('');
      setLocalWrongAttempts(0);
    }
  }, [routeRoomId, setRoomId, roomId]);

  // Reseta as tentativas erradas locais e lida com notificações de fim de jogo
  useEffect(() => {
    if (roomData && (!roomData.currentPlayer || roomData.currentPlayer !== currentUser?.uid)) {
       if (!roomData.gameEnded) setLocalWrongAttempts(0);
    }
     if (roomData?.gameEnded && roomData.endMessage) {
        const messageType = roomData.winner === currentUser?.uid ? 'success' : 'error';
        addNotification(roomData.endMessage, messageType);
    }
  }, [roomData, currentUser, addNotification]);

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
    await checkGuess(guessInput, localWrongAttempts, setLocalWrongAttempts);
    setGuessInput('');
  };

  // Determina a lista de personagens com base no gameMode do roomData
  const characterList = roomData?.gameMode === 'senai' ? SENAI_CHARACTERS : CLASSIC_CHARACTERS;

  if (!currentUser) return <Navigate to="/login" />;
  if (isLoadingRoom) return <div className="game-loading">Carregando sala...</div>;
  if (errorRoom) return <div className="game-error">Erro ao carregar sala: {errorRoom}. <Link to="/lobby-senai">Voltar ao Lobby</Link></div>;
  if (!roomData) return <div className="game-error">Sala não encontrada. <Link to="/lobby-senai">Voltar ao Lobby</Link></div>;

  // Verifica se o gameMode é senai, caso contrário redireciona para evitar inconsistências
  // Isso é uma salvaguarda, a lógica de entrada na sala já deve garantir o gameMode correto.
  if (roomData.gameMode !== 'senai') {
    addNotification("Modo de jogo incorreto para esta sala. Redirecionando...", "error");
    return <Navigate to="/lobby-classic" />;
  }

  const myTurn = roomData.currentPlayer === currentUser.uid;
  const gamePhase = roomData.charactersSorted
    ? (roomData.diceResultsShown ? 'guessing' : 'dice_roll')
    : 'character_selection';

  return (
    // A classe senai-game-theme foi removida daqui, pois senai-theme será aplicada globalmente via Layout
    <div className="game-page-container">
      <h2 className="game-title">Jogo Modo SENAI - Sala: {roomData.roomName || roomId}</h2>

      {roomData.gameEnded && (
        <div className={`game-ended-message ${roomData.winner === currentUser.uid ? 'win' : 'loss'}`}>
          <h3>{roomData.endMessage || "O jogo terminou!"}</h3>
          <Link to="/lobby-senai" className="lobby-button">Voltar ao Lobby</Link> {/* MODIFICADO: Link do Lobby */}
        </div>
      )}

      <div className="game-main-area">
        <div className="game-left-panel">
          <CharacterBoard
            characterImagePaths={characterList} // USA A LISTA DINÂMICA
            eliminatedCharacters={eliminatedCharacters}
            onToggleEliminate={handleToggleEliminate}
          />
        </div>

        <div className="game-right-panel">
          <MyCharacterDisplay
            characterImagePath={myCharacterPath}
            label="Seu Personagem (SENAI)" // MODIFICADO: Label
          />

          {gamePhase === 'character_selection' && !myCharacterPath && (
            <button onClick={sortCharacter} className="game-action-button" disabled={!!myCharacterPath}>
              Sortear Meu Personagem (SENAI) {/* MODIFICADO: Texto do botão */}
            </button>
          )}
           {gamePhase === 'character_selection' && myCharacterPath && <p className="waiting-text">Aguardando oponente sortear...</p>}

          {gamePhase === 'dice_roll' && (
             <DiceDisplay
                // A lógica para diceImagePath permanece a mesma, pois DICE_FACES é universal
                diceImagePath={(isRoomOwner ? (roomData.diceValues?.owner && DICE_FACES[roomData.diceValues.owner - 1]) : (roomData.diceValues?.visitor && DICE_FACES[roomData.diceValues.visitor - 1])) || null}
                onRollDice={rollDice}
                rolling={false}
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
                    {characterList.filter(p => !eliminatedCharacters[p]).map(charPath => ( // USA A LISTA DINÂMICA
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

export default SenaiGamePage;
