/**
 * js/main.js
 *
 * Main application entry point.
 * Determines the current page and initializes the necessary modules.
 */
import { loadData } from './modules/utils.js';
import { initQuestGenerator } from './modules/quest-generator.js';
import { initNpcGenerator } from './modules/npc-generator.js';
import { initDiceRoller } from './modules/dice-roller.js';
import { initTheme } from './modules/theme.js';
import { initThemeSelector } from './modules/theme-selector.js';
import { setupSharedEventListeners } from './modules/shared-events.js';

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize functionalities common to ALL pages
    setupSharedEventListeners();
    initTheme(); // Initializes light/dark mode toggle

    // 2. Load all potential data needed for the site at once.
    const [questData, npcData] = await loadData(['Data/quests.json', 'Data/npcs.json']);

    // 3. Initialize the generator theme selector if the dropdown exists on the page.
    if (document.getElementById('themeSelect')) {
        initThemeSelector(questData);
    }

    // 4. Initialize page-specific logic based on body ID
    const bodyId = document.body.id;
    if (bodyId === 'page-home') {
        // Initialize modules specific to the homepage
        if (document.getElementById('questGeneratorSection')) {
            initQuestGenerator(questData);
        }
        if (document.getElementById('npcGeneratorSection')) {
            initNpcGenerator(npcData);
        }
        initDiceRoller();
    }
});