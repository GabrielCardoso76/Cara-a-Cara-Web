// js/lobby.js
let currentRoomList = [];

function handleRoomListUpdate(payload) {
    currentRoomList = payload.rooms;
    renderLobby();
}

function renderLobby() {
    const roomListContainer = document.getElementById('room-list');
    const username = sessionStorage.getItem('username');
    document.getElementById('lobby-username').textContent = username;

    if (!roomListContainer) return;

    roomListContainer.innerHTML = ''; // Limpa a lista atual

    if (currentRoomList.length === 0) {
        roomListContainer.innerHTML = '<p class="col-span-full text-center text-gray-400">Nenhuma sala disponível. Que tal criar uma?</p>';
    } else {
        currentRoomList.forEach(room => {
            const isFull = room.playerCount >= 4;
            const roomElement = document.createElement('div');
            roomElement.className = 'bg-gray-700 p-4 rounded-lg shadow-md flex justify-between items-center';
            roomElement.innerHTML = `
                <div>
                    <h3 class="font-bold text-lg">${room.name}</h3>
                    <p class="text-sm text-gray-300">Jogadores: ${room.playerCount}/4</p>
                </div>
                <button 
                    class="join-room-btn ${isFull ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded-md transition duration-300"
                    data-room-id="${room.id}"
                    ${isFull ? 'disabled' : ''}
                >
                    ${isFull ? 'Cheia' : 'Entrar'}
                </button>
            `;
            roomListContainer.appendChild(roomElement);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const createRoomBtn = document.getElementById('create-room-btn');
    const createRoomModal = document.getElementById('create-room-modal');
    const cancelCreateRoomBtn = document.getElementById('cancel-create-room-btn');
    const createRoomForm = document.getElementById('create-room-form');
    const roomNameInput = document.getElementById('room-name');

    // Abre o modal de criação de sala
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
            const username = sessionStorage.getItem('username') || 'Jogador';
            roomNameInput.value = `Sala de ${username}`;
            createRoomModal.classList.remove('hidden');
        });
    }

    // Fecha o modal
    if (cancelCreateRoomBtn) {
        cancelCreateRoomBtn.addEventListener('click', () => {
            createRoomModal.classList.add('hidden');
        });
    }

    // Lida com o envio do formulário de criação de sala
    if (createRoomForm) {
        createRoomForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const roomName = roomNameInput.value;
            const initialLives = document.getElementById('initial-lives').value;
            const useAnulacaoRank = document.getElementById('anulacao-rank').checked;

            const roomOptions = {
                name: roomName,
                initialLives: parseInt(initialLives, 10),
                useAnulacaoRank: useAnulacaoRank
            };

            sendMessage('createRoom', { roomOptions });
            createRoomModal.classList.add('hidden');
        });
    }

    // Event listener para os botões de entrar (usando delegação de eventos)
    const roomListContainer = document.getElementById('room-list');
    if (roomListContainer) {
        roomListContainer.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('join-room-btn')) {
                const roomId = e.target.getAttribute('data-room-id');
                sendMessage('joinRoom', { roomId });
            }
        });
    }
    
    // Um estado de jogo inicial indica que entramos em uma sala
    window.handleGameStateUpdate = function(payload) {
        sessionStorage.setItem('gameState', JSON.stringify(payload));
        window.location.href = 'game.html';
    };
});