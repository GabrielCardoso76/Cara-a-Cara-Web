const userNamesCache = JSON.parse(localStorage.getItem("userNamesCache")) || {};

async function getDisplayName(uid) {
  if (!uid) return "Anônimo";

  // Verifica cache primeiro
  if (userNamesCache[uid]) return userNamesCache[uid];

  try {
    // Tenta buscar do banco de dados
    const snapshot = await database.ref(`users/${uid}`).once("value");
    if (!snapshot.exists()) return `Jogador_${uid.substring(0, 4)}`;

    const userData = snapshot.val();
    const name =
      userData?.username ||
      userData?.displayName ||
      userData?.email?.split("@")[0] ||
      `Jogador_${uid.substring(0, 4)}`;

    // Atualiza cache
    updateCache(uid, name);
    return name;
  } catch (error) {
    console.error("Erro ao buscar nome:", error);
    return `Jogador_${uid.substring(0, 4)}`;
  }
}

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();

  if (message && currentUser?.uid && roomId) {
    // Primeiro obtém o nome do usuário
    const name = await getDisplayName(currentUser.uid);

    // Depois envia a mensagem completa de uma vez
    await database.ref(`rooms/${roomId}/messages`).push().set({
      senderUid: currentUser.uid,
      senderName: name, // Já envia com o nome
      text: message,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    });

    input.value = "";
  }
}

function loadInitialMessages(messages) {
  Object.keys(messages).forEach((messageId) => {
    if (!chatMessages[messageId]) {
      chatMessages[messageId] = true;
      const msg = messages[messageId];

      // Mostra "Carregando..." apenas se tiver UID mas não nome
      // Modifique o loadInitialMessages
      const name =
        msg.senderName ||
        (msg.senderUid
          ? '<span class="loading-name">Carregando...</span>'
          : "Anônimo");

      const msgElement = document.createElement("div");
      msgElement.dataset.messageId = messageId;
      msgElement.innerHTML = `<strong>${name}:</strong> ${msg.text}`;
      document.getElementById("chat-messages").appendChild(msgElement);

      // Atualiza se ainda estiver carregando
      if (name === "Carregando..." && msg.senderUid) {
        getDisplayName(msg.senderUid).then((name) => {
          msgElement.innerHTML = `<strong>${name}:</strong> ${msg.text}`;
          // Atualiza no banco para futuras cargas
          database
            .ref(`rooms/${roomId}/messages/${messageId}/senderName`)
            .set(name);
        });
      }
    }
  });
  document.getElementById("chat-messages").scrollTop =
    document.getElementById("chat-messages").scrollHeight;
}
function updateCache(uid, name) {
  userNamesCache[uid] = name;
  localStorage.setItem("userNamesCache", JSON.stringify(userNamesCache));
}
