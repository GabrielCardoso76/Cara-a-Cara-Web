// Fallback para funções não carregadas
window.sortearDado = window.sortearDado || function() {
    console.error('sortearDado() não carregada - recarregando...');
    setTimeout(() => window.location.reload(), 1000);
    return false;
};
// No início do arquivo
window.sortearPersonagem = window.sortearPersonagem || function() {
    alert('Função ainda não carregada. Recarregando...');
    window.location.reload();
};// main.js - Versão completa e corrigida

// Verifica se o Firebase está carregado corretamente
if (typeof firebase === 'undefined') {
    console.error('Firebase não foi carregado corretamente!');
    // Mostra mensagem de erro para o usuário
    alert('Erro ao carregar o sistema. Por favor, recarregue a página.');
} else {
    console.log('Firebase carregado com sucesso:', firebase);
}

// Função para atualizar a interface do usuário
function updateLoginUI(user) {
    const loggedUserDiv = document.getElementById('logged-user');
    const loginLink = document.getElementById('login-link');
    const userGreeting = document.getElementById('user-greeting');
    const logoutBtn = document.getElementById('logout-button');
    const loginContainer = document.querySelector('.login-container');

    if (user) {
        // Usuário está logado
        if (loggedUserDiv) {
            loggedUserDiv.querySelector('#username').textContent = user.displayName || user.email;
            loggedUserDiv.style.display = 'flex';
        }
        if (loginContainer) loginContainer.style.display = 'none';
        if (loginLink) loginLink.style.display = 'none';
        if (userGreeting) {
            userGreeting.textContent = `Bem-vindo, ${user.displayName || user.email}`;
            userGreeting.style.display = 'inline';
        }
        if (logoutBtn) logoutBtn.style.display = 'inline';
    } else {
        // Usuário não está logado
        if (loggedUserDiv) loggedUserDiv.style.display = 'none';
        if (loginContainer) loginContainer.style.display = 'block';
        if (loginLink) loginLink.style.display = 'inline';
        if (userGreeting) userGreeting.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// Função para configurar os listeners de eventos
function setupEventListeners() {
    try {
        if (typeof createRoom !== 'function') {
            console.error('createRoom não está definido!');
            return;
        }
        document.getElementById('create-room')?.addEventListener('click', createRoom);
        document.getElementById('join-room')?.addEventListener('click', joinRoom);
        // Configura listeners com verificações
        const setupButtonListener = (id, handler) => {
            const btn = document.getElementById(id);
            if (btn) {
                if (typeof handler === 'function') {
                    btn.addEventListener('click', handler);
                } else {
                    console.error(`Função ${handler.name} não definida para o botão ${id}`);
                }
            }
        };

        // Configura todos os listeners com verificações
        setupButtonListener('create-room', createRoom);
        setupButtonListener('join-room', joinRoom);
        setupButtonListener('sortear-imagem', sortearPersonagem);
        setupButtonListener('sortear-dado', sortearDado);
        setupButtonListener('guess-button', checkGuess);
        setupButtonListener('send-message', sendMessage);

        // Listener especial para o chat
        document.getElementById('chat-input')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });

        // Listeners para os personagens
        document.querySelectorAll('.personagens img')?.forEach(img => {
            img.addEventListener('click', function() {
                this.classList.toggle('pb');
            });
        });

        console.log('Event listeners configurados com sucesso');
    } catch (error) {
        console.error('Erro ao configurar event listeners:', error);
    }
}

// Função para lidar com logout
async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao sair da conta. Por favor, tente novamente.');
    }
}

// Inicialização principal quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM completamente carregado');

    // Verifica autenticação
    auth.onAuthStateChanged(user => {
        console.log('Estado de autenticação alterado:', user);
        
        if (!user) {
            // Redireciona para login se não estiver autenticado
            if (!window.location.pathname.includes('login.html')) {
                console.log('Usuário não autenticado, redirecionando...');
                window.location.href = 'login.html';
            }
            return;
        }

        // Atualiza o usuário atual e a interface
        window.currentUser = user;
        updateLoginUI(user);
        
        // Configura os listeners apenas quando autenticado
        setupEventListeners();
    });

    // Configura elementos de autenticação
    const loginLink = document.getElementById('login-link');
    const logoutBtn = document.getElementById('logout-button');
    
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'login.html';
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Verificação adicional de segurança
    if (typeof auth === 'undefined') {
        console.error('Objeto auth não definido! Verifique firebase-config.js');
        alert('Erro no sistema de autenticação. Recarregue a página.');
    }
});

// Funções auxiliares para tratamento de erros
window.addEventListener('error', function(error) {
    console.error('Erro global capturado:', error);
    // Aqui você pode adicionar tratamento de erros mais sofisticado
});

// Exporta funções se estiver usando módulos
if (typeof exports !== 'undefined') {
    exports.updateLoginUI = updateLoginUI;
    exports.setupEventListeners = setupEventListeners;
    exports.handleLogout = handleLogout;
}