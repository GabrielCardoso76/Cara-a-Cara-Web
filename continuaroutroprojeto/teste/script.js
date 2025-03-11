let deck = [];
let players = [];
let currentPlayer = 0;

// Função para criar e embaralhar o baralho
function createDeck() {
  const suits = ['copas', 'ouros', 'espadas', 'paus'];
  const values = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
    'A',
  ];
  deck = [];

  // Criando o baralho com 52 cartas
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit: suit, value: value });
    }
  }

  // Embaralhar o baralho
  deck = deck.sort(() => Math.random() - 0.5);
}

// Função para calcular o valor de uma mão
function calculateHandValue(hand) {
  let value = 0;
  let hasAce = false;

  hand.forEach((card) => {
    if (card.value === 'A') {
      value += 11;
      hasAce = true;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      value += 10;
    } else {
      value += parseInt(card.value);
    }
  });

  // Se tiver um Ás e a soma for maior que 21, consideramos o Ás como 1
  if (hasAce && value > 21) {
    value -= 10;
  }

  return value;
}

// Função para começar o jogo
function startGame() {
  const numPlayers = document.getElementById('numPlayers').value;
  const gameArea = document.getElementById('gameArea');

  gameArea.innerHTML = ''; // Limpa a área do jogo
  players = [];
  currentPlayer = 0;
  createDeck();

  // Exibir a área de jogo para cada jogador
  for (let i = 1; i <= numPlayers; i++) {
    const playerDiv = document.createElement('div');
    playerDiv.classList.add('player');
    playerDiv.innerHTML = `
      <h3>Jogador ${i}</h3>
      <div class="hand" id="hand${i}"></div>
      <div id="buttons${i}">
        <button onclick="hit(${i})">Pedir Carta</button>
        <button onclick="stand(${i})">Parar</button>
      </div>
      <p id="score${i}"></p>
    `;
    gameArea.appendChild(playerDiv);
    players.push({ id: i, hand: [], score: 0, isStanding: false });
  }

  gameArea.style.display = 'block'; // Exibe a área do jogo

  // Dar 2 cartas para cada jogador
  for (let i = 0; i < numPlayers; i++) {
    dealCard(i);
    dealCard(i);
  }
  updateScores();
}

// Função para distribuir uma carta para um jogador
function dealCard(playerId) {
  if (deck.length === 0) createDeck(); // Se o baralho estiver vazio, criamos um novo

  const card = deck.pop();
  players[playerId].hand.push(card);

  const handDiv = document.getElementById(`hand${playerId}`);
  const cardDiv = document.createElement('div');
  // Aqui, substitua o nome da imagem pela sua imagem da carta
  cardDiv.classList.add('card');
  cardDiv.innerHTML = `<img src="imagens/${card.value}_de_${card.suit}.png" alt="${card.value} de ${card.suit}">`;
  handDiv.appendChild(cardDiv);
}

// Função para pedir carta
function hit(playerId) {
  if (players[playerId].isStanding) return;

  dealCard(playerId);
  updateScores();

  if (calculateHandValue(players[playerId].hand) > 21) {
    alert(`Jogador ${playerId + 1} estourou!`);
    players[playerId].isStanding = true;
    updateScores();
  }
}

// Função para parar
function stand(playerId) {
  players[playerId].isStanding = true;
  updateScores();
}

// Função para atualizar as pontuações
function updateScores() {
  players.forEach((player, index) => {
    const score = calculateHandValue(player.hand);
    const scoreElement = document.getElementById(`score${index + 1}`);
    scoreElement.textContent = `Pontuação: ${score}`;

    if (player.isStanding || score >= 21) {
      const buttons = document.getElementById(`buttons${index + 1}`);
      buttons.style.display = 'none'; // Oculta os botões quando o jogador parou ou estourou
    }
  });

  // Verificar se todos pararam ou estouraram
  const allPlayersFinished = players.every(
    (player) => player.isStanding || calculateHandValue(player.hand) > 21
  );
  if (allPlayersFinished) {
    determineWinner();
  }
}

// Função para determinar o vencedor
function determineWinner() {
  const scores = players.map((player) => calculateHandValue(player.hand));
  const maxScore = Math.max(...scores.filter((score) => score <= 21)); // Maior pontuação sem estourar

  const winners = players.filter(
    (player, index) => calculateHandValue(player.hand) === maxScore
  );

  if (winners.length === 1) {
    alert(`Jogador ${winners[0].id + 1} venceu com ${maxScore} pontos!`);
  } else {
    alert(`Empate entre jogadores: ${winners.map((w) => w.id + 1).join(', ')}`);
  }
}
