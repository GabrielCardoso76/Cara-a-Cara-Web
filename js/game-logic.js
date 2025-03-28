if (typeof database === 'undefined') {
    console.error('Database não foi inicializado!');
    window.location.reload();
}

if (!imagensPersonagens || !imagensPersonagens.length) {
    console.error('Lista de personagens não carregada!');
    imagensPersonagens = [];
}

async function updateUserStats(userId, result) {
    try {
        const updates = {};
        const userRef = database.ref(`users/${userId}`);
        
        updates['/matches'] = firebase.database.ServerValue.increment(1);
        
        if (result === 'win') {
            updates['/wins'] = firebase.database.ServerValue.increment(1);
        } else if (result === 'loss') {
            updates['/losses'] = firebase.database.ServerValue.increment(1);
        }
        
        await userRef.update(updates);
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        throw error;
    }
}

async function checkGuess() {
    try {
        if (!currentUser?.uid) {
            alert('Sessão expirada. Faça login novamente!');
            window.location.href = 'login.html';
            return;
        }

        const roomRef = database.ref(`rooms/${roomId}`);
        const snapshot = await roomRef.once('value');
        const roomData = snapshot.val();
        
        if (!roomData) {
            alert('Sala não encontrada!');
            return;
        }

        if (!roomData.sortedCharacterOwner || !roomData.sortedCharacterVisitor) {
            alert('Aguardando ambos os jogadores sortearem seus personagens!');
            return;
        }

        if (roomData.currentPlayer !== currentUser.uid) {
            alert('Aguarde sua vez para jogar!');
            return;
        }

        const opponentCharacter = isRoomOwner ? roomData.sortedCharacterVisitor : roomData.sortedCharacterOwner;
        const opponentCharacterName = opponentCharacter.split('/').pop().replace('.jpg', '');
        
        const guessedCharacter = document.getElementById('guess-character').value;
        if (!guessedCharacter) {
            alert('Selecione um personagem!');
            return;
        }

        if (guessedCharacter === opponentCharacterName) {
            const loserUid = isRoomOwner ? 
                Object.keys(roomData.players).find(uid => uid !== currentUser.uid) : 
                roomData.owner;
            
            await Promise.all([
                updateUserStats(currentUser.uid, 'win'),
                loserUid && updateUserStats(loserUid, 'loss')
            ]);

            await roomRef.update({ 
                winner: currentUser.uid,
                loser: loserUid,
                gameEnded: true,
                endMessage: `${currentUser.displayName || 'Jogador'} acertou!`
            });
            alert('🎉 Parabéns! Você acertou!');
        } else {
            wrongAttempts++;
            updateWrongAttemptsUI();
            
            if (wrongAttempts >= MAX_WRONG_ATTEMPTS) {
                const winnerUid = isRoomOwner ? 
                    Object.keys(roomData.players).find(uid => uid !== currentUser.uid) : 
                    roomData.owner;
                
                await Promise.all([
                    updateUserStats(currentUser.uid, 'loss'),
                    winnerUid && updateUserStats(winnerUid, 'win')
                ]);

                await roomRef.update({ 
                    winner: winnerUid,
                    loser: currentUser.uid,
                    gameEnded: true,
                    endMessage: `${currentUser.displayName || 'Jogador'} errou 5 vezes!`
                });
                alert('⏰ Você perdeu! Errou 5 vezes.');
            } else {
                alert(`❌ Errou! Tentativas: ${wrongAttempts}/${MAX_WRONG_ATTEMPTS}`);
                await roomRef.update({
                    currentPlayer: isRoomOwner ? 
                        Object.keys(roomData.players).find(uid => uid !== currentUser.uid) : 
                        roomData.owner
                });
            }
        }
    } catch (error) {
        console.error('Erro no palpite:', error);
        alert(`Erro: ${error.message || 'Ocorreu um erro ao verificar seu palpite'}`);
    }
}

function listenToRoom() {
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
            
            if (!isNaN(diceValue) && !isNaN(opponentDiceValue)) {
                if (diceValue === opponentDiceValue) {
                    database.ref(`rooms/${roomId}/diceValues`).update({
                        owner: null,
                        visitor: null,
                        ownerReady: false,
                        visitorReady: false
                    });
                    alert('EMPATE! Os dados serão sorteados novamente.');
                    return;
                }
                
                const opponentUid = isRoomOwner ? 
                    Object.keys(roomData.players).find(p => p !== currentUser.uid) : 
                    roomData.owner;
                
                database.ref(`users/${currentUser.uid}`).once('value').then(userSnap => {
                    const currentUserName = userSnap.val().username || currentUser.email.split('@')[0];
                    
                    database.ref(`users/${opponentUid}`).once('value').then(opponentSnap => {
                        const opponentName = opponentSnap.val().username || opponentSnap.val().email.split('@')[0];
                        const quemComeca = diceValue > opponentDiceValue ? currentUserName : opponentName;
                        const startingPlayer = diceValue > opponentDiceValue ? currentUser.uid : opponentUid;
                        
                        database.ref(`rooms/${roomId}`).update({
                            diceResultsShown: true,
                            currentPlayer: startingPlayer
                        }).then(() => {
                            alert(`RESULTADO DO DADO:\n\nVocê: ${diceValue}\nOponente: ${opponentDiceValue}\n\nQUEM COMEÇA: ${quemComeca}`);
                        });
                    });
                });
            }
        }

        if (roomData.gameEnded && !winnerAlertShown) {
            winnerAlertShown = true;
            let endMessage;
            
            if (roomData.winner === currentUser.uid) {
                endMessage = roomData.endMessage || 'Você venceu!';
            } else {
                endMessage = roomData.endMessage || 'Você perdeu!';
            }
            
            alert(endMessage);
            setTimeout(() => {
                window.location.href = 'cara1.html';
            }, 2000);
        }
        
        updateWrongAttemptsUI();
    });
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

    database.ref(`rooms/${roomId}/diceResultsShown`).once('value').then(snapshot => {
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

document.querySelectorAll('.personagens img').forEach(img => {
    img.addEventListener('click', function() {
        this.classList.toggle('eliminated');
    });
});