import React from 'react';
import { getCharacterNameFromPath } from '../../types/game'; // Ajuste o caminho se necessário
import './CharacterCard.css'; // Estilos para o card

interface CharacterCardProps {
  imagePath: string; // Caminho para a imagem do personagem (ex: "img/personagem/Jules.jpg")
  isEliminated: boolean;
  onClick: () => void;
  baseAssetPath?: string; // Opcional: para construir o caminho completo da imagem
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  imagePath,
  isEliminated,
  onClick,
  baseAssetPath = '/assets/', // Caminho base onde as imagens estarão em 'public' ou servidas
}) => {
  const characterName = getCharacterNameFromPath(imagePath);

  // Constrói o caminho completo da imagem.
  // Supõe que as imagens originais de "img/personagem/*" serão copiadas para "public/assets/img/personagem/*"
  // ou que o `baseAssetPath` e `imagePath` juntos formem o caminho correto.
  // Por enquanto, vamos assumir que imagePath já é o caminho correto a partir da pasta public.
  // Ex: se imagePath = "img/personagem/Jules.jpg", ele buscará "public/img/personagem/Jules.jpg"
  // Se as imagens forem movidas para src/assets e importadas, esta lógica mudará.
  const fullImagePath = imagePath.startsWith('http') ? imagePath : `${process.env.PUBLIC_URL}/${imagePath}`;


  return (
    <div
      className={`character-card ${isEliminated ? 'eliminated' : ''}`}
      onClick={onClick}
      title={characterName}
    >
      <img
        src={fullImagePath}
        alt={characterName}
        className="character-image"
      />
      <div className="character-name">{characterName}</div>
    </div>
  );
};

export default CharacterCard;
