document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menu-toggle");
  const globalChatContainer = document.getElementById("global-chat-container");
  const globalChatMessages = document.getElementById("global-chat-messages");
  const globalChatInput = document.getElementById("global-chat-input");
  const globalSendMessage = document.getElementById("global-send-message");

  let chatAberto = false;
  const userNamesCache =
    JSON.parse(localStorage.getItem("userNamesCache")) || {};

  if (!menuToggle) {
    console.error("Botão hambúrguer não encontrado no DOM!");
    return;
  }

  menuToggle.style.display = "flex";

  menuToggle.addEventListener("click", function () {
    chatAberto = !chatAberto;
    globalChatContainer.classList.toggle("open", chatAberto);
    menuToggle.classList.toggle("open", chatAberto);
    if (chatAberto) globalChatInput.focus();
  });

  document.addEventListener("click", function (e) {
    if (
      chatAberto &&
      !globalChatContainer.contains(e.target) &&
      e.target !== menuToggle
    ) {
      globalChatContainer.classList.remove("open");
      menuToggle.classList.remove("open");
      chatAberto = false;
    }
  });

  const chatHeader = document.querySelector(".chat-header h3");
  if (chatHeader) {
    chatHeader.addEventListener("click", function () {
      globalChatContainer.classList.remove("open");
      menuToggle.classList.remove("open");
      chatAberto = false;
    });
  }

  async function sendGlobalMessage() {
    const message = globalChatInput.value.trim();
    if (!message || !window.currentUser) return;

    try {
      const name = await getDisplayName(window.currentUser.uid);
      await firebase.database().ref("global-chat").push().set({
        senderUid: window.currentUser.uid,
        senderName: name,
        text: message,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      });
      globalChatInput.value = "";
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  }

  if (globalSendMessage) {
    globalSendMessage.addEventListener("click", sendGlobalMessage);
  }

  if (globalChatInput) {
    globalChatInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") sendGlobalMessage();
    });
  }

  async function getDisplayName(uid) {
    if (!uid) return "Anônimo";
    if (userNamesCache[uid]) return userNamesCache[uid];

    try {
      const snapshot = await firebase
        .database()
        .ref(`users/${uid}`)
        .once("value");
      if (!snapshot.exists()) return `Jogador_${uid.substring(0, 4)}`;

      const userData = snapshot.val();
      const name =
        userData?.displayName ||
        userData?.email?.split("@")[0] ||
        `Jogador_${uid.substring(0, 4)}`;
      userNamesCache[uid] = name;
      localStorage.setItem("userNamesCache", JSON.stringify(userNamesCache));
      return name;
    } catch (error) {
      console.error("Erro ao buscar nome:", error);
      return `Jogador_${uid.substring(0, 4)}`;
    }
  }

  function loadGlobalMessages() {
    firebase
      .database()
      .ref("global-chat")
      .orderByChild("timestamp")
      .limitToLast(50)
      .on("value", async (snapshot) => {
        const messages = snapshot.val() || {};
        globalChatMessages.innerHTML = "";

        const messagesArray = Object.entries(messages)
          .map(([id, msg]) => ({ id, ...msg }))
          .sort((a, b) => a.timestamp - b.timestamp);

        for (const msg of messagesArray) {
          const messageElement = document.createElement("div");
          messageElement.className = "message";
          messageElement.innerHTML = `
              <div class="message-header">
                <span class="message-user">${
                  msg.senderName || (await getDisplayName(msg.senderUid))
                }</span>
                <span class="message-time">${formatTime(msg.timestamp)}</span>
              </div>
              <div class="message-text">${msg.text}</div>
            `;
          globalChatMessages.appendChild(messageElement);
        }
        globalChatMessages.scrollTop = globalChatMessages.scrollHeight;
      });
  }

  function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (window.firebase) {
    loadGlobalMessages();

    firebase.auth().onAuthStateChanged(function (user) {
      window.currentUser = user || window.currentUser;
      if (!user) {
        globalChatContainer.classList.remove("open");
        menuToggle.classList.remove("open");
        chatAberto = false;
      }
    });
  }
});
