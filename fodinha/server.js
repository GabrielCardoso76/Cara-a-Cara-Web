// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: process.env.PORT || 8080, path: '/ws' });

console.log(`Servidor "Aposta Certa" iniciado...`);

let rooms = {};
let clients = {};

const cardRanks = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
const cardSuits = ['Ouros', 'Espadas', 'Copas', 'Paus'];

const generateRoomId = () => `room_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

const createDeck = () => {
    const deck = [];
    for (const suit of cardSuits) {
        for (const rank of cardRanks) {
            deck.push({ rank, suit });
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const getCardStrength = (card, vira, manilhas) => {
    if (!card || !vira || !manilhas) return -1;
    const isManilha = manilhas.some(m => m.rank === card.rank && m.suit === card.suit);
    if (isManilha) {
        const manilhaRank = 4 - manilhas.findIndex(m => m.rank === card.rank && m.suit === card.suit);
        return 100 + manilhaRank;
    }
    return cardRanks.indexOf(card.rank);
};

wss.on('connection', ws => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    clients[clientId] = { ws, username: null, currentRoomId: null };
    console.log(`Cliente conectado: ${clientId}`);

    ws.on('message', message => {
        try {
            const { type, payload } = JSON.parse(message);
            const client = clients[clientId];
            if (!client) return;
            if (payload.username) client.username = payload.username;

            if (client.username && !client.currentRoomId) {
                const room = Object.values(rooms).find(r => r.players.some(p => p.username === client.username));
                if (room) {
                    const player = room.players.find(p => p.username === client.username);
                    if (player) {
                        client.currentRoomId = room.id;
                        player.clientId = clientId;
                        player.ws = ws;
                    }
                }
            }

            switch (type) {
                case 'login': broadcastRoomList(); break;
                case 'createRoom': handleCreateRoom(client, clientId, payload); break;
                case 'joinRoom': handleJoinRoom(client, clientId, payload.roomId); break;
                case 'placeBet': handlePlaceBet(client, payload.roomId, payload.bet); break;
                case 'playCard': handlePlayCard(client, payload.roomId, payload.card); break;
            }
        } catch (e) { console.error("Erro ao processar mensagem:", e); }
    });

    ws.on('close', () => {
        console.log(`Cliente desconectado: ${clientId}`);
        const clientData = clients[clientId];
        delete clients[clientId]; 

        if (clientData && clientData.currentRoomId) {
            const room = rooms[clientData.currentRoomId];
            if (room) {
                const player = room.players.find(p => p.clientId === clientId);
                if (player) {
                    player.clientId = null; 

                    setTimeout(() => {
                        if (player.clientId === null) {
                            console.log(`Limpando jogador ${player.username} da sala ${room.id}`);
                            room.players = room.players.filter(p => p.username !== player.username);
                            if (room.gameState && room.gameState.players) {
                                room.gameState.players = room.gameState.players.filter(p => p.username !== player.username);
                            }

                            if (room.players.length === 0) {
                                delete rooms[room.id];
                            } else {
                                room.gameState.status = 'waiting';
                                broadcastGameState(room.id);
                            }
                            broadcastRoomList();
                        }
                    }, 2500);
                }
            }
        }
    });

    broadcastRoomList();
});


function handleCreateRoom(client, clientId, payload) {
    const roomOptions = payload.roomOptions || {};
    const roomId = generateRoomId();
    client.currentRoomId = roomId;

    const initialLives = roomOptions.initialLives || 5;

    rooms[roomId] = {
        id: roomId,
        name: roomOptions.name || `Sala de ${client.username}`,
        players: [{ clientId, username: client.username, ws: client.ws }],
        options: {
            initialLives: initialLives,
            useAnulacaoRank: roomOptions.useAnulacaoRank || false
        },
        gameState: {
            status: 'waiting',
            players: [{ username: client.username, lives: initialLives, hand: [], bet: null, tricksWon: 0 }]
        }
    };
    broadcastRoomList();
    broadcastGameState(roomId);
}

function handleJoinRoom(client, clientId, roomId) {
    const room = rooms[roomId];
    if (room && room.players.length < 4) {
        client.currentRoomId = roomId;
        room.players.push({ clientId, username: client.username, ws: client.ws });
        if (room.gameState && room.gameState.players) {
            const initialLives = room.options.initialLives || 5;
            room.gameState.players.push({ username: client.username, lives: initialLives, hand: [], bet: null, tricksWon: 0 });
        }
        
        if (room.players.length === 4) {
            startGame(roomId);
        } else {
            broadcastGameState(roomId);
        }
        broadcastRoomList();
    }
}

function getConnectedPlayers(roomId) {
    if (!rooms[roomId]) return [];
    return rooms[roomId].players.filter(p => p.clientId !== null);
}

function startGame(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    const activePlayerConnections = getConnectedPlayers(roomId);
    if(activePlayerConnections.length !== 4) return;

    const activeUsernames = activePlayerConnections.map(p => p.username);
    room.gameState.players = room.gameState.players.filter(p => activeUsernames.includes(p.username));

    room.gameState.status = 'betting';
    room.gameState.roundNumber = 1;
    room.gameState.cardsPerPlayerSequence = [1, 2, 3, 4, 5, 4, 3, 2];
    room.gameState.sequenceIndex = 0;
    room.gameState.dealerIndex = 0;
    room.gameState.currentPlayerIndex = 1 % activePlayerConnections.length;
    
    startNewRound(roomId);
}

function startNewRound(roomId) {
    const room = rooms[roomId];
    if (!room || !room.gameState || !room.gameState.players) return;

    const gs = room.gameState;
    const activePlayers = gs.players;

    const cardsPerPlayer = gs.cardsPerPlayerSequence[gs.sequenceIndex];
    activePlayers.forEach(p => { p.hand = []; p.bet = null; p.tricksWon = 0; });

    const deck = createDeck();
    for (let i = 0; i < cardsPerPlayer; i++) {
        for (let j = 0; j < activePlayers.length; j++) {
            activePlayers[j].hand.push(deck.pop());
        }
    }
    gs.vira = deck.pop();
    const viraRankIndex = cardRanks.indexOf(gs.vira.rank);
    const manilhaRank = cardRanks[(viraRankIndex + 1) % cardRanks.length];
    gs.manilhas = ['Paus', 'Copas', 'Espadas', 'Ouros'].map(suit => ({ rank: manilhaRank, suit }));
    gs.currentTrick = [];
    gs.status = 'betting';
    gs.currentPlayerIndex = (gs.dealerIndex + 1) % activePlayers.length;
    broadcastGameState(roomId);
}

function handlePlaceBet(client, roomId, bet) {
    const room = rooms[roomId];
    if (!room || room.gameState.status !== 'betting') return;

    const gs = room.gameState;
    const playerIndex = gs.players.findIndex(p => p.username === client.username);
    
    if (gs.players[gs.currentPlayerIndex]?.username !== client.username) {
        console.log(`Não é o turno de ${client.username} para apostar.`);
        return;
    }
    
    gs.players[playerIndex].bet = parseInt(bet, 10);
    
    gs.currentPlayerIndex = (gs.currentPlayerIndex + 1) % gs.players.length;

    const allBetsPlaced = gs.players.every(p => p.bet !== null);
    if (allBetsPlaced) {
        gs.status = 'playing';
        gs.currentPlayerIndex = (gs.dealerIndex + 1) % gs.players.length;
    }
    
    broadcastGameState(roomId);
}


function handlePlayCard(client, roomId, card) {
    const room = rooms[roomId];
    if (!room || room.gameState.status !== 'playing') return;

    const gs = room.gameState;

    if (gs.players[gs.currentPlayerIndex]?.username !== client.username) {
        console.log(`Não é o turno de ${client.username} para jogar.`);
        return;
    }

    const playerIndex = gs.players.findIndex(p => p.username === client.username);
    const player = gs.players[playerIndex];
    const cardIndex = player.hand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
    if (cardIndex === -1) return;

    const playedCard = player.hand.splice(cardIndex, 1)[0];
    gs.currentTrick.push({ ...playedCard, playedBy: player.username, playerIndex });
    gs.currentPlayerIndex = (gs.currentPlayerIndex + 1) % gs.players.length;
    
    if (gs.currentTrick.length === gs.players.length) {
        processTrick(roomId);
    } else {
        broadcastGameState(roomId);
    }
}

function processTrick(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    const gs = room.gameState;
    let trickWinnerIndex = -1;
    let highestStrength = -1;

    let validCardsInTrick = [...gs.currentTrick];

    // Lógica de "Anulação por Rank"
    if (room.options.useAnulacaoRank) {
        const rankCounts = {};
        // Conta as cartas que não são manilhas
        gs.currentTrick.forEach(card => {
            const isManilha = gs.manilhas.some(m => m.rank === card.rank && m.suit === card.suit);
            if (!isManilha) {
                rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
            }
        });

        // Encontra os ranks que foram jogados 2 ou mais vezes
        const annulledRanks = Object.keys(rankCounts).filter(rank => rankCounts[rank] >= 2);

        // Filtra as cartas, removendo as que foram anuladas
        if (annulledRanks.length > 0) {
            validCardsInTrick = gs.currentTrick.filter(card => {
                const isManilha = gs.manilhas.some(m => m.rank === card.rank && m.suit === card.suit);
                // Mantém as manilhas e as cartas cujo rank não foi anulado
                return isManilha || !annulledRanks.includes(card.rank);
            });
        }
    }

    // Encontra o vencedor a partir das cartas válidas
    validCardsInTrick.forEach(cardInTrick => {
        let strength = getCardStrength(cardInTrick, gs.vira, gs.manilhas);
        if (strength > highestStrength) {
            highestStrength = strength;
            trickWinnerIndex = cardInTrick.playerIndex;
        }
    });

    if (trickWinnerIndex !== -1) {
        const winner = gs.players[trickWinnerIndex];
        if (winner) winner.tricksWon++;
        gs.currentPlayerIndex = trickWinnerIndex;
    } else {
        // É um empate. O jogador que iniciou o turno joga novamente.
        // O primeiro a jogar é o primeiro do array currentTrick.
        if (gs.currentTrick.length > 0) {
            gs.currentPlayerIndex = gs.currentTrick[0].playerIndex;
        }
    }

    setTimeout(() => {
        if (!rooms[roomId]) return;
        rooms[roomId].gameState.currentTrick = [];
        if (rooms[roomId].gameState.players.every(p => p.hand.length === 0)) {
            processRoundEnd(roomId);
        } else {
            broadcastGameState(roomId);
        }
    }, 2000);
    broadcastGameState(roomId);
}

// --- LÓGICA DE FIM DE RODADA E FIM DE JOGO TOTALMENTE REFEITA ---
function processRoundEnd(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    const gs = room.gameState;

    let playerEliminated = null;

    // 1. Nova regra de pontuação: Perde vidas com base na diferença do palpite
    gs.players.forEach(player => {
        if (player.bet !== player.tricksWon) {
            const difference = Math.abs(player.bet - player.tricksWon);
            player.lives -= difference;
        }
    });

    // 2. Nova regra de Fim de Jogo: Verifica se alguém foi eliminado
    const eliminatedPlayer = gs.players.find(p => p.lives <= 0);

    if (eliminatedPlayer) {
        gs.status = 'game_over';
        gs.eliminated = eliminatedPlayer.username; // Guarda o nome de quem foi eliminado

        // Encontra o vencedor (quem tem mais vidas entre os que sobraram)
        let maxLives = -1;
        let winners = [];
        gs.players.forEach(p => {
            if (p.lives > maxLives) {
                maxLives = p.lives;
                winners = [p.username];
            } else if (p.lives === maxLives) {
                winners.push(p.username);
            }
        });
        gs.winner = winners.join(' e '); // Lida com possíveis empates na vitória
        
    } else {
        // Se ninguém foi eliminado, o jogo continua para a próxima rodada
        gs.status = 'round_end';
        gs.roundNumber++;
        gs.sequenceIndex = (gs.sequenceIndex + 1) % gs.cardsPerPlayerSequence.length;
        gs.dealerIndex = (gs.dealerIndex + 1) % gs.players.length;
        setTimeout(() => startNewRound(roomId), 4000); // 4s para os jogadores verem a pontuação
    }
    
    broadcastGameState(roomId);
}

function broadcastRoomList() {
    const roomList = Object.values(rooms).map(room => ({
        id: room.id,
        name: room.name,
        playerCount: room.players.filter(p => p.clientId).length,
    }));
    Object.values(clients).forEach(client => {
        if (client && client.ws.readyState === WebSocket.OPEN && !client.currentRoomId) {
            client.ws.send(JSON.stringify({ type: 'ROOM_LIST_UPDATE', payload: { rooms: roomList } }));
        }
    });
}

function broadcastGameState(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    const connectedPlayerConnections = room.players.filter(p => p.clientId);
    
    connectedPlayerConnections.forEach(playerInRoom => {
        const clientConnection = clients[playerInRoom.clientId];
        if (clientConnection && clientConnection.ws.readyState === WebSocket.OPEN) {
            const personalizedState = JSON.parse(JSON.stringify(room.gameState));
            personalizedState.players.forEach(p => {
                if (p.username !== playerInRoom.username && p.hand) {
                    p.hand = p.hand.map(() => ({ rank: '?', suit: '?' }));
                }
            });
            personalizedState.myUsername = playerInRoom.username;
            personalizedState.roomId = roomId;
            clientConnection.ws.send(JSON.stringify({ type: 'GAME_STATE_UPDATE', payload: personalizedState }));
        }
    });
}