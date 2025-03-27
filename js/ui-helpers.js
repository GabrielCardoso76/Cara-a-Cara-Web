function updateOpponentSelect() {
    const select = document.getElementById('guess-character');
    select.innerHTML = '<option value="">Selecione um personagem</option>';
    
    imagensPersonagens.forEach(personagem => {
        const option = document.createElement('option');
        const characterName = personagem.split('/').pop().replace('.jpg', '');
        option.value = characterName;
        option.textContent = characterName;
        select.appendChild(option);
    });
}

function showCharacterImage(character) {
    const imgElement = document.getElementById('imagem');
    imgElement.src = character;
    imgElement.style.display = 'block';
}

function showDiceImage(dice) {
    const imgElement = document.getElementById('imagem2');
    if (imgElement) {
        imgElement.src = dice;
        imgElement.style.display = 'block';
    }
}

function updateWrongAttemptsUI() {
    const attemptsElement = document.getElementById('wrong-attempts');
    if (attemptsElement) {
        attemptsElement.textContent = `Tentativas erradas: ${wrongAttempts}/${MAX_WRONG_ATTEMPTS}`;
    }
}