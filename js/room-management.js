//let roomListener = null;
//let messagesListener = null;
//let notificationsListener = null;
//let isInitialChatLoad = true;
//let chatMessages = {};

function createRoom() {
    document.getElementById('create-room')?.addEventListener('click', async function() {
        const isAuthenticated = await requireAuth();
        if (!isAuthenticated) return;
        
        if (!currentUser || !currentUser.uid) {
            alert('Faça login primeiro!');
            window.location.href = 'login.html';
            return;
        }

        isRoomOwner = true;
        roomId = Math.random().toString(36).substr(2, 8).toUpperCase();
        
        const roomData = {
            owner: currentUser.uid,
            ownerName: currentUser.displayName || currentUser.email.split('@')[0],
            players: { [currentUser.uid]: true },
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            roomId: roomId,
            diceValues: {
                owner: null,
                visitor: null,
                ownerReady: false,
                visitorReady: false
            },
            diceAlertShown: false,
            currentPlayer: null,
            diceResultsShown: false,
            notifications: {}
        };

        database.ref(`rooms/${roomId}`).set(roomData)
            .then(() => {
                document.getElementById('room-id').textContent = `ID da Sala: ${roomId}`;
                document.querySelector('.sortedado').style.display = 'block';
                document.body.classList.add('in-room');
                listenToRoom();
                setupNotificationListener();
            })
            .catch(error => {
                console.error("Erro ao criar sala:", error);
                alert('Erro ao criar sala. Tente novamente.');
            });
    });
}

function joinRoom() {
    if (!currentUser || !currentUser.uid) {
        alert('Faça login primeiro!');
        window.location.href = 'login.html';
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
            return database.ref(`rooms/${roomId}/players`).update({ 
                [currentUser.uid]: true
            });
        })
        .then(() => {
            document.getElementById('room-id').textContent = `ID da Sala: ${roomId}`;
            document.querySelector('.sortedado').style.display = 'block';
            document.body.classList.add('in-room');
            listenToRoom();
            setupNotificationListener();
        })
        .catch(error => {
            console.error("Erro ao entrar na sala:", error);
            alert('Erro: ' + error.message);
        });
}

function cleanupListeners() {
    if (!roomId) return;
    
    if (roomListener) {
        database.ref(`rooms/${roomId}`).off('value', roomListener);
        roomListener = null;
    }
    if (messagesListener) {
        database.ref(`rooms/${roomId}/messages`).off('child_added', messagesListener);
        messagesListener = null;
    }
    if (notificationsListener) {
        database.ref(`rooms/${roomId}/notifications`).off('child_added', notificationsListener);
        notificationsListener = null;
    }
}

function setupNotificationListener() {
    if (notificationsListener) {
        database.ref(`rooms/${roomId}/notifications`).off('child_added', notificationsListener);
    }

    notificationsListener = database.ref(`rooms/${roomId}/notifications`).on('child_added', (snapshot) => {
        const notification = snapshot.val();
        
        if (notification.from !== currentUser.uid) {
            switch (notification.type) {
                case 'wrong_guess':
                    showCustomAlert(`🚨 ${notification.fromName} tentou adivinhar "${notification.guessedCharacter}" e errou! (${notification.attempts})`);
                    break;
            }
            
            snapshot.ref.remove();
        }
    });
}

function showCustomAlert(message) {
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = 'custom-alert';
    alert.innerHTML = message;
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5500);
}

function listenToRoom() {
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
                const senderName = msg.senderName || msg.sender || 'Anônimo';
                msgElement.innerHTML = `<strong>${senderName}:</strong> ${msg.text}`;
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
            !roomData.diceResultsShown) {
            
            const diceValue = isRoomOwner ? roomData.diceValues.owner : roomData.diceValues.visitor;
            const opponentDiceValue = isRoomOwner ? roomData.diceValues.visitor : roomData.diceValues.owner;
            
            if (!isNaN(diceValue)) {
                database.ref(`rooms/${roomId}`).update({
                    diceResultsShown: true,
                    currentPlayer: diceValue > opponentDiceValue ? currentUser.uid : 
                        Object.keys(roomData.players).find(p => p !== currentUser.uid)
                });
            }
        }
    });
}

function setupGameInteractions() {
    document.querySelectorAll('.personagens img').forEach(img => {
        img.addEventListener('click', function() {
            this.classList.toggle('eliminated');
        });
    });
}