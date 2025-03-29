window.getRanking = async function(limit = 50) {  // Agora aceita um parâmetro de limite
    try {
        const snapshot = await database.ref('users').orderByChild('wins').limitToLast(limit).once('value');
        const users = [];
        
        snapshot.forEach(childSnapshot => {
            const userData = childSnapshot.val();
            const wins = userData.wins || 0;
            const losses = userData.losses || 0;
            const matches = userData.matches || 0;
            const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
            
            users.push({
                id: childSnapshot.key,
                username: userData.username || userData.displayName || (userData.email ? userData.email.split('@')[0] : 'Jogador'),
                wins: wins,
                losses: losses,
                matches: matches,
                winRate: winRate
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
        tbody.innerHTML = '<tr><td colspan="6">Nenhum dado de ranking disponível ainda.</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map((user, index) => {
        // Classes para os primeiros lugares
        let positionClass = '';
        if (index === 0) positionClass = 'gold';
        else if (index === 1) positionClass = 'silver';
        else if (index === 2) positionClass = 'bronze';
        
        return `
        <tr>
            <td class="ranking-position ${positionClass}">${index + 1}</td>
            <td class="ranking-name">${user.username}</td>
            <td class="ranking-stats">${user.wins}</td>
            <td class="ranking-stats">${user.losses}</td>
            <td class="ranking-stats">${user.matches}</td>
            <td class="ranking-stats win-rate">${user.winRate}%</td>
        </tr>
        `;
    }).join('');
};