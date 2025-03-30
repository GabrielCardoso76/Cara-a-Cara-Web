window.currentUser = null;
window.auth = firebase.auth();
window.database = firebase.database();

window.requireAuth = async function() {
    if (!window.currentUser) {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = 'login.html';
        return false;
    }
    return true;
};

window.setCurrentUser = function(user) {
    window.currentUser = user;
    console.log('Usuário atual definido:', user ? user.email : 'null');
    
    document.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { user: user }
    }));
};

auth.onAuthStateChanged(function(user) {
    setCurrentUser(user);
    updateAuthUI(user);
    
    if (user && sessionStorage.getItem('redirectAfterLogin')) {
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');
        if (window.location.pathname !== redirectUrl) {
            window.location.href = redirectUrl;
        }
    }
});

function updateAuthUI(user) {
    const loginLinks = document.querySelectorAll('.login-link');
    const userGreetings = document.querySelectorAll('.user-greeting');
    const logoutButtons = document.querySelectorAll('.logout-button');
    
    if (user) {
        loginLinks.forEach(el => el.style.display = 'none');
        userGreetings.forEach(el => {
            el.style.display = 'inline';
            el.textContent = `Olá, ${user.displayName || user.email.split('@')[0]}`;
        });
        logoutButtons.forEach(el => el.style.display = 'inline');
    } else {
        loginLinks.forEach(el => el.style.display = 'inline');
        userGreetings.forEach(el => el.style.display = 'none');
        logoutButtons.forEach(el => el.style.display = 'none');
    }
}

async function registerUser(email, password, username) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: username });
        
        await database.ref(`users/${userCredential.user.uid}`).set({
            username: username,
            email: email,
            displayName: username,  // Garante que temos displayName
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

async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Erro no login:", error);
        throw error;
    }
}

function logoutUser() {
    return auth.signOut();
}

auth.onAuthStateChanged(user => {
    if (user) {
        console.log("Usuário logado:", user.uid);
        setCurrentUser(user);
    } else {
        console.log("Nenhum usuário logado");
        setCurrentUser(null);
    }
});

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
        console.log(`Estatísticas atualizadas para ${userId}: ${result}`);
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        throw error;
    }
}