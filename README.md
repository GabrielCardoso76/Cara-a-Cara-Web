# 🎭 Cara a Cara  

[![GitHub Pages](https://img.shields.io/badge/Play%20Now-GitHub%20Pages-brightgreen)](https://gabrielcardoso76.github.io/Cara-a-Cara-Web/)  
[![Firebase](https://img.shields.io/badge/Powered%20by-Firebase-FFCA28)](https://firebase.google.com/)  
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)  

Um jogo web multiplayer de perguntas e respostas, desenvolvido com **HTML, CSS e JavaScript**, utilizando **Firebase** para autenticação, banco de dados em tempo real e gerenciamento de salas.  

➡️ **Jogue agora:** [https://gabrielcardoso76.github.io/Cara-a-Cara-Web/](https://gabrielcardoso76.github.io/Cara-a-Cara-Web/)  

---

## 🎮 Como Jogar  
- **Modo multiplayer**: Crie ou entre em uma sala para desafiar outro jogador.  
- **Sistema de perguntas**: Responda corretamente para acumular pontos.  
- **Chat integrado**: Interaja com seu oponente durante a partida.  
- **Ranking global**: Veja seu desempenho no placar de melhores jogadores.  

---

## 🛠️ Tecnologias Utilizadas  
### Frontend  
- **HTML5** (Estrutura das páginas: `cara1.html`, `login.html`, `ranking.html`, etc.)  
- **CSS3** (Estilos: `auth.css`, `cara1.css`, `ranking.css`, etc.)  
- **JavaScript Vanilla** (Lógica do jogo e integração com Firebase)  

### Backend (Firebase)  
- **Firebase Authentication** (Login e cadastro de usuários)  
- **Firestore Database** (Armazenamento de salas e histórico de partidas)  
- **Realtime Database** (Sincronização de jogadas e chat)  

### Estrutura de Pastas  
📁 css/
├── auth.css # Estilos da autenticação
├── cara1.css # Estilos do jogo principal
├── configuracoes.css # Estilos da página de configurações
└── ranking.css # Estilos do ranking
📁 js/
├── auth-system.js # Lógica de autenticação
├── firebase-config.js # Configuração do Firebase
├── game-logic.js # Regras do jogo
├── room-management.js # Gerenciamento de salas
└── ranking.js # Lógica do placar
📄 *.html # Páginas do jogo

---

## ⚙️ Configuração Local  
1. **Clone o repositório**:  
   ```bash
   git clone https://github.com/GabrielCardoso76/Cara-a-Cara-Web.git
Configure o Firebase:

Crie um projeto no Firebase Console.

Substitua as credenciais em js/firebase-config.js.

Abra o jogo:

Execute index.html em um navegador moderno.

📌 Funcionalidades
✔️ Autenticação de usuários (login/cadastro)

✔️ Criação e entrada em salas multiplayer

✔️ Chat em tempo real durante as partidas

✔️ Sistema de ranking com Firestore

✔️ Páginas responsivas (configurações, regras, etc.)

🚀 Próximas Atualizações
Adicionar mais categorias de perguntas

Implementar modo single-player contra IA

Notificações em tempo real para convites

🤝 Contribuição
Contribuições são bem-vindas! Siga os passos:

Faça um fork do projeto.

Crie uma branch: git checkout -b minha-feature.

Commit suas mudanças: git commit -m 'Adiciona recurso X'.

Envie para o repositório: git push origin minha-feature.

Abra um Pull Request.

📜 Licença
Este projeto está sob a licença MIT. Consulte o arquivo LICENSE para detalhes.

Desenvolvido com ❤️ por Gabriel Cardoso Torres

---

### ✨ Destaques:  
- **Badges personalizadas** (GitHub Pages, Firebase, MIT).  
- **Link do jogo** em destaque no topo.  
- **Estrutura de pastas** detalhada para facilitar contribuições.  
- **Seção de roadmap** para suas futuras atualizações.  

Basta copiar esse código para um arquivo `README.md` no seu repositório! Se quiser ajustar algo (como adicionar mais detalhes sobre as regras do jogo ou tecnologias), é só me avisar. 😊