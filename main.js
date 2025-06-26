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

    // Floating Navbar //
    document.querySelectorAll('#floating-nav button[data-target]').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-target');
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  });
});
    // --- Header/title Navigation controls --- //

const toggleBtn = document.querySelector('.title-toggle');
const titleMenu = document.querySelector('.title-menu');

if (toggleBtn && titleMenu) {
  toggleBtn.addEventListener('click', (e) => {
    const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !isOpen);
    titleMenu.hidden = isOpen;
    e.stopPropagation(); // prevents body click from instantly closing it
  });

  // Close menu if clicking anywhere outside
  document.body.addEventListener('click', () => {
    if (toggleBtn.getAttribute('aria-expanded') === 'true') {
      toggleBtn.setAttribute('aria-expanded', 'false');
      titleMenu.hidden = true;
    }
  });

  // Prevent closing if clicking inside the menu
  titleMenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}


    // --- Generation Logic --- //
    const npcLocks = {}; // e.g., { race: "Elf", occupation: "Baker" }

    /**
     * Generates a new side quest card and adds it to the DOM.
     */
    const handleGenerateQuest = () => {
    if (!questData) {
        showAlert('Quest data is not loaded yet. Please wait.');
        return;
    }

    // Clear previous quests
    questOutput.innerHTML = '';

    // --- Type selection ---
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

    // --- Pull details ---
    const location = getRandomItem(data.locations) || 'an unknown place';
    const enemy = getRandomItem(questData.enemies) || 'a mysterious foe';
    const reward = getRandomItem(data.rewards) || 'a sense of accomplishment';
    const descriptionTemplate = getRandomItem(data.descriptions) || 'A task awaits at {location} involving {enemy}.';

    // Replace tokens with contenteditable spans
    const description = descriptionTemplate
        .replace(/{location}/g, `<span contenteditable="true">${location}</span>`)
        .replace(/{enemy}/g, `<span contenteditable="true">${enemy}</span>`);

    // --- Create card ---
    const card = document.createElement('div');
    card.classList.add('card');
    card.setAttribute('data-type', 'quest');

    // --- Header ---
    const header = document.createElement('div');
    header.classList.add('card-header');

    const title = createElementWithAttrs('h3', {
        class: 'card-title',
        contenteditable: 'true'
    }, `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Quest`);
    header.appendChild(title);

    const controls = document.createElement('div');
    controls.classList.add('card-controls');

    const exportBtn = createElementWithAttrs('button', {
        class: 'card-control card-export',
        'aria-label': 'Export',
        title: 'Export card'
    }, '📥');
    controls.appendChild(exportBtn);

    header.appendChild(controls);
    card.appendChild(header);
 

    // --- Body ---
    const body = document.createElement('div');
    body.classList.add('card-body');

    const descriptionP = document.createElement('p');
    descriptionP.innerHTML = `<span contenteditable="true">${description}</span>`;
    body.appendChild(descriptionP);

    const rewardP = document.createElement('p');
    rewardP.innerHTML = `<strong>Reward:</strong> <span contenteditable="true">${reward}</span>`;
    body.appendChild(rewardP);

    card.appendChild(body);

    // --- Tags ---
    const tagArea = htmlToElement(`
        <div class="tag-area">
            <div class="tags-container"></div>
            <input type="text" class="tag-input" placeholder="Add tag...">
        </div>
    `);
    card.appendChild(tagArea);

    // --- Done ---
    questOutput.prepend(card);
};


    /**
     * Generates a new NPC card and adds it to the DOM.
     */
   const handleGenerateNPC = () => {
  if (!npcData) {
    showAlert('NPC data not loaded yet. Please wait.');
    return;
  }

  // Clear old
  npcOutput.innerHTML = '';

  // Grab parts
  const p = npcData.npcParts;

  // Create the card container
  const card = document.createElement('div');
  card.classList.add('card');
  card.setAttribute('data-type', 'npc');

  // Header
 const header = document.createElement('div');
header.classList.add('card-header');

// Create a container for the title
const titleContainer = document.createElement('div');
titleContainer.classList.add('card-title'); // same class for styling

// Compute locked or random names
const firstName = npcLocks.firstName || getRandomItem(p.firstNames) || 'Alex';
const lastName  = npcLocks.lastName  || getRandomItem(p.lastNames)  || 'Doe';

// First Name span
const firstSpan = document.createElement('span');
firstSpan.classList.add('trait');
firstSpan.setAttribute('data-trait', 'firstName');
firstSpan.setAttribute('contenteditable', 'true');
firstSpan.textContent = firstName;

// Last Name span
const lastSpan = document.createElement('span');
lastSpan.classList.add('trait');
lastSpan.setAttribute('data-trait', 'lastName');
lastSpan.setAttribute('contenteditable', 'true');
lastSpan.textContent = lastName;

// Lock button
const lockBtn = document.createElement('button');
lockBtn.classList.add('lock-btn');
lockBtn.setAttribute('data-lock', 'name');
lockBtn.setAttribute('aria-label', npcLocks.firstName && npcLocks.lastName ? 'Unlock name' : 'Lock name');
lockBtn.textContent = npcLocks.firstName && npcLocks.lastName ? '🔒' : '🔓';

// Append to title container
titleContainer.appendChild(lockBtn);
titleContainer.appendChild(firstSpan);
titleContainer.appendChild(lastSpan);


// Append to header
header.appendChild(titleContainer);

  // Export button
  const controls = document.createElement('div');
  controls.classList.add('card-controls');
  const exportBtn = createElementWithAttrs('button', {
    class: 'card-control card-export',
    'aria-label': 'Export',
    title: 'Export card'
  }, '📥');
  controls.appendChild(exportBtn);
  header.appendChild(controls);

  card.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.classList.add('card-body');

  // Helper to pick random or locked
  const pick = (key, list, fallback, count = 1) => {
  // If the trait is locked, return the locked value
  if (npcLocks[key]) return npcLocks[key];

  // Single trait
  if (count === 1) {
    return getRandomItem(list) || fallback;
  }

  // Multi-trait
  const shuffled = [...list].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);
  return selected.join(', ') || fallback;
};

  // Traits rows
  body.appendChild(createLockableTraitRow('Race',       'race',       pick('race',       p.races,             'Human')));
  body.appendChild(createLockableTraitRow('Gender',     'gender',     pick('gender',     p.genders,           'Non-binary')));
  body.appendChild(createLockableTraitRow('Occupation','occupation', pick('occupation', p.occupations,      'Adventurer')));
  body.appendChild(createLockableTraitRow('Hair',       'hair',       pick('hair',       p.appearances.hair, 'nondescript hair')));
  body.appendChild(createLockableTraitRow('Eyes',       'eyes',       pick('eyes',       p.appearances.eyes, 'expressive eyes')));
  body.appendChild(createLockableTraitRow('Clothing',   'clothing',   pick('clothing',   p.appearances.clothing, 'practical clothes')));
  body.appendChild(createLockableTraitRow('Feature',    'features',   pick('features',   p.appearances.features, 'a distinguishing scar',2)));
  body.appendChild(createLockableTraitRow('Personality','personalityTraits', pick('personalityTraits', p.personalityTraits, 'Enigmatic',3)));
  body.appendChild(createLockableTraitRow('Motivation','motivations', pick('motivations',    p.motivations,    'Seeks knowledge')));
  body.appendChild(createLockableTraitRow('Secret',     'secrets',     pick('secrets',     p.secrets,         'Has a hidden past')));
  body.appendChild(createLockableTraitRow('Quest Hook','questHooks', pick('questHooks', p.questHooks,      'Needs help with a personal matter.')));

  card.appendChild(body);

  // Tag area (unchanged)
  const tagArea = htmlToElement(`
    <div class="tag-area">
      <div class="tags-container"></div>
      <input type="text" class="tag-input" placeholder="Add tag..." inputmode ="text> autocomplete="off" spellcheck="off">
    </div>
  `);
  card.appendChild(tagArea);

  // Prepend to output
  npcOutput.prepend(card);
};

    // --- Dice Rolling Logic --- //

