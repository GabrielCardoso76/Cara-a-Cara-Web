// settings-ui.js - Versão simplificada e funcional

// Função principal para atualizar o nome
async function updateUsername() {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Você precisa estar logado!");
    window.location.href = "login.html";
    return;
  }

  const newUsername = document.getElementById("username").value.trim();

  if (!newUsername || newUsername.length < 3) {
    alert("Digite um nome válido (mínimo 3 caracteres)");
    return;
  }

  try {
    // 1. Atualiza no Authentication
    await user.updateProfile({ displayName: newUsername });

    // 2. Atualiza no Realtime Database
    await firebase.database().ref(`users/${user.uid}`).update({
      username: newUsername,
      displayName: newUsername,
    });

    // 3. Atualiza a UI
    document.querySelectorAll(".user-greeting").forEach((el) => {
      el.textContent = `Olá, ${newUsername}`;
    });

    alert("Nome alterado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    alert(`Erro: ${error.message}`);
  }
}

// Configuração inicial quando a página carrega
document.addEventListener("DOMContentLoaded", () => {
  // Verifica se estamos na página correta
  if (!window.location.pathname.includes("configuracoes.html")) return;

  // Carrega o nome atual do usuário
  const user = firebase.auth().currentUser;
  if (user && document.getElementById("username")) {
    document.getElementById("username").value = user.displayName || "";
  }

  // Configura o evento do botão
  const changeBtn = document.getElementById("change-username");
  if (changeBtn) {
    changeBtn.addEventListener("click", updateUsername);
  } else {
    console.error("Botão de alterar nome não encontrado!");
  }
});
