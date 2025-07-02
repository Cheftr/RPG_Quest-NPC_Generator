/**
 * js/modules/quest-generator.js
 *
 * Handles all logic related to generating side quests.
 */
import { getRandomItem, createElementWithAttrs, htmlToElement, showAlert } from './utils.js';
import { getCurrentTheme } from './theme-selector.js'; // Import getter for current theme

let questData = null;
const npcLocks = {}; // This state is specific to the generator page

/**
 * Initializes the quest generator with necessary data.
 * @param {object} data - The quest data loaded from JSON.
 */
export function initQuestGenerator(data) {
    if (!data) {
        console.error("Quest data is missing for initialization.");
        return;
    }
    questData = data;
    populateThemeDropdown();
    setupEventListeners();
}

/**
 * Populates the theme dropdown from the loaded quest data.
 */
function populateThemeDropdown() {
    const themeSelect = document.getElementById('themeSelect');
    if (!questData?.questTypes || !themeSelect) return;

    const themes = Object.keys(questData.questTypes);
    themeSelect.innerHTML = ''; // Clear existing

    themes.forEach(theme => {
        const option = createElementWithAttrs('option', { value: theme }, theme.charAt(0).toUpperCase() + theme.slice(1));
        themeSelect.appendChild(option);
    });

    // Set a default and populate the quest types for it
    themeSelect.value = 'fantasy';
    populateQuestTypeDropdown('fantasy');
}

/**
 * Populates the quest type dropdown based on the selected theme.
 * @param {string} theme - The currently selected theme.
 */
function populateQuestTypeDropdown(theme) {
    const questTypeSelect = document.getElementById('questTypeSelect');
    if (!questData || !questTypeSelect) return;

    questTypeSelect.innerHTML = ''; // Clear previous options

    const typeKeys = Object.keys(questData.questTypes?.[theme] || {});
    const anyOption = createElementWithAttrs('option', { value: 'any' }, 'Any Type');
    questTypeSelect.appendChild(anyOption);

    typeKeys.forEach(type => {
        const option = createElementWithAttrs('option', { value: type }, type.charAt(0).toUpperCase() + type.slice(1));
        questTypeSelect.appendChild(option);
    });
}

/**
 * Generates and displays a new side quest card.
 */
function handleGenerateQuest() {
    const questOutput = document.getElementById('questOutput');
    const themeSelect = document.getElementById('themeSelect');
    const questTypeSelect = document.getElementById('questTypeSelect');

    if (!questData || !questOutput || !themeSelect || !questTypeSelect) {
        showAlert('Required elements for quest generation are not found.');
        return;
    }

    const selectedTheme = themeSelect.value;
    let selectedType = questTypeSelect.value;

    const themeData = questData.questTypes?.[selectedTheme];
    if (!themeData) {
        showAlert(`Theme "${selectedTheme}" not found.`);
        return;
    }

    if (selectedType === 'any') {
        const types = Object.keys(themeData);
        selectedType = getRandomItem(types);
    }

    const typeData = themeData[selectedType];
    if (!typeData) {
        showAlert(`Quest type "${selectedType}" not found in theme "${selectedTheme}".`);
        return;
    }

    questOutput.innerHTML = ''; // Clear previous quests

    const location = getRandomItem(typeData.locations) || 'an unknown place';
    const enemyPool = questData.enemies?.[selectedTheme];
    const enemy = getRandomItem(enemyPool) || 'a mysterious foe';
    const reward = getRandomItem(typeData.rewards) || 'a sense of accomplishment';
    const descriptionTemplate = getRandomItem(typeData.descriptions) || 'A task awaits at {location} involving {enemy}.';

    const description = descriptionTemplate
        .replace(/{location}/g, `<span contenteditable="true">${location}</span>`)
        .replace(/{enemy}/g, `<span contenteditable="true">${enemy}</span>`);

    const card = createQuestCard(selectedTheme, selectedType, description, reward);
    questOutput.prepend(card);
}

/**
 * Creates the HTML structure for a quest card.
 * @param {string} theme - The quest theme.
 * @param {string} type - The quest type.
 * @param {string} description - The main description HTML.
 * @param {string} reward - The reward text.
 * @returns {HTMLElement} The generated card element.
 */
function createQuestCard(theme, type, description, reward) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.type = 'quest';
    card.dataset.theme = theme;

    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title" contenteditable="true">${type.charAt(0).toUpperCase() + type.slice(1)} Quest</h3>
            <div class="card-controls">
                <button class="card-control card-export" aria-label="Export" title="Export card">📥</button>
            </div>
        </div>
        <div class="card-body">
            <p><span contenteditable="true">${description}</span></p>
            <p><strong>Reward:</strong> <span contenteditable="true">${reward}</span></p>
        </div>
    `;

    card.appendChild(htmlToElement(`
        <div class="tag-area">
            <div class="tags-container"></div>
            <input type="text" class="tag-input" placeholder="Add tag...">
        </div>
    `));

    return card;
}

/**
 * Sets up event listeners for the quest generator page.
 */
function setupEventListeners() {
    const generateQuestBtn = document.getElementById('generateQuest');
    const themeSelect = document.getElementById('themeSelect');

    if (generateQuestBtn) {
        generateQuestBtn.addEventListener('click', () => {
            handleGenerateQuest();
            if (typeof gtag === 'function') {
                gtag('event', 'quest_generated', {
                    event_category: 'generator',
                    event_label: 'quest_button'
                });
            }
        });
    }

    if (themeSelect) {
        themeSelect.addEventListener('change', () => {
            populateQuestTypeDropdown(themeSelect.value);
        });
    }
}
