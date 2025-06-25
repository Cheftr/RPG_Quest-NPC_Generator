function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark-mode') {
    document.body.classList.add('dark-mode');
  }
}

function setupThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark-mode' : 'light');
  });
}

window.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  setupThemeToggle();
});
