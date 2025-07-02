/**
 * js/modules/theme.js
 *
 * Handles the light/dark theme toggle functionality by saving the
 * user's preference to localStorage.
 */

const themeToggle = document.getElementById('theme-toggle');

/**
 * Applies the saved theme from localStorage.
 * Defaults to the system's preferred color scheme if no setting is saved.
 */
function applyInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    // If a theme is saved, apply it
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
    }
    // If no theme is saved, the default light theme from the CSS will be used.
}

/**
 * Toggles the theme, and saves the new preference to localStorage.
 */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    // Determine the new theme and save it
    let newTheme = 'light';
    if (document.body.classList.contains('dark-mode')) {
        newTheme = 'dark';
    }
    localStorage.setItem('theme', newTheme);
}

/**
 * Initializes the theme switcher by applying the initial theme
 * and adding the click event listener.
 */
export function initTheme() {
    if (!themeToggle) {
        console.warn('Theme toggle button not found.');
        return;
    }

    applyInitialTheme();
    themeToggle.addEventListener('click', toggleTheme);
}
