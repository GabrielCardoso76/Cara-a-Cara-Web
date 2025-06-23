import React from 'react';
import './DiceDisplay.css'; // Estilos para este componente
// Supondo que DICE_FACES foi movido ou será acessado de forma diferente.
// Por agora, vamos assumir que o caminho da imagem do dado é passado como prop.

interface DiceDisplayProps {
  diceImagePath: string | null; // Caminho para a imagem da face do dado, ou null
  onRollDice?: () => void; // Função para sortear o dado, se o botão estiver aqui
  rolling?: boolean; // Para feedback visual se estiver sorteando
  label?: string;
  baseAssetPath?: string;
}

const DiceDisplay: React.FC<DiceDisplayProps> = ({
  diceImagePath,
  onRollDice,
  rolling = false,
  label = "Dado",
  baseAssetPath = '/assets/', // Este não é mais usado se os caminhos em DICE_FACES já são completos a partir de public
}) => {
  // A imagem padrão também deve seguir a nova estrutura de assets
  const defaultDiceImage = `${process.env.PUBLIC_URL}/assets/img/dado_sorteio.jpg`;

  const displayImage = diceImagePath
    ? (diceImagePath.startsWith('http') ? diceImagePath : `${process.env.PUBLIC_URL}/${diceImagePath}`)
    : defaultDiceImage;

  const diceValue = diceImagePath ? parseInt(diceImagePath.match(/face_(\d)\.jpg$/)?.[1] || '0') : null;

  return (
    <div className={`dice-display ${rolling ? 'rolling' : ''}`}>
      {label && <div className="dice-label">{label}</div>}
      <img
        src={displayImage}
        alt={diceValue ? `Face ${diceValue} do dado` : "Dado pronto para sortear"}
        className="dice-image"
        onClick={!rolling && onRollDice ? onRollDice : undefined} // Permite clicar na imagem para sortear se onRollDice for fornecido
      />
      {diceValue && <div className="dice-value-text">Valor: {diceValue}</div>}
      {onRollDice && (
        <button
          onClick={onRollDice}
          disabled={rolling}
          className="roll-dice-button"
        >
          {rolling ? 'Sorteando...' : 'Sortear Dado'}
        </button>
      )}
    </div>
  );
};

export default DiceDisplay;
