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

let chatMessages = {};
let isInitialChatLoad = true;
let roomListener = null;
let messagesListener = null;
let roomId = null;
let currentUser = null;
let isRoomOwner = false;
let players = {};
let myCharacter = null;
let myDice = null;
let opponentCharacter = null;
let gameStarted = false;
let wrongAttempts = 0;
const MAX_WRONG_ATTEMPTS = 5;
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
  document.getElementById('guess-button').addEventListener('click', checkGuess);
  document.getElementById('send-message').addEventListener('click', sendMessage);
  document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
  });

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
  cleanupListeners();
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

  cleanupListeners();
  isInitialChatLoad = true;
  chatMessages = {};
  
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

function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (message && currentUser && roomId) {
    const timestamp = new Date().getTime();
    
    database.ref(`rooms/${roomId}/messages`).push().set({
      sender: currentUser,
      text: message,
      timestamp: timestamp
    }).then(() => {
      input.value = '';
    }).catch(error => {
      console.error('Erro ao enviar mensagem:', error);
    });
  }
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

  cleanupListeners();
  document.getElementById('chat-messages').innerHTML = '';

  messagesListener = database.ref(`rooms/${roomId}/messages`).on('child_added', snapshot => {
    const messageId = snapshot.key;
    const msg = snapshot.val();
    
    if (!chatMessages[messageId]) {
      chatMessages[messageId] = true;
      
      if (!document.querySelector(`[data-message-id="${messageId}"]`)) {
        const msgElement = document.createElement('div');
        msgElement.dataset.messageId = messageId;
        msgElement.innerHTML = `<strong>${msg.sender}:</strong> ${msg.text}`;
        document.getElementById('chat-messages').appendChild(msgElement);
        
        if (!isInitialChatLoad) {
          document.getElementById('chat-messages').scrollTop = 
            document.getElementById('chat-messages').scrollHeight;
        }
      }
    }
  });

  roomListener = database.ref(`rooms/${roomId}`).on('value', snapshot => {
    const roomData = snapshot.val();
    if (!roomData) return;

    if (isInitialChatLoad && roomData.messages) {
      loadInitialMessages(roomData.messages);
      isInitialChatLoad = false;
    }

    if (roomData.players) {
      players = roomData.players;
      updateOpponentSelect();
    }

    if (roomData.roomId) {
      document.getElementById('room-id').textContent = `ID da Sala: ${roomData.roomId}`;
    }

    if (roomData.sortedCharacterOwner && isRoomOwner) {
      myCharacter = roomData.sortedCharacterOwner;
      opponentCharacter = roomData.sortedCharacterVisitor || null;
      if (myCharacter && !characterAlertShown) {
        showCharacterImage(myCharacter);
        characterAlertShown = true;
        gameStarted = true;
      }
    }

    if (roomData.sortedCharacterVisitor && !isRoomOwner) {
      myCharacter = roomData.sortedCharacterVisitor;
      opponentCharacter = roomData.sortedCharacterOwner || null;
      if (myCharacter && !characterAlertShown) {
        showCharacterImage(myCharacter);
        characterAlertShown = true;
        gameStarted = true;
      }
    }

    if (roomData.diceValues && 
        roomData.diceValues.ownerReady && 
        roomData.diceValues.visitorReady && 
        !diceAlertShown) {
      
      const diceValue = isRoomOwner ? roomData.diceValues.owner : roomData.diceValues.visitor;
      const opponentDiceValue = isRoomOwner ? roomData.diceValues.visitor : roomData.diceValues.owner;
      
      if (!isNaN(diceValue) && !isNaN(opponentDiceValue)) {
        if (diceValue === opponentDiceValue) {
          alert('EMPATE! Os dados serão sorteados novamente.');
          database.ref(`rooms/${roomId}/diceValues`).update({
            owner: null,
            visitor: null,
            ownerReady: false,
            visitorReady: false
          });
          diceAlertShown = false;
          return;
        }
        
        const opponentName = isRoomOwner ? Object.keys(players).find(p => p !== currentUser) : roomData.owner;
        const quemComeca = diceValue > opponentDiceValue ? currentUser : opponentName;
        
        alert(`RESULTADO DO DADO:\n\nVocê: ${diceValue}\nOponente: ${opponentDiceValue}\n\nQUEM COMEÇA: ${quemComeca}`);
        diceAlertShown = true;
        database.ref(`rooms/${roomId}/diceAlertShown`).set(true);
      }
    }

    if (roomData.gameEnded && !winnerAlertShown) {
      winnerAlertShown = true;
      const endMessage = roomData.endMessage || 
                       (roomData.winner === currentUser ? 'Você venceu!' : 'Você perdeu!');
      
      alert(endMessage);
      setTimeout(() => {
        window.location.href = 'cara1.html';
      }, 2000);
    }
    
    updateWrongAttemptsUI();
  });
}

