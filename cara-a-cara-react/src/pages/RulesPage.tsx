import React from 'react';

const RulesPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Como Jogar Cara a Cara</h2>

      <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>1. Preparação</h3>
      <p>
        Cada jogador escolhe um personagem secreto do tabuleiro. O objetivo é adivinhar o personagem do oponente fazendo perguntas sobre suas características.
      </p>

      <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>2. Rodadas</h3>
      <p>
        Os jogadores alternam turnos fazendo uma pergunta por vez que possa ser respondida com "sim" ou "não". Exemplo: "Seu personagem usa óculos?"
      </p>

      <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>3. Eliminação</h3>
      <p>
        Com base nas respostas, os jogadores devem eliminar personagens que não correspondam às características reveladas.
      </p>

      <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>4. Adivinhação</h3>
      <p>
        Quando um jogador acha que sabe qual é o personagem do oponente, pode tentar adivinhar em seu turno. Se errar, perde o jogo!
      </p>

      <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>5. Vitória</h3>
      <p>
        O primeiro jogador que adivinhar corretamente o personagem do oponente vence a partida!
      </p>
    </div>
  );
};

export default RulesPage;
