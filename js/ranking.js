// ranking.js

// Torna as funções globais para serem acessadas pelo HTML
window.getRanking = async function() {
    try {
        const snapshot = await database.ref('users').orderByChild('wins').limitToLast(10).once('value');
        const users = [];
        
        snapshot.forEach(childSnapshot => {
            const userData = childSnapshot.val();
            users.push({
                username: userData.username || userData.displayName || userData.email.split('@')[0] || 'Jogador',
                wins: userData.wins || 0,
                losses: userData.losses || 0,
                matches: userData.matches || 0
            });
        });
        
        // Ordena por vitórias (decrescente)
        return users.sort((a, b) => b.wins - a.wins);
    } catch (error) {
        console.error("Erro ao buscar ranking:", error);
        return [];
    }
}

window.displayRanking = function(users) {
    const rankingContainer = document.getElementById('ranking-container');
    if (!rankingContainer) return;
    
    if (users.length === 0) {
        rankingContainer.innerHTML = '<p>Nenhum dado de ranking disponível ainda.</p>';
        return;
    }
    
    rankingContainer.innerHTML = `
        <h2>Ranking dos Melhores Jogadores</h2>
        <table>
            <thead>
                <tr>
                    <th>Posição</th>
                    <th>Jogador</th>
                    <th>Vitórias</th>
                    <th>Derrotas</th>
                    <th>Partidas</th>
                </tr>
            </thead>
            <tbody>
                ${users.map((user, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${user.username}</td>
                        <td>${user.wins}</td>
                        <td>${user.losses}</td>
                        <td>${user.matches}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}