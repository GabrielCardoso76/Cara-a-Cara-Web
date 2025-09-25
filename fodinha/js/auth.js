// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('username');
            const username = usernameInput.value.trim();

            if (username) {
                sessionStorage.setItem('username', username);
                sendMessage('login', { username });
                window.location.href = 'lobby.html';
            } else {
                const errorMessage = document.getElementById('error-message');
                errorMessage.textContent = 'Por favor, insira um nome de usuário.';
            }
        });
    }
});