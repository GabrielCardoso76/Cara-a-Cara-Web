// Listas de imagens
const imagensPersonagens = [
    'img/personagem/Brett.jpg',
    'img/personagem/Buddy.jpg',
    'img/personagem/Butch.jpg',
    'img/personagem/Captain Koons.jpg',
    'img/personagem/Esmeralda.jpg',
    'img/personagem/Fabienne.jpg',
    'img/personagem/Jimmie.jpg',
    'img/personagem/Jody.jpg',
    'img/personagem/Jules.jpg',
    'img/personagem/Lance.jpg',
    'img/personagem/Marcellus.jpg',
    'img/personagem/Marvin.jpg',
    'img/personagem/Maynard.jpg',
    'img/personagem/Mia.jpg',
    'img/personagem/Paul.jpg',
    'img/personagem/Raquel.jpg',
    'img/personagem/Ringo.jpg',
    'img/personagem/Roger.jpg',
    'img/personagem/The Gimp.jpg',
    'img/personagem/Trudi.jpg',
    'img/personagem/Vincent.jpg',
    'img/personagem/Winston.jpg',
    'img/personagem/Yolanda.jpg',
    'img/personagem/Zed.jpg'
];

const imagensDado = [
    'img/dado_faces/face_1.jpg',
    'img/dado_faces/face_2.jpg',
    'img/dado_faces/face_3.jpg',
    'img/dado_faces/face_4.jpg',
    'img/dado_faces/face_5.jpg',
    'img/dado_faces/face_6.jpg'
];

// Variáveis de estado do jogo
let chatMessages = {};
let isInitialChatLoad = true;
let roomListener = null;
let messagesListener = null;
let roomId = null;
let currentUser = null;
let isRoomOwner = false;
let players = {};
let myCharacter = null;
let myDice = null;
let opponentCharacter = null;
let gameStarted = false;
let wrongAttempts = 0;
const MAX_WRONG_ATTEMPTS = 5;
let notificationsListener = null;

function setCurrentUser(user) {
    currentUser = user;
    if (user) {
        console.log("Usuário definido:", user.uid, user.email);
    } else {
        console.log("Usuário deslogado");
    }
}