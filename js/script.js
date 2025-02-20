const imagens = [
  './img/personagem/Brett.jpg',
  './img/personagem/Buddy.jpg',
  './img/personagem/Butch.jpg',
  './img/personagem/Captain Koons.jpg',
  './img/personagem/Esmeralda.jpg',
  './img/personagem/Fabienne.jpg',
  './img/personagem/Jimmie.jpg',
  './img/personagem/Jody.jpg',
  './img/personagem/Jules.jpg',
  './img/personagem/Lance.jpg',
  './img/personagem/Marcellus.jpg',
  './img/personagem/Marvin.jpg',
  './img/personagem/Maynard.jpg',
  './img/personagem/Mia.jpg',
  './img/personagem/Paul.jpg',
  './img/personagem/Raquel.jpg',
  './img/personagem/Ringo.jpg',
  './img/personagem/Roger.jpg',
  './img/personagem/The Gimp.jpg',
  './img/personagem/Trudi.jpg',
  './img/personagem/Vincent.jpg',
  './img/personagem/Winston.jpg',
  './img/personagem/Yolanda.jpg',
  './img/personagem/Zed.jpg',
];

function sortearImagem() {
  // Escolhe uma imagem aleatória do array
  const index = Math.floor(Math.random() * imagens.length);
  const imagemSorteada = imagens[index];

  // Atualiza o src da imagem e exibe
  const imgElement = document.getElementById('imagem');
  imgElement.src = imagemSorteada;
  imgElement.style.display;
}

// Array com as imagens das faces do dado
const imagem2 = [
  './img/dado_faces/face_1.jpg',
  './img/dado_faces/face_2.jpg',
  './img/dado_faces/face_3.jpg',
  './img/dado_faces/face_4.jpg',
  './img/dado_faces/face_5.jpg',
  './img/dado_faces/face_6.jpg',
];

// Função para sortear uma imagem do dado
function sortearImagemDado() {
  // Escolhe uma imagem aleatória do array
  const index = Math.floor(Math.random() * imagem2.length);
  const imagemSorteada = imagem2[index];

  // Atualiza o src da imagem e exibe
  const imgElement = document.getElementById('imagem2');
  imgElement.src = imagemSorteada;
  imgElement.style.display = 'block'; // Torna a imagem visível
}

document.addEventListener('DOMContentLoaded', function () {
  // Seleciona todas as imagens dentro da div "personagens"
  const imagens = document.querySelectorAll('.personagens img');

  imagens.forEach((img) => {
    img.addEventListener('click', function () {
      // Alterna a classe "pb" ao clicar na imagem
      this.classList.toggle('pb');
    });
  });
});
