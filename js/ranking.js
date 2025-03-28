window.getRanking = async function() {
    try {
        const snapshot = await database.ref('users').orderByChild('wins').limitToLast(10).once('value');
        const users = [];
        
        snapshot.forEach(childSnapshot => {
            const userData = childSnapshot.val();
            users.push({
                id: childSnapshot.key,
                username: userData.username || userData.displayName || (userData.email ? userData.email.split('@')[0] : 'Jogador'),
                wins: userData.wins || 0,
                losses: userData.losses || 0,
                matches: userData.matches || 0
            });
        });
        
        return users.sort((a, b) => b.wins - a.wins);
    } catch (error) {
        console.error("Erro ao buscar ranking:", error);
        throw error;
    }
};

window.displayRanking = function(users) {
    const tbody = document.getElementById('ranking-data');
    if (!tbody) return;
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Nenhum dado de ranking disponível ainda.</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map((user, index) => `
        <tr>
            <td class="ranking-position">${index + 1}</td>
            <td class="ranking-name">${user.username}</td>
            <td class="ranking-stats">${user.wins}</td>
            <td class="ranking-stats">${user.losses}</td>
            <td class="ranking-stats">${user.matches}</td>
        </tr>
    `).join('');
};