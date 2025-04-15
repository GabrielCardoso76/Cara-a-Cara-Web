function applyThemeSettings() {
    const savedTheme = localStorage.getItem('theme') || 'valorant';
    const savedColor = localStorage.getItem('accentColor') || '#ff4655';
    
    document.body.className = `${savedTheme}-theme`;
    document.documentElement.style.setProperty('--valorant-red', savedColor);
    document.documentElement.style.setProperty('--valorant-red-hover', lightenColor(savedColor, 20));
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
    
    return `#${(
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)}`;
}

document.addEventListener('DOMContentLoaded', applyThemeSettings);