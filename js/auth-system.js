// auth-system.js
// Variáveis globais compartilhadas
window.currentUser = null;
window.auth = firebase.auth();
window.database = firebase.database();

// Função para definir o usuário atual
window.setCurrentUser = function(user) {
    window.currentUser = user;
    console.log('Usuário atual definido:', user ? user.email : 'null');
    
    // Dispara evento personalizado quando o usuário muda
    document.dispatchEvent(new CustomEvent('userStateChanged', {
        detail: { user: user }
    }));
};

// Listener de autenticação
auth.onAuthStateChanged(function(user) {
    setCurrentUser(user);
    updateLoginUI(user); // Certifique-se que esta função está definida
    
    if (user) {
        console.log('Usuário logado:', user.uid);
    } else {
        console.log('Nenhum usuário logado');
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
});


// Função para atualizar a UI
function updateLoginUI(user) {
    const loginLink = document.getElementById('login-link');
    const userGreeting = document.getElementById('user-greeting');
    const logoutBtn = document.getElementById('logout-button');
    
    if (user) {
        if (loginLink) loginLink.style.display = 'none';
        if (userGreeting) {
            userGreeting.style.display = 'inline';
            userGreeting.textContent = `Olá, ${user.displayName || user.email}`;
        }
        if (logoutBtn) logoutBtn.style.display = 'inline';
    } else {
        if (loginLink) loginLink.style.display = 'inline';
        if (userGreeting) userGreeting.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

async function registerUser(email, password, username) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: username });
        
        await database.ref(`users/${userCredential.user.uid}`).set({
            username: username,
            email: email,
            displayName: username,  // Garante que teremos este campo
            wins: 0,
            losses: 0,
            matches: 0,
            createdAt: new Date().toISOString()
        });
        
        return userCredential.user;
    } catch (error) {
        console.error("Erro no registro:", error);
        throw error;
    }
}

// Função de login
async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Erro no login:", error);
        throw error;
    }
}

// Função de logout
function logoutUser() {
    return auth.signOut();
}

auth.onAuthStateChanged(user => {
    if (user) {
        console.log("Usuário logado:", user.uid);
        setCurrentUser(user);  // Atualiza a variável global corretamente
    } else {
        console.log("Nenhum usuário logado");
        setCurrentUser(null);
    }
    updateLoginUI(user);
});

// game-logic.js ou auth-system.js
async function updateUserStats(userId, result) {
    try {
        const updates = {};
        const userRef = database.ref(`users/${userId}`);
        
        // Atualiza estatísticas baseadas no resultado
        updates['/matches'] = firebase.database.ServerValue.increment(1);
        
        if (result === 'win') {
            updates['/wins'] = firebase.database.ServerValue.increment(1);
        } else if (result === 'loss') {
            updates['/losses'] = firebase.database.ServerValue.increment(1);
        }
        
        await userRef.update(updates);
        console.log(`Estatísticas atualizadas para ${userId}: ${result}`);
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        throw error;
    }
}
