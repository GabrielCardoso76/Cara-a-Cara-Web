// Tipos para os dados do Firebase e estado do jogo

export interface Player {
  uid: string;
  displayName: string;
  // Outras informações do jogador se necessário
}

export interface GameMessage {
  id: string;
  text: string;
  senderUid: string; // Padronizado para senderUid conforme solicitado
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
  roomName?: string; // Adicionado roomName como opcional
  owner: string; // UID do criador da sala
  players: { [uid: string]: Player }; // Alterado de Player | boolean para Player
  createdAt: number;
  gameMode: 'classic' | 'senai';

  // Estado do jogo
  sortedCharacterOwner?: string | null;
  sortedCharacterVisitor?: string | null;
  ownerCharacterReady?: boolean;
  visitorCharacterReady?: boolean;
  charactersSorted?: boolean;

  diceValues?: DiceValues;
  diceResultsShown?: boolean;
  currentPlayer?: string | null;

  gameEnded?: boolean;
  winner?: string | null;
  loser?: string | null;
  endMessage?: string;

  messages?: { [messageId: string]: GameMessage };
  notifications?: { [notificationId: string]: any };
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
  opponentCharacterPath: string | null;
  currentTurnPlayerId: string | null;
  wrongAttempts: number;
}

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

export const getCharacterNameFromPath = (path: string): string => {
  return path.split('/').pop()?.replace('.jpg', '') || 'unknown';
};
