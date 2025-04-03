window.sortearDado =
  window.sortearDado ||
  function () {
    console.error("sortearDado() não carregada - recarregando...");
    setTimeout(() => window.location.reload(), 1000);
    return false;
  };

window.sortearPersonagem =
  window.sortearPersonagem ||
  function () {
    alert("Função ainda não carregada. Recarregando...");
    window.location.reload();
  };

if (typeof firebase === "undefined") {
  console.error("Firebase não foi carregado corretamente!");
  alert("Erro ao carregar o sistema. Por favor, recarregue a página.");
} else {
  console.log("Firebase carregado com sucesso:", firebase);
}

function updateLoginUI(user) {
  const loggedUserDiv = document.getElementById("logged-user");
  const loginLink = document.getElementById("login-link");
  const userGreeting = document.getElementById("user-greeting");
  const logoutBtn = document.getElementById("logout-button");
  const loginContainer = document.querySelector(".login-container");

  if (user) {
    if (loggedUserDiv) {
      loggedUserDiv.querySelector("#username").textContent =
        user.displayName || user.email;
      loggedUserDiv.style.display = "flex";
    }
    if (loginContainer) loginContainer.style.display = "none";
    if (loginLink) loginLink.style.display = "none";
    if (userGreeting) {
      userGreeting.textContent = `Bem-vindo, ${user.displayName || user.email}`;
      userGreeting.style.display = "inline";
    }
    if (logoutBtn) logoutBtn.style.display = "inline";
  } else {
    if (loggedUserDiv) loggedUserDiv.style.display = "none";
    if (loginContainer) loginContainer.style.display = "block";
    if (loginLink) loginLink.style.display = "inline";
    if (userGreeting) userGreeting.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

function setupEventListeners() {
  try {
    const setupButtonListener = (id, handler) => {
      const btn = document.getElementById(id);
      if (btn) {
        if (typeof handler === "function") {
          btn.addEventListener("click", handler);
        } else {
          console.error(`Função ${handler} não definida para o botão ${id}`);
        }
      }
    };

    setupButtonListener("create-room", window.createRoom);
    setupButtonListener("join-room", window.joinRoom);
    setupButtonListener("sortear-imagem", window.sortearPersonagem);
    setupButtonListener("sortear-dado", window.sortearDado);
    setupButtonListener("guess-button", window.checkGuess);
    setupButtonListener("send-message", window.sendMessage);

    document
      .getElementById("chat-input")
      ?.addEventListener("keypress", function (e) {
        if (e.key === "Enter") window.sendMessage();
      });

    document.querySelectorAll(".personagens img")?.forEach((img) => {
      img.addEventListener("click", function () {
        this.classList.toggle("pb");
      });
    });

    console.log("Event listeners configurados com sucesso");
  } catch (error) {
    console.error("Erro ao configurar event listeners:", error);
  }
}

async function handleLogout() {
  try {
    await auth.signOut();
    window.location.href = "login.html";
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    alert("Erro ao sair da conta. Por favor, tente novamente.");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM completamente carregado");

  auth.onAuthStateChanged((user) => {
    console.log("Estado de autenticação alterado:", user);
    //new
    if (user) {
      if (window.SettingsUI) {
        SettingsUI.init();
      }
    }
    if (!user) {
      if (!window.location.pathname.includes("login.html")) {
        console.log("Usuário não autenticado, redirecionando...");
        window.location.href = "login.html";
      }
      return;
    }

    window.currentUser = user;
    updateLoginUI(user);
    setupEventListeners();
  });

  const loginLink = document.getElementById("login-link");
  const logoutBtn = document.getElementById("logout-button");

  if (loginLink) {
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "login.html";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  if (typeof auth === "undefined") {
    console.error("Objeto auth não definido! Verifique firebase-config.js");
    alert("Erro no sistema de autenticação. Recarregue a página.");
  }
  const menuToggle = document.getElementById("menu-toggle");
  const navButtons = document.querySelector(".nav-buttons");

  menuToggle.addEventListener("click", function () {
    navButtons.classList.toggle("show"); // Adiciona ou remove a classe "show"
  });
});

window.addEventListener("error", function (error) {
  console.error("Erro global capturado:", error);
});

if (typeof exports !== "undefined") {
  exports.updateLoginUI = updateLoginUI;
  exports.setupEventListeners = setupEventListeners;
  exports.handleLogout = handleLogout;
}
