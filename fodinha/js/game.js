// js/game.js
let currentGameState = {};
const myUsername = sessionStorage.getItem('username');

document.addEventListener('DOMContentLoaded', () => {
    const storedState = sessionStorage.getItem('gameState');
    if (storedState) {
        handleGameStateUpdate(JSON.parse(storedState));
    }

    const handContainer = document.getElementById('player-south-hand');
    if(handContainer) {
        handContainer.addEventListener('click', (e) => {
            const cardElement = e.target.closest('.card');
            if (cardElement && cardElement.classList.contains('cursor-pointer')) {
                const card = {
                    rank: cardElement.getAttribute('data-rank'),
                    suit: cardElement.getAttribute('data-suit'),
                };
                sendMessage('playCard', { roomId: currentGameState.roomId, card });
            }
        });
    }
});


function handleGameStateUpdate(state) {
    currentGameState = state;
    sessionStorage.setItem('gameState', JSON.stringify(state));
    renderGame(state);
}

function renderGame(state) {
    if (!myUsername || !state.players) return;

    const activeGameStatuses = ['betting', 'playing', 'round_end'];
    if (activeGameStatuses.includes(state.status) && state.players.length < 4) {
        alert('Um jogador saiu. A sala foi desfeita. Voltando para o lobby.');
        window.location.href = 'lobby.html';
        return;
    }
    
    const myPlayerIndex = state.players.findIndex(p => p.username === myUsername);
    if(myPlayerIndex === -1 && state.status !== 'waiting') {
      window.location.href = 'lobby.html';
      return;
    }

    const playerPositions = ['south', 'west', 'north', 'east'];
    const reorderedPlayers = state.players.map((_, i) => {
        const index = (myPlayerIndex + i) % 4;
        return { ...state.players[index], position: playerPositions[i] };
    });

    reorderedPlayers.forEach(player => {
        renderPlayer(player, state);
    });

    const viraArea = document.getElementById('vira-area');
    if (state.vira) {
        viraArea.innerHTML = `<span class="text-xs font-bold uppercase mb-1">Vira</span>` + renderCard(state.vira);
    } else {
        viraArea.innerHTML = '';
    }

    const trickArea = document.getElementById('trick-area');
    trickArea.innerHTML = '';
    if (state.currentTrick) {
        state.currentTrick.forEach(cardInTrick => {
            trickArea.innerHTML += renderCard(cardInTrick);
        });
    }
    
    updateInfoText(state);
    handleBettingModal(state);
    handleGameOverModal(state);
}

function renderPlayer(player, state) {
    const isMyTurn = state.players[state.currentPlayerIndex]?.username === player.username;
    const infoContainer = document.getElementById(`player-${player.position}-info`);
    const handContainer = document.getElementById(`player-${player.position}-hand`);

    if (infoContainer) infoContainer.innerHTML = renderPlayerInfo(player, isMyTurn);

    if (handContainer) {
        handContainer.innerHTML = '';
        const isMyHand = player.position === 'south';
        const isPlayable = isMyHand && isMyTurn && state.status === 'playing';

        if (player.hand) {
            player.hand.forEach(card => {
                handContainer.innerHTML += renderCard(card, isPlayable);
            });
        }
    }
}

function updateInfoText(state) {
    const infoText = document.getElementById('info-text');
    if (!infoText) return;
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    switch (state.status) {
        case 'waiting':
            infoText.textContent = `Aguardando jogadores... (${state.players.length}/4)`;
            break;
        case 'betting':
            infoText.innerHTML = `Rodada de palpites!<br>Vez de <span class="text-yellow-300 font-bold">${currentPlayer?.username || ''}</span>.`;
            break;
        case 'playing':
            infoText.innerHTML = `Vez de <span class="text-yellow-300 font-bold">${currentPlayer?.username || ''}</span> jogar.`;
            break;
        case 'round_end':
            infoText.textContent = 'Fim da rodada! Calculando pontos...';
            break;
        case 'game_over':
            infoText.textContent = `O jogo acabou!`;
            break;
    }
}

function handleBettingModal(state) {
    const betModal = document.getElementById('bet-modal');
    const betOptions = document.getElementById('bet-options');
    if (!betModal || !betOptions) return;
    
    const myPlayer = state.players.find(p => p.username === myUsername);
    const isMyTurnToBet = state.status === 'betting' && state.players[state.currentPlayerIndex]?.username === myUsername;

    if (isMyTurnToBet && myPlayer && myPlayer.bet === null) {
        betOptions.innerHTML = '';
        const cardsInHand = myPlayer.hand.length;
        for (let i = 0; i <= cardsInHand; i++) {
            const button = document.createElement('button');
            button.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold w-12 h-12 rounded-full text-lg transition-transform hover:scale-110';
            button.textContent = i;
            button.onclick = () => {
                sendMessage('placeBet', { roomId: state.roomId, bet: i });
                betModal.classList.add('hidden');
            };
            betOptions.appendChild(button);
        }
        betModal.classList.remove('hidden');
    } else {
        betModal.classList.add('hidden');
    }
}

// --- AJUSTE FINAL NO MODAL DE FIM DE JOGO ---
function handleGameOverModal(state) {
    const gameOverModal = document.getElementById('game-over-modal');
    if (!gameOverModal) return;

    if (state.status === 'game_over') {
        const titleElement = gameOverModal.querySelector('h2');
        const messageElement = gameOverModal.querySelector('p');
        
        // Mensagem personalizada para o fim de jogo
        titleElement.textContent = 'Fim de Jogo!';
        messageElement.innerHTML = `
            <strong class="text-red-500 text-2xl">${state.eliminated}</strong> foi eliminado!
            <br><br>
            O vencedor é <strong class="text-green-400 text-3xl">${state.winner}</strong>!
        `;
        
        gameOverModal.classList.remove('hidden');
    } else {
        gameOverModal.classList.add('hidden');
    }
}