document.addEventListener("DOMContentLoaded", () => {
  const loginBox = document.getElementById("login-box");
  const registerBox = document.getElementById("register-box");
  const showRegister = document.getElementById("show-register");
  const showLogin = document.getElementById("show-login");

  showRegister?.addEventListener("click", (e) => {
    e.preventDefault();
    loginBox.style.display = "none";
    registerBox.style.display = "block";
  });

  showLogin?.addEventListener("click", (e) => {
    e.preventDefault();
    registerBox.style.display = "none";
    loginBox.style.display = "block";
  });

  document.getElementById("login-btn")?.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      await loginUser(email, password);
      const redirectUrl =
        sessionStorage.getItem("redirectAfterLogin") || "index.html";
      window.location.href = redirectUrl;
    } catch (error) {
      alert(`Erro no login: ${error.message}`);
    }
  });

  document
    .getElementById("register-btn")
    ?.addEventListener("click", async () => {
      const username = document
        .getElementById("register-username")
        .value.trim();
      const email = document.getElementById("register-email").value.trim();
      const password = document.getElementById("register-password").value;
      const confirm = document.getElementById("register-confirm").value;

      if (!username || !email || !password || !confirm) {
        alert("Preencha todos os campos!");
        return;
      }

      if (password !== confirm) {
        alert("As senhas não coincidem!");
        return;
      }

      if (password.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres!");
        return;
      }

      try {
        await registerUser(email, password, username);
        const redirectUrl =
          sessionStorage.getItem("redirectAfterLogin") || "index.html";
        window.location.href = redirectUrl;
      } catch (error) {
        let errorMessage = "Erro no cadastro: ";

        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage += "E-mail já está em uso";
            break;
          case "auth/invalid-email":
            errorMessage += "E-mail inválido";
            break;
          case "auth/weak-password":
            errorMessage += "Senha muito fraca";
            break;
          default:
            errorMessage += error.message;
        }

        alert(errorMessage);
      }
    });
});
