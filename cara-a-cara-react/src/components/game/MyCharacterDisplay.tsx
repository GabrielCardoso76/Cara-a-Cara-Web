import React from 'react';
import { getCharacterNameFromPath } from '../../types/game'; // Ajuste o caminho se necessário
import './MyCharacterDisplay.css'; // Estilos para este componente

interface MyCharacterDisplayProps {
  characterImagePath: string | null; // Caminho para a imagem do personagem ou null se não sorteado
  label: string; // Ex: "Seu Personagem Sorteado" ou "Personagem do Oponente"
  baseAssetPath?: string;
}

const MyCharacterDisplay: React.FC<MyCharacterDisplayProps> = ({
  characterImagePath,
  label,
  baseAssetPath = '/assets/', // Similar ao CharacterCard
}) => {
  if (!characterImagePath) {
    return (
      <div className="my-character-display placeholder">
        <div className="label">{label}</div>
        <div className="character-name-display">Aguardando sorteio...</div>
      </div>
    );
  }

  const characterName = getCharacterNameFromPath(characterImagePath);
  // Mesma lógica de caminho de imagem que CharacterCard
  const fullImagePath = characterImagePath.startsWith('http')
    ? characterImagePath
    : `${process.env.PUBLIC_URL}/${characterImagePath}`;

  return (
    <div className="my-character-display">
      <div className="label">{label}</div>
      <img
        src={fullImagePath}
        alt={`Personagem: ${characterName}`}
        className="my-character-image"
      />
      <div className="character-name-display">{characterName}</div>
    </div>
  );
};

export default MyCharacterDisplay;
