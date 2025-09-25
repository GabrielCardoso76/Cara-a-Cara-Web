// js/main.js
// js/main.js
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const wsHost = window.location.hostname;
const wsPort = isLocal ? ':8080' : ''; // Render handles port mapping automatically in production
const WS_URL = `${wsProtocol}${wsHost}${wsPort}/ws`; // Connect to the /ws path
let socket;

function connectWebSocket() {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        console.log('Conectado ao servidor WebSocket.');
        // Se já tivermos um username, faz o login automaticamente
        const username = sessionStorage.getItem('username');
        if (username) {
            sendMessage('login', { username });
        }
    };

    socket.onmessage = (event) => {
        const { type, payload } = JSON.parse(event.data);
        
        // Delega o tratamento da mensagem para o módulo apropriado
        if (type === 'ROOM_LIST_UPDATE' && typeof handleRoomListUpdate === 'function') {
            handleRoomListUpdate(payload);
        } else if (type === 'GAME_STATE_UPDATE' && typeof handleGameStateUpdate === 'function') {
            handleGameStateUpdate(payload);
        } else if (type === 'error' && typeof handleErrorMessage === 'function') {
            handleErrorMessage(payload);
        }
    };

    socket.onclose = () => {
        console.log('Desconectado do servidor WebSocket. Tentando reconectar...');
        setTimeout(connectWebSocket, 3000); // Tenta reconectar a cada 3 segundos
    };

    socket.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        socket.close();
    };
}

function sendMessage(type, payload) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        // Garante que o username esteja sempre no payload se existir
        const username = sessionStorage.getItem('username');
        const message = JSON.stringify({ type, payload: { ...payload, username } });
        socket.send(message);
    } else {
        console.error('Não é possível enviar mensagem, WebSocket não está conectado.');
    }
}

// Inicia a conexão quando o script principal é carregado
connectWebSocket();