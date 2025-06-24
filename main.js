/**
 * main.js
 *
 * Core script for the TTRPG Side Quest & NPC Generator.
 * Handles data loading, content generation, dynamic card interactions,
 * local storage for themes, and stubs for future premium features.

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // --- Global State & Configuration --- //
    let questData = null;
    let npcData = null;

    // --- DOM Element References --- //
    const questTypeSelect = document.getElementById('questType');
    const questOutput = document.getElementById('questOutput');
    const npcOutput = document.getElementById('npcOutput');
    // --- Helper Functions --- //

    /**
     * Creates a DOM element from an HTML string.
     * @param {string} htmlString - The HTML string to convert.
     * @returns {Node} The first element created from the string.
     */
    const htmlToElement = (htmlString) => {
        const template = document.createElement('template');
        template.innerHTML = htmlString.trim();
        return template.content.firstChild;
    };

    /**
     * Gets a random item from an array.
     * @param {Array<T>} arr - The array to pick from.
     * @returns {T|null} A random item or null if the array is empty.
     */
    const getRandomItem = (arr) => {
        if (!arr || arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    };

    /**
     * Creates an element with specified attributes and content.
     * @param {string} tag - The HTML tag for the element.
     * @param {object} attributes - An object of attributes to set.
     * @param {string} [textContent] - Optional text content for the element.
     * @returns {HTMLElement} The created element.
     */
    const createElementWithAttrs = (tag, attributes, textContent) => {
        const el = document.createElement(tag);
        for (const key in attributes) {
            el.setAttribute(key, attributes[key]);
        }
        if (textContent) {
            el.textContent = textContent;
        }
        return el;
    };

    /**
     * Shows a browser alert with a standardized message.
     * @param {string} message - The message to display.
     */
    const showAlert = (message) => {
        // In a real app, this would be a styled modal, not a browser alert.
        alert(message);
    };


    // --- Data Loading --- //

    /**
     * Fetches and parses JSON data from the server.
     */
    const loadData = async () => {
        try {
            const [questResponse, npcResponse] = await Promise.all([
                fetch('Data/quests.json'),
                fetch('Data/npcs.json'),
            ]);

            if (!questResponse.ok || !npcResponse.ok) {
                throw new Error(`HTTP error! Quest status: ${questResponse.status}, NPC status: ${npcResponse.status}`);
            }

            questData = await questResponse.json();
            npcData = await npcResponse.json();

            console.log('Data loaded successfully.');
            populateQuestTypeDropdown();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            showAlert('Error: Could not load required data files. Please check the console and refresh the page.');
        }
    };

    /**
     * Populates the quest type dropdown from the loaded quest data.
     */
    const populateQuestTypeDropdown = () => {
        if (!questData || !questTypeSelect) return;
        questTypeSelect.innerHTML = ''; // Clear existing options

        const anyOption = createElementWithAttrs('option', { value: 'any' }, 'Any Type');
        questTypeSelect.appendChild(anyOption);

        const questTypes = Object.keys(questData.questTypes);
        questTypes.forEach(type => {
            const option = createElementWithAttrs('option', { value: type }, type.charAt(0).toUpperCase() + type.slice(1));
            questTypeSelect.appendChild(option);
        });
    };


    // --- Generation Logic --- //

    /**
     * Generates a new side quest card and adds it to the DOM.
     */
    const handleGenerateQuest = () => {
        if (!questData) {
            showAlert('Quest data is not loaded yet. Please wait.');
            return;
        }

        let selectedType = questTypeSelect.value;
        if (selectedType === 'any') {
            const types = Object.keys(questData.questTypes);
            selectedType = getRandomItem(types);
        }

        const data = questData.questTypes[selectedType];
        if (!data) {
            console.error(`Invalid quest type selected: ${selectedType}`);
            return;
        }

        const location = getRandomItem(data.locations) || 'an unknown place';
        const enemy = getRandomItem(questData.enemies) || 'a mysterious foe';
        const descriptionTemplate = getRandomItem(data.descriptions) || 'A task needs doing at {location} involving {challenge}.';
        const reward = getRandomItem(data.rewards) || 'a sense of accomplishment';

        const description = descriptionTemplate
            .replace(/{location}/g, `<span contenteditable="true">${location}</span>`)
            .replace(/{enemy}/g, `<span contenteditable="true">${enemy}</span>`);

        const questCardHTML = `
            <div class="card" data-type="quest">
                <div class="card-header">
                    <h3 class="card-title" contenteditable="true">${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Quest</h3>
                    <div class="card-controls">
                        <button class="card-control card-toggle" aria-label="Collapse" aria-expanded="true">▼</button>
                        <button class="card-control card-delete" aria-label="Delete">🗑️</button>
                        <button class="card-control card-export" aria-label="Export">💾</button>
                    </div>
                </div>
                <div class="card-body">
                    <p><span contenteditable="true">${description}</span></p>
                    <p><strong>Reward:</strong><span contenteditable="true"> ${reward}</span></p>
                </div>
                <div class="tag-area">
                    <div class="tags-container"></div>
                    <input type="text" class="tag-input" placeholder="Add tag...">
                </div>
            </div>`;

        const cardElement = htmlToElement(questCardHTML);
        questOutput.innerHTML = ''; // clear previous card(s)
        questOutput.prepend(cardElement);
    };

    /**
     * Generates a new NPC card and adds it to the DOM.
     */
    const handleGenerateNPC = () => {
        if (!npcData) {
            showAlert('NPC data is not loaded yet. Please wait.');
            return;
        }

        const p = npcData.npcParts;
        const firstName = getRandomItem(p.firstNames) || 'Alex';
        const lastName = getRandomItem(p.lastNames) || 'Doe';
        const appearance = {
            hair: getRandomItem(p.appearances.hair) || 'nondescript hair',
            eyes: getRandomItem(p.appearances.eyes) || 'expressive eyes',
            clothing: getRandomItem(p.appearances.clothing) || 'practical clothes',
            features: getRandomItem(p.appearances.features) || 'a distinguishing scar'
        };

        const npcCardHTML = `
            <div class="card" data-type="npc">
                <div class="card-header">
                    <h3 class="card-title" contenteditable="true">${firstName} ${lastName}</h3>
                    <div class="card-controls">
                        <button class="card-control card-toggle" aria-label="Collapse" aria-expanded="true">▼</button>
                        <button class="card-control card-delete" aria-label="Delete">🗑️</button>
                        <button class="card-control card-export" aria-label="Export">💾</button>
                    </div>
                </div>
                <div class="card-body">
                    <p><strong>Race:</strong> <span contenteditable="true">${getRandomItem(p.races) || 'Human'}</span></p>
                    <p><strong>Gender:</strong> <span contenteditable="true">${getRandomItem(p.genders) || 'Non-binary'}</span></p>
                    <p><strong>Occupation:</strong> <span contenteditable="true">${getRandomItem(p.occupations) || 'Adventurer'}</span></p>
                    <p><strong>Appearance:</strong> <span contenteditable="true">${appearance.hair}, ${appearance.eyes}, wearing ${appearance.clothing}, with ${appearance.features}.</span></p>
                    <p><strong>Personality:</strong> <span contenteditable="true">${getRandomItem(p.personalityTraits) || 'Enigmatic'}</span></p>
                    <p><strong>Motivation:</strong> <span contenteditable="true">${getRandomItem(p.motivations) || 'Seeks knowledge'}</span></p>
                    <p><strong>Secret:</strong> <span contenteditable="true">${getRandomItem(p.secrets) || 'Has a hidden past'}</span></p>
                    <p><strong>Quest Hook:</strong> <span contenteditable="true">${getRandomItem(p.questHooks) || 'Needs help with a personal matter.'}</span></p>
                </div>
                <div class="tag-area">
                    <div class="tags-container"></div>
                    <input type="text" class="tag-input" placeholder="Add tag...">
                </div>
            </div>`;

        const cardElement = htmlToElement(npcCardHTML);
        npcOutput.innerHTML = '';   // for handleGenerateNPC
        npcOutput.prepend(cardElement);
    };


    // --- Card Interaction Logic --- //

    /**
     * Toggles the visibility of a card's body and tag area.
     * @param {HTMLButtonElement} button - The toggle button that was clicked.
     */
    const handleCardToggle = (button) => {
        const card = button.closest('.card');
        if (!card) return;

        card.classList.toggle('collapsed');
        const isExpanded = !card.classList.contains('collapsed');
        button.setAttribute('aria-expanded', isExpanded);
        button.textContent = isExpanded ? '▼' : '▶';
    };

    /**
     * Adds a tag to the card's tag container.
     * @param {HTMLInputElement} input - The tag input field.
     */
    const handleAddTag = (input) => {
        const tagText = input.value.trim();
        if (tagText) {
            const tagContainer = input.previousElementSibling;
            const tagPill = createElementWithAttrs('span', { class: 'tag-pill' });
            tagPill.textContent = tagText;

            const removeBtn = createElementWithAttrs('button', { class: 'remove-tag', 'aria-label': 'Remove tag' }, '×');
            tagPill.appendChild(removeBtn);

            tagContainer.appendChild(tagPill);
            input.value = '';
            // PREMIUM FEATURE: This would trigger an auto-save.
            console.log('Tag added. Placeholder for auto-save.');
        }
    };

    /**
     * Removes a tag pill from the DOM.
     * @param {HTMLButtonElement} button - The remove button inside the tag pill.
     */
    const handleRemoveTag = (button) => {
        const tagPill = button.closest('.tag-pill');
        if (tagPill) {
            tagPill.remove();
            // PREMIUM FEATURE: This would trigger an auto-save.
            console.log('Tag removed. Placeholder for auto-save.');
        }
    };

    // --- Save Stubs (Premium Feature) --- //

    const handleSave = (type) => {
        const outputContainer = type === 'quest' ? questOutput : npcOutput;
        if (outputContainer.children.length === 0) {
            showAlert(`Please generate a ${type} first.`);
            return;
        }
        // PREMIUM FEATURE
        showAlert('Saving is a premium feature—coming soon!');
    };



    // --- Export Logic --- //

    /**
     * Exports the content of a card to a .txt file.
     * @param {HTMLButtonElement} button - The export button that was clicked.
     */
    const handleCardExport = (button) => {
        const card = button.closest('.card');
        if (!card) return;

        const title = card.querySelector('.card-title')?.textContent.trim() || 'Untitled';
        const body = card.querySelector('.card-body');
        const tags = Array.from(card.querySelectorAll('.tag-pill')).map(pill => `#${pill.textContent.slice(0, -1).trim()}`).join(' ');

        let content = `${title}\n`;
        content += '--------------------\n';

        // Extract text from all paragraphs in the card body
        body.querySelectorAll('p').forEach(p => {
            content += `${p.innerText}\n`;
        });

        if (tags) {
            content += '\n--------------------\n';
            content += `Tags: ${tags}\n`;
        }

        // PREMIUM FEATURE: Could be expanded to export to PDF, JSON, etc.
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        link.href = url;
        link.download = `${safeFilename}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // --- Theme Management --- //

    /**
     * Toggles the dark mode theme and saves the preference.
     */
    const handleThemeToggle = () => {
        const rootEl = document.documentElement;
        rootEl.classList.toggle('dark-mode');

        const newTheme = rootEl.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        console.log(`Theme set to ${newTheme}`);
    };

    /**
     * Applies the saved theme from local storage on page load.
     */
    const applyInitialTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark-mode');
        }
    };

    // --- Event Listeners Setup --- //

    const setupEventListeners = () => {
        // --- Direct Listeners for static elements ---
        document.getElementById('generateQuest').addEventListener('click', handleGenerateQuest);
        document.getElementById('generateNPC').addEventListener('click', handleGenerateNPC);
        document.getElementById('theme-toggle').addEventListener('click', handleThemeToggle);

        // --- Save buttons (Premium Stubs) ---
        const saveQuestBtn = document.getElementById('saveQuestButton');
        saveQuestBtn.classList.add('premium-only', 'locked');
        saveQuestBtn.setAttribute('data-feature', 'save');
        saveQuestBtn.addEventListener('click', () => handleSave('quest'));

        const saveNpcBtn = document.getElementById('saveNPCButton');
        saveNpcBtn.classList.add('premium-only', 'locked');
        saveNpcBtn.setAttribute('data-feature', 'save');
        saveNpcBtn.addEventListener('click', () => handleSave('npc'));



        // --- Delegated Event Listeners for dynamic content ---
        document.body.addEventListener('click', (event) => {
            const target = event.target;
            if (target.matches('.card-toggle')) {
                handleCardToggle(target);
            } else if (target.matches('.card-delete')) {
                handleCardDelete(target);
            } else if (target.matches('.card-export')) {
                handleCardExport(target);
            } else if (target.matches('.remove-tag')) {
                handleRemoveTag(target);
            }
        });

        document.body.addEventListener('keydown', (event) => {
            if (event.target.matches('.tag-input') && event.key === 'Enter') {
                event.preventDefault(); // Prevent form submission if it's in a form
                handleAddTag(event.target);
            }
        });
    };

    // --- Initialization --- //

    const init = () => {
        applyInitialTheme();
        loadData();
        setupEventListeners();
    };

    init();

;
