import React from 'react';
import CharacterCard from './CharacterCard';
import './CharacterBoard.css'; // Estilos para o board

interface CharacterBoardProps {
  characterImagePaths: string[]; // Array com os caminhos das imagens dos personagens
  eliminatedCharacters: { [imagePath: string]: boolean }; // Objeto para marcar personagens eliminados
  onToggleEliminate: (imagePath: string) => void; // Função para lidar com o clique no card
  baseAssetPath?: string; // Passado para CharacterCard
}

const CharacterBoard: React.FC<CharacterBoardProps> = ({
  characterImagePaths,
  eliminatedCharacters,
  onToggleEliminate,
  baseAssetPath,
}) => {
  if (!characterImagePaths || characterImagePaths.length === 0) {
    return <p>Nenhum personagem para exibir.</p>;
  }

  return (
    <div className="character-board">
      {characterImagePaths.map((path) => (
        <CharacterCard
          key={path} // Usar o path como chave, idealmente seria um ID único do personagem
          imagePath={path}
          isEliminated={!!eliminatedCharacters[path]}
          onClick={() => onToggleEliminate(path)}
          baseAssetPath={baseAssetPath}
        />
      ))}
    </div>
  );
};

export default CharacterBoard;