document.querySelectorAll('.dice-btn').forEach(icon => {
  icon.addEventListener('click', () => {
    const sides = parseInt(icon.dataset.sides, 10);
    // spin + bounce
    icon.classList.add('spin');
    setTimeout(() => icon.classList.remove('spin'), 600);

    // roll result
    const result = Math.floor(Math.random() * sides) + 1;
    showDiceResult(result);
  });
});

// custom die
document.getElementById('rollCustomDice').addEventListener('click', () => {
  const val = parseInt(document.getElementById('customDice').value, 10);
  if (val > 1) {
    showDiceResult(Math.floor(Math.random() * val) + 1);
  } else {
    showDiceResult('Invalid');
  }
});

// shared result function
function showDiceResult(result) {
  const output = document.getElementById('diceResult');
  output.textContent = `🎲 ${result}`;
  output.classList.add('flash');
  setTimeout(() => output.classList.remove('flash'), 800);
}



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

            const removeBtn = createElementWithAttrs('button', { class: 'remove-tag', 'aria-label': 'Remove tag' }, '🗑️');
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

    // --- Trait Lock Logic --- //
    function createLockableTraitRow(label, traitKey, value) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('trait-row');
  const strong = document.createElement('strong');
  strong.textContent = `${label}: `;

  const span = document.createElement('span');
  span.classList.add('trait');
  span.setAttribute('data-trait', traitKey);
  span.setAttribute('contenteditable', 'true');
  span.textContent = value;

  const button = document.createElement('button');
  button.classList.add('lock-btn');
  const isLocked = npcLocks.hasOwnProperty(traitKey);
  button.textContent = isLocked ? '🔒' : '🔓';
  button.setAttribute('aria-label', isLocked ? 'Unlock trait' : 'Lock trait');
  
  wrapper.appendChild(button);
  wrapper.appendChild(strong);
  wrapper.appendChild(span);
  
  return wrapper;
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

    // --- Event Listeners Setup --- //

    const setupEventListeners = () => {
        // --- Direct Listeners for static elements ---
        document.getElementById('generateQuest').addEventListener('click', handleGenerateQuest);
        document.getElementById('generateNPC').addEventListener('click', handleGenerateNPC);

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
            } else if (target.dataset.lock === 'name') {
                const parent = target.closest('.card-title');
                const firstSpan = parent.querySelector('[data-trait="firstName"]');
                const lastSpan = parent.querySelector('[data-trait="lastName"]');
                if (!firstSpan || !lastSpan) return;

                const isLocked = npcLocks.firstName && npcLocks.lastName;

                if (isLocked) {
                    delete npcLocks.firstName;
                    delete npcLocks.lastName;
                    target.textContent = '🔓';
                    target.setAttribute('aria-label', 'Lock name');
                } else {
                    npcLocks.firstName = firstSpan.textContent.trim();
                    npcLocks.lastName = lastSpan.textContent.trim();
                    target.textContent = '🔒';
                    target.setAttribute('aria-label', 'Unlock name');
                }

                console.log('npcLocks:', npcLocks);
            }else if (target.matches('.lock-btn')) {
                const wrapper = target.closest('.trait-row');
                const span = wrapper?.querySelector('.trait');
                if (!span) return;

                const traitKey = span.getAttribute('data-trait');
                const currentValue = span.textContent.trim();

                const isLocked = npcLocks.hasOwnProperty(traitKey);

                if (isLocked) {
                    delete npcLocks[traitKey];
                    target.textContent = '🔓';
                    target.setAttribute('aria-label', 'Lock trait');
                } else {
                    npcLocks[traitKey] = currentValue;
                    target.textContent = '🔒';
                    target.setAttribute('aria-label', 'Unlock trait');
                }

                console.log('npcLocks:', npcLocks);
            };
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
        loadData();
        setupEventListeners();
    };

    init();

;
