/**
 * js/modules/theme-selector.js
 *
 * Handles the generator theme selection (e.g., Fantasy, Sci-Fi),
 * saves the choice to localStorage, and applies it to the body
 * for site-wide styling.
 */
import { createElementWithAttrs } from './utils.js';

const THEME_STORAGE_KEY = 'generatorTheme';
let themeData = null;
let currentTheme = 'fantasy'; // Default theme

const themeSelect = document.getElementById('themeSelect');

/**
 * Applies the saved theme to the body element for CSS styling.
 * @param {string} theme - The theme to apply (e.g., 'fantasy').
 */
function applyThemeToBody(theme) {
    document.body.dataset.theme = theme;
}

/**
 * Handles changes in the theme dropdown, saving the new theme
 * and applying it.
 * @param {Event} event - The change event from the select dropdown.
 */
function handleThemeChange(event) {
    const newTheme = event.target.value;
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    currentTheme = newTheme;
    applyThemeToBody(newTheme);

    // Dispatch a custom event to notify other modules of the theme change
    document.body.dispatchEvent(new CustomEvent('generatorThemeChanged', {
        detail: { theme: newTheme }
    }));
}

/**
 * Populates the theme dropdown from the loaded data.
 */
function populateThemeDropdown() {
    if (!themeData || !themeSelect) return;

    const themes = Object.keys(themeData);
    themeSelect.innerHTML = ''; // Clear existing options

    themes.forEach(theme => {
        const option = createElementWithAttrs('option', { value: theme }, theme.charAt(0).toUpperCase() + theme.slice(1));
        themeSelect.appendChild(option);
    });

    themeSelect.value = currentTheme; // Set dropdown to the current theme
}

/**
 * Initializes the Theme Selector module.
 * @param {object} data - The quest or NPC data containing theme keys.
 */
export function initThemeSelector(data) {
    if (!data?.questTypes) {
        console.error("Theme data is missing for initialization.");
        return;
    }
    themeData = data.questTypes;

    // Load theme from localStorage or use default
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && themeData[savedTheme]) {
        currentTheme = savedTheme;
    }

    if (themeSelect) {
        populateThemeDropdown();
        applyThemeToBody(currentTheme);
        themeSelect.addEventListener('change', handleThemeChange);
    }
}

/**
 * Gets the currently active generator theme.
 * @returns {string} The current theme.
 */
export function getCurrentTheme() {
    return currentTheme;
}