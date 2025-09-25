// js/ui-components.js
const SUIT_SYMBOLS = { 'Ouros': '♦', 'Espadas': '♠', 'Copas': '♥', 'Paus': '♣' };
const SUIT_COLORS = { 'Ouros': 'text-blue-400', 'Espadas': 'text-gray-300', 'Copas': 'text-red-500', 'Paus': 'text-yellow-400' };

function renderCard(card, isPlayable = false) {
    if (card.rank === '?') {
        // Renderiza o verso da carta
        return `<div class="w-16 h-24 bg-blue-800 border-2 border-blue-400 rounded-lg flex items-center justify-center"></div>`;
    }
    
    const suitSymbol = SUIT_SYMBOLS[card.suit] || '';
    const suitColor = SUIT_COLORS[card.suit] || 'text-white';
    const cardData = `data-rank="${card.rank}" data-suit="${card.suit}"`;

    let playableClass = '';
    if (isPlayable) {
        playableClass = 'cursor-pointer transform hover:-translate-y-4 transition-transform duration-200';
    }

    return `
        <div class="card ${playableClass} w-16 h-24 bg-gray-100 border-2 border-gray-300 rounded-lg shadow-lg text-black flex flex-col justify-between p-1" ${cardData}>
            <div class="text-left text-xl font-bold ${suitColor}">${card.rank}${suitSymbol}</div>
            <div class="text-center text-3xl font-bold ${suitColor}">${suitSymbol}</div>
            <div class="text-right text-xl font-bold ${suitColor} transform rotate-180">${card.rank}${suitSymbol}</div>
        </div>
    `;
}

function renderPlayerInfo(player, isCurrentPlayer) {
    const activeClass = isCurrentPlayer ? 'border-yellow-400 scale-105' : 'border-gray-500';
    return `
        <div class="player-info bg-gray-900 bg-opacity-70 p-2 rounded-lg shadow-lg border-2 ${activeClass} transition-all duration-300">
            <p class="font-bold truncate max-w-28">${player.username}</p>
            <p class="text-sm">Vidas: <span class="font-bold text-red-500">${'♥'.repeat(player.lives)}</span></p>
            <p class="text-sm">Palpite: <span class="font-bold text-yellow-300">${player.bet !== null ? player.bet : '?'}</span></p>
            <p class="text-sm">Ganhos: <span class="font-bold text-green-400">${player.tricksWon}</span></p>
        </div>
    `;
}