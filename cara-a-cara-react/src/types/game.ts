// Tipos para os dados do Firebase e estado do jogo

export interface Player {
  uid: string;
  displayName: string;
  // Outras informações do jogador se necessário
}

export interface GameMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number; // ou firebase.database.ServerValue.TIMESTAMP
}

export interface DiceValues {
  owner?: number | null;
  visitor?: number | null;
  ownerReady?: boolean;
  visitorReady?: boolean;
}

export interface RoomData {
  roomId: string;
  owner: string; // UID do criador da sala
  players: { [uid: string]: Player | boolean }; // Pode ser Player ou apenas true se não precisar de mais dados aqui
  createdAt: number; // timestamp
  gameMode: 'classic' | 'senai'; // Para diferenciar os modos de jogo

  // Estado do jogo
  sortedCharacterOwner?: string | null; // Caminho da imagem ou ID do personagem
  sortedCharacterVisitor?: string | null;
  ownerCharacterReady?: boolean;
  visitorCharacterReady?: boolean;
  charactersSorted?: boolean; // Indica se ambos sortearam e o jogo pode começar com os dados

  diceValues?: DiceValues;
  diceResultsShown?: boolean;
  currentPlayer?: string | null; // UID do jogador da vez

  gameEnded?: boolean;
  winner?: string | null; // UID do vencedor
  loser?: string | null; // UID do perdedor
  endMessage?: string;

  messages?: { [messageId: string]: GameMessage }; // Chat da sala
  notifications?: { [notificationId: string]: any }; // Notificações específicas do jogo

  // Adicionar outros campos conforme necessário
  // Ex: currentQuestion (se houver perguntas), scores, etc.
}

// Para o contexto do jogo
export interface GameContextType {
  roomId: string | null;
  setRoomId: (id: string | null) => void;
  roomData: RoomData | null;
  isLoadingRoom: boolean;
  errorRoom: string | null;
  isRoomOwner: boolean | null;
  myCharacterPath: string | null;
  opponentCharacterPath: string | null; // Apenas para debug ou se precisar mostrar pro usuário o do oponente no final
  currentTurnPlayerId: string | null;
  wrongAttempts: number;
  // Adicionar mais estados conforme necessário (e.g., selectedCharacterForGuess)

  // Funções de ação (serão movidas para um hook useGameActions)
  // sortCharacter: () => Promise<void>;
  // rollDice: () => Promise<void>;
  // makeGuess: (guessedCharacterName: string) => Promise<void>;
  // sendMessage: (text: string) => Promise<void>;
  // eliminateCharacterToggle: (characterName: string) => void; // Para o tabuleiro do jogador
}

// Lista de personagens (pode ser movida para um arquivo de assets/constants)
// Caminhos atualizados para refletir a estrutura em public/assets/img/
export const CLASSIC_CHARACTERS = [
  "assets/img/personagem/Brett.jpg",
  "assets/img/personagem/Buddy.jpg",
  "assets/img/personagem/Butch.jpg",
  "assets/img/personagem/Captain Koons.jpg",
  "assets/img/personagem/Esmeralda.jpg",
  "assets/img/personagem/Fabienne.jpg",
  "assets/img/personagem/Jimmie.jpg",
  "assets/img/personagem/Jody.jpg",
  "assets/img/personagem/Jules.jpg",
  "assets/img/personagem/Lance.jpg",
  "assets/img/personagem/Marcellus.jpg",
  "assets/img/personagem/Marvin.jpg",
  "assets/img/personagem/Maynard.jpg",
  "assets/img/personagem/Mia.jpg",
  "assets/img/personagem/Paul.jpg",
  "assets/img/personagem/Raquel.jpg",
  "assets/img/personagem/Ringo.jpg",
  "assets/img/personagem/Roger.jpg",
  "assets/img/personagem/The Gimp.jpg",
  "assets/img/personagem/Trudi.jpg",
  "assets/img/personagem/Vincent.jpg",
  "assets/img/personagem/Winston.jpg",
  "assets/img/personagem/Yolanda.jpg",
  "assets/img/personagem/Zed.jpg",
];

export const SENAI_CHARACTERS = [
  "assets/img/personagemSenai/CARDOSO.jpg",
  "assets/img/personagemSenai/DAVI.jpg",
  "assets/img/personagemSenai/DAVIANE.jpg",
  "assets/img/personagemSenai/FELIPA.jpg",
  "assets/img/personagemSenai/FELIPE.jpg",
  "assets/img/personagemSenai/GABRIELLA.jpg",
  "assets/img/personagemSenai/RAFAEL.jpg",
  "assets/img/personagemSenai/RAFAELA.jpg",
];

export const DICE_FACES = [
  "assets/img/dado_faces/face_1.jpg",
  "assets/img/dado_faces/face_2.jpg",
  "assets/img/dado_faces/face_3.jpg",
  "assets/img/dado_faces/face_4.jpg",
  "assets/img/dado_faces/face_5.jpg",
  "assets/img/dado_faces/face_6.jpg",
];

// Função utilitária para extrair o nome do arquivo da imagem
export const getCharacterNameFromPath = (path: string): string => {
  return path.split('/').pop()?.replace('.jpg', '') || 'unknown';
};
