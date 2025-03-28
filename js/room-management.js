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
            diceResultsShown: false
        };

        database.ref(`rooms/${roomId}`).set(roomData)
            .then(() => {
                document.getElementById('room-id').textContent = `ID da Sala: ${roomId}`;
                document.querySelector('.sortedado').style.display = 'block';
                document.body.classList.add('in-room');
                listenToRoom();
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
}

function setupGameInteractions() {
    document.querySelectorAll('.personagens img').forEach(img => {
        img.addEventListener('click', function() {
            this.classList.toggle('eliminated');
        });
    });
}