function loadInitialMessages(messages) {
  Object.keys(messages).forEach(messageId => {
    const msg = messages[messageId];
    if (!chatMessages[messageId]) {
      chatMessages[messageId] = true;
      const msgElement = document.createElement('div');
      msgElement.dataset.messageId = messageId;
      msgElement.innerHTML = `<strong>${msg.sender}:</strong> ${msg.text}`;
      document.getElementById('chat-messages').appendChild(msgElement);
    }
  });
  document.getElementById('chat-messages').scrollTop = 
    document.getElementById('chat-messages').scrollHeight;
}

function cleanupListeners() {
  if (roomListener) {
    database.ref(`rooms/${roomId}`).off('value', roomListener);
    roomListener = null;
  }
  if (messagesListener) {
    database.ref(`rooms/${roomId}/messages`).off('child_added', messagesListener);
    messagesListener = null;
  }
}

function updateWrongAttemptsUI() {
  const attemptsElement = document.getElementById('wrong-attempts');
  if (attemptsElement) {
    attemptsElement.textContent = `Tentativas erradas: ${wrongAttempts}/${MAX_WRONG_ATTEMPTS}`;
  }
}

function sortearPersonagem() {
  if (!roomId) {
    alert('Entre ou crie uma sala primeiro!');
    return;
  }

  wrongAttempts = 0;
  updateWrongAttemptsUI();

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

    setTimeout(() => {
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
    }, 1000);
  });
}

function checkGuess() {
  database.ref(`rooms/${roomId}`).once('value').then(snapshot => {
    const roomData = snapshot.val();
    if (!roomData) {
      alert('Sala não encontrada!');
      return;
    }

    const bothCharactersSelected = roomData.sortedCharacterOwner && roomData.sortedCharacterVisitor;
    if (!bothCharactersSelected) {
      alert('Aguardando ambos os jogadores sortearem seus personagens!');
      return;
    }

    myCharacter = isRoomOwner ? roomData.sortedCharacterOwner : roomData.sortedCharacterVisitor;
    opponentCharacter = isRoomOwner ? roomData.sortedCharacterVisitor : roomData.sortedCharacterOwner;

    const select = document.getElementById('guess-character');
    const guessedCharacter = select.value;
    
    if (!guessedCharacter) {
      alert('Selecione um personagem!');
      return;
    }

    try {
      const opponentCharacterName = opponentCharacter.split('/').pop().replace('.jpg', '');
      
      if (guessedCharacter === opponentCharacterName) {
        alert('🎉 PARABÉNS! Você acertou o personagem do oponente!');
        const loser = isRoomOwner ? Object.keys(players).find(p => p !== currentUser) : roomData.owner;
        database.ref(`rooms/${roomId}`).update({ 
          winner: currentUser,
          loser: loser,
          gameEnded: true,
          endMessage: `${currentUser} acertou seu personagem!`
        });
      } else {
        wrongAttempts++;
        alert(`❌ Errou! Tentativas erradas: ${wrongAttempts}/${MAX_WRONG_ATTEMPTS}`);
        
        if (wrongAttempts >= MAX_WRONG_ATTEMPTS) {
          alert(`⚠️ VOCÊ PERDEU! Errou ${MAX_WRONG_ATTEMPTS} vezes.`);
          const winner = isRoomOwner ? Object.keys(players).find(p => p !== currentUser) : roomData.owner;
          database.ref(`rooms/${roomId}`).update({ 
            winner: winner,
            loser: currentUser,
            gameEnded: true,
            endMessage: `${currentUser} errou 5 vezes e perdeu!`
          });
        }
      }
      updateWrongAttemptsUI();
    } catch (error) {
      console.error('Erro ao verificar palpite:', error);
      alert('Ocorreu um erro ao verificar seu palpite. Tente novamente.');
    }
  }).catch(error => {
    console.error('Erro ao verificar sala:', error);
    alert('Erro ao verificar estado do jogo. Tente novamente.');
  });
}