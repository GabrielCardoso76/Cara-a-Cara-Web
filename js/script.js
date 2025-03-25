const imagensPersonagens = [
  'img/personagem/Brett.jpg',
  'img/personagem/Buddy.jpg',
  'img/personagem/Butch.jpg',
  'img/personagem/Captain Koons.jpg',
  'img/personagem/Esmeralda.jpg',
  'img/personagem/Fabienne.jpg',
  'img/personagem/Jimmie.jpg',
  'img/personagem/Jody.jpg',
  'img/personagem/Jules.jpg',
  'img/personagem/Lance.jpg',
  'img/personagem/Marcellus.jpg',
  'img/personagem/Marvin.jpg',
  'img/personagem/Maynard.jpg',
  'img/personagem/Mia.jpg',
  'img/personagem/Paul.jpg',
  'img/personagem/Raquel.jpg',
  'img/personagem/Ringo.jpg',
  'img/personagem/Roger.jpg',
  'img/personagem/The Gimp.jpg',
  'img/personagem/Trudi.jpg',
  'img/personagem/Vincent.jpg',
  'img/personagem/Winston.jpg',
  'img/personagem/Yolanda.jpg',
  'img/personagem/Zed.jpg'
];

const imagensDado = [
  'img/dado_faces/face_1.jpg',
  'img/dado_faces/face_2.jpg',
  'img/dado_faces/face_3.jpg',
  'img/dado_faces/face_4.jpg',
  'img/dado_faces/face_5.jpg',
  'img/dado_faces/face_6.jpg'
];

let roomId = null;
let currentUser = null;
let isRoomOwner = false;
let players = {};
let myCharacter = null;
let myDice = null;
let opponentCharacter = null;
let gameStarted = false;
const database = firebase.database();

document.addEventListener('DOMContentLoaded', function() {
  checkLogin();
  setupEventListeners();
});

function checkLogin() {
  const savedUser = localStorage.getItem('tempUser');
  if (savedUser) {
    currentUser = savedUser;
    updateLoginUI();
  }
}

function setupEventListeners() {
  document.getElementById('login-button').addEventListener('click', handleLogin);
  document.getElementById('logout-button').addEventListener('click', handleLogout);
  document.getElementById('create-room').addEventListener('click', createRoom);
  document.getElementById('join-room').addEventListener('click', joinRoom);
  document.getElementById('sortear-imagem').addEventListener('click', sortearPersonagem);
  document.getElementById('sortear-dado').addEventListener('click', sortearDado);
  document.getElementById('declare-winner').addEventListener('click', declareWinner);
  document.getElementById('guess-button').addEventListener('click', checkGuess);

  document.querySelectorAll('.personagens img').forEach(img => {
    img.addEventListener('click', function() {
      this.classList.toggle('pb');
    });
  });
}

