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
    await user.updateProfile({ displayName: newUsername });
    await firebase.database().ref(`users/${user.uid}`).update({
      username: newUsername,
      displayName: newUsername
    });
    document.querySelectorAll(".user-greeting").forEach((el) => {
      el.textContent = `Olá, ${newUsername}`;
    });
    alert("Nome alterado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    alert(`Erro: ${error.message}`);
  }
}

function setupThemeSwitcher() {
  const savedTheme = localStorage.getItem('theme') || 'valorant';
  document.querySelectorAll('.theme-option').forEach(option => {
    if (option.dataset.theme === savedTheme) option.classList.add('active');
    
    option.addEventListener('click', () => {
      document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      localStorage.setItem('theme', option.dataset.theme);
      document.body.className = `${option.dataset.theme}-theme`;
    });
  });
}

function setupColorPicker() {
  const colorPicker = document.getElementById('accent-color');
  const savedColor = localStorage.getItem('accentColor') || '#ff4655';
  colorPicker.value = savedColor;
  document.documentElement.style.setProperty('--valorant-red', savedColor);
  
  colorPicker.addEventListener('input', (e) => {
    const newColor = e.target.value;
    document.documentElement.style.setProperty('--valorant-red', newColor);
    document.documentElement.style.setProperty('--valorant-red-hover', lightenColor(newColor, 20));
  });

  document.getElementById('apply-color').addEventListener('click', () => {
    localStorage.setItem('accentColor', colorPicker.value);
    alert('Cor aplicada com sucesso!');
  });
}

function resetToDefault() {
  if (confirm('Deseja restaurar as cores padrão?')) {
    localStorage.removeItem('theme');
    localStorage.removeItem('accentColor');
    
    document.querySelector('.theme-option[data-theme="valorant"]').classList.add('active');
    document.querySelectorAll('.theme-option:not([data-theme="valorant"])').forEach(opt => opt.classList.remove('active'));
    
    const defaultColor = '#ff4655';
    document.getElementById('accent-color').value = defaultColor;
    document.documentElement.style.setProperty('--valorant-red', defaultColor);
    document.documentElement.style.setProperty('--valorant-red-hover', lightenColor(defaultColor, 20));
    document.body.className = 'valorant-theme';
    
    alert('Cores padrão restauradas!');
  }
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)}`;
}

function initSettings() {
  const user = firebase.auth().currentUser;
  if (user && document.getElementById('username')) {
    document.getElementById('username').value = user.displayName || '';
  }
  
  setupThemeSwitcher();
  setupColorPicker();

  document.getElementById('change-username')?.addEventListener('click', updateUsername);
  document.getElementById('reset-colors')?.addEventListener('click', resetToDefault);
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('configuracoes.html')) {
    initSettings();
  }
});