function handleLogin() {
  const name = document.getElementById('login-name').value.trim();
  const password = document.getElementById('login-password').value.trim();
  
  if (name && password) {
    currentUser = name;
    localStorage.setItem('tempUser', name);
    updateLoginUI();
  } else {
    alert('Digite nome e senha!');
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('tempUser');
  document.querySelector('.login-container').style.display = 'block';
  document.getElementById('logged-user').style.display = 'none';
  alert('Você saiu da conta!');
}

function updateLoginUI() {
  const loggedUserDiv = document.getElementById('logged-user');
  loggedUserDiv.querySelector('#username').textContent = currentUser;
  loggedUserDiv.style.display = 'flex';
  document.querySelector('.login-container').style.display = 'none';
}

function createRoom() {
  if (!currentUser) {
    alert('Faça login primeiro!');
    return;
  }

  isRoomOwner = true;
  roomId = Math.random().toString(36).substr(2, 8).toUpperCase();
  
  const roomData = {
    owner: currentUser,
    players: { [currentUser]: true },
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    roomId: roomId,
    diceValues: {
      owner: null,
      visitor: null,
      ownerReady: false,
      visitorReady: false
    },
    diceAlertShown: false
  };

  database.ref(`rooms/${roomId}`).set(roomData)
    .then(() => {
      document.getElementById('room-id').textContent = `ID da Sala: ${roomId}`;
      document.querySelector('.sortedado').style.display = 'block';
      listenToRoom();
    });
}

function joinRoom() {
  if (!currentUser) {
    alert('Faça login primeiro!');
    return;
  }

  const inputRoomId = prompt('Digite o ID da sala:');
  if (!inputRoomId) return;

  roomId = inputRoomId;
  database.ref(`rooms/${roomId}`).once('value')
    .then(snapshot => {
      if (!snapshot.exists()) throw new Error('Sala não encontrada');
      return database.ref(`rooms/${roomId}/players`).update({ [currentUser]: true });
    })
    .then(() => {
      document.getElementById('room-id').textContent = `ID da Sala: ${roomId}`;
      document.querySelector('.sortedado').style.display = 'block';
      listenToRoom();
    })
    .catch(error => {
      alert('Erro: ' + error.message);
    });
}

function updatePlayersList() {
  const select = document.getElementById('winner-select');
  select.innerHTML = '<option value="">Selecione o vencedor</option>';
  
  Object.keys(players).forEach(player => {
    const option = document.createElement('option');
    option.value = player;
    option.textContent = player;
    select.appendChild(option);
  });
}

function updateOpponentSelect() {
  const select = document.getElementById('guess-character');
  select.innerHTML = '<option value="">Selecione um personagem</option>';
  
  imagensPersonagens.forEach(personagem => {
    const option = document.createElement('option');
    const characterName = personagem.split('/').pop().replace('.jpg', '');
    option.value = characterName;
    option.textContent = characterName;
    select.appendChild(option);
  });
}

function showCharacterImage(character) {
  const imgElement = document.getElementById('imagem');
  imgElement.src = character;
  imgElement.style.display = 'block';
}

function showDiceImage(dice) {
  const imgElement = document.getElementById('imagem2');
  imgElement.src = dice;
  imgElement.style.display = 'block';
}

function listenToRoom() {
  let diceAlertShown = false;
  let characterAlertShown = false;
  let winnerAlertShown = false;

  database.ref(`rooms/${roomId}`).on('value', snapshot => {
    const roomData = snapshot.val();
    if (!roomData) return;

    if (roomData.players) {
      players = roomData.players;
      updatePlayersList();
      updateOpponentSelect();
    }

    if (roomData.roomId) {
      document.getElementById('room-id').textContent = `ID da Sala: ${roomData.roomId}`;
    }

    if (roomData.sortedCharacterOwner && isRoomOwner && !characterAlertShown) {
      myCharacter = roomData.sortedCharacterOwner;
      opponentCharacter = roomData.sortedCharacterVisitor;
      showCharacterImage(myCharacter);
      characterAlertShown = true;
      gameStarted = true;
    }

    if (roomData.sortedCharacterVisitor && !isRoomOwner && !characterAlertShown) {
      myCharacter = roomData.sortedCharacterVisitor;
      opponentCharacter = roomData.sortedCharacterOwner;
      showCharacterImage(myCharacter);
      characterAlertShown = true;
      gameStarted = true;
    }

    if (roomData.diceValues && 
        roomData.diceValues.ownerReady && 
        roomData.diceValues.visitorReady && 
        !diceAlertShown) {
      
      const diceValue = isRoomOwner ? roomData.diceValues.owner : roomData.diceValues.visitor;
      const opponentDiceValue = isRoomOwner ? roomData.diceValues.visitor : roomData.diceValues.owner;
      const opponentName = isRoomOwner ? Object.keys(players).find(p => p !== currentUser) : roomData.owner;
      
      if (!isNaN(diceValue) && !isNaN(opponentDiceValue)) {
        const quemComeca = diceValue > opponentDiceValue ? currentUser : opponentName;
        
        alert(`RESULTADO DO DADO:\n\nVocê: ${diceValue}\nOponente: ${opponentDiceValue}\n\nQUEM COMEÇA: ${quemComeca}`);
        diceAlertShown = true;
        database.ref(`rooms/${roomId}/diceAlertShown`).set(true);
      }
    }

    if (roomData.winner && !winnerAlertShown) {
      winnerAlertShown = true;
      if (currentUser === roomData.winner) {
        alert('🎉 PARABÉNS! VOCÊ VENCEU O JOGO!');
      } else {
        alert('😢 VOCÊ PERDEU... MELHOR SORTE NA PRÓXIMA!');
      }
    }
  });
}

function sortearPersonagem() {
  if (!roomId) {
    alert('Entre ou crie uma sala primeiro!');
    return;
  }

  const randomIndex = Math.floor(Math.random() * imagensPersonagens.length);
  const sortedCharacter = imagensPersonagens[randomIndex];
  showCharacterImage(sortedCharacter);

  if (isRoomOwner) {
    database.ref(`rooms/${roomId}`).update({ 
      sortedCharacterOwner: sortedCharacter 
    });
  } else {
    database.ref(`rooms/${roomId}`).update({ 
      sortedCharacterVisitor: sortedCharacter 
    });
  }
}

function sortearDado() {
  if (!roomId) {
    alert('Entre ou crie uma sala primeiro!');
    return;
  }

  database.ref(`rooms/${roomId}/diceAlertShown`).once('value').then(snapshot => {
    if (snapshot.exists() && snapshot.val()) {
      alert('O dado já foi sorteado e o jogo começou!');
      return;
    }

    const randomIndex = Math.floor(Math.random() * imagensDado.length);
    const sortedDice = imagensDado[randomIndex];
    const diceValue = parseInt(sortedDice.match(/\d+/)[0]);
    
    showDiceImage(sortedDice);

    if (isRoomOwner) {
      database.ref(`rooms/${roomId}/diceValues`).update({ 
        owner: diceValue,
        ownerReady: true 
      });
    } else {
      database.ref(`rooms/${roomId}/diceValues`).update({ 
        visitor: diceValue,
        visitorReady: true 
      });
    }
  });
}

function checkGuess() {
  if (!gameStarted) {
    alert('O jogo ainda não começou!');
    return;
  }

  const select = document.getElementById('guess-character');
  const guessedCharacter = select.value;
  
  if (!guessedCharacter) {
    alert('Selecione um personagem!');
    return;
  }

  const opponentCharacterName = opponentCharacter.split('/').pop().replace('.jpg', '');
  
  if (guessedCharacter === opponentCharacterName) {
    alert('🎉 PARABÉNS! Você acertou o personagem do oponente!');
    database.ref(`rooms/${roomId}`).update({ winner: currentUser });
  } else {
    alert('❌ Errou! Tente novamente.');
  }
}

function declareWinner() {
  const winner = document.getElementById('winner-select').value;
  if (winner) {
    database.ref(`rooms/${roomId}`).update({ 
      winner: winner 
    });
  } else {
    alert('Selecione um jogador!');
  }
}