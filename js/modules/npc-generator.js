/**
 * js/modules/npc-generator.js
 *
 * Handles all logic related to generating NPCs.
 */
import { getRandomItem, createElementWithAttrs, htmlToElement, showAlert } from './utils.js';

let npcData = null;
const npcLocks = {}; // State for locked NPC traits

/**
 * Initializes the NPC generator with necessary data.
 * @param {object} data - The NPC data loaded from JSON.
 */
export function initNpcGenerator(data) {
    if (!data) {
        console.error("NPC data is missing for initialization.");
        return;
    }
    npcData = data;
    setupEventListeners();
}

/**
 * Generates and displays a new NPC card.
 */
function handleGenerateNPC() {
    const npcOutput = document.getElementById('npcOutput');
    const themeSelect = document.getElementById('themeSelect');

    if (!npcData || !npcOutput || !themeSelect) {
        showAlert('Required elements for NPC generation are not found.');
        return;
    }

    const selectedTheme = themeSelect.value;
    const p = npcData.npcParts?.[selectedTheme];

    if (!p) {
        showAlert(`Theme "${selectedTheme}" not found in NPC data.`);
        return;
    }

    npcOutput.innerHTML = ''; // Clear old NPC

    const card = createNpcCard(selectedTheme, p);
    npcOutput.prepend(card);
}

/**
 * Creates the HTML structure for an NPC card.
 * @param {string} theme - The NPC's theme.
 * @param {object} p - The parts data for the given theme.
 * @returns {HTMLElement} The generated card element.
 */
function createNpcCard(theme, p) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.type = 'npc';
    card.dataset.theme = theme;

    const firstName = npcLocks.firstName || getRandomItem(p.firstNames) || 'Alex';
    const lastName = npcLocks.lastName || getRandomItem(p.lastNames) || 'Doe';
    const isNameLocked = npcLocks.firstName && npcLocks.lastName;

    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">
                <button class="lock-btn" data-lock="name" aria-label="${isNameLocked ? 'Unlock name' : 'Lock name'}">${isNameLocked ? '🔒' : '🔓'}</button>
                <span class="trait" data-trait="firstName" contenteditable="true">${firstName}</span>
                <span class="trait" data-trait="lastName" contenteditable="true">${lastName}</span>
            </div>
            <div class="card-controls">
                <button class="card-control card-export" aria-label="Export" title="Export card">📥</button>
            </div>
        </div>
    `;

    const body = document.createElement('div');
    body.className = 'card-body';

    const pick = (key, list, fallback, count = 1) => {
        if (npcLocks[key]) return npcLocks[key];
        if (!Array.isArray(list)) return fallback;
        if (count === 1) return getRandomItem(list) || fallback;
        const shuffled = [...list].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).join(', ') || fallback;
    };

    body.appendChild(createLockableTraitRow('Race', 'race', pick('race', p.races, 'Human')));
    body.appendChild(createLockableTraitRow('Gender', 'gender', pick('gender', p.genders, 'Non-binary')));
    body.appendChild(createLockableTraitRow('Occupation', 'occupation', pick('occupation', p.occupations, 'Adventurer')));
    body.appendChild(createLockableTraitRow('Hair', 'hair', pick('hair', p.appearances?.hair, 'nondescript hair')));
    body.appendChild(createLockableTraitRow('Eyes', 'eyes', pick('eyes', p.appearances?.eyes, 'expressive eyes')));
    body.appendChild(createLockableTraitRow('Clothing', 'clothing', pick('clothing', p.appearances?.clothing, 'practical clothes')));
    body.appendChild(createLockableTraitRow('Feature', 'features', pick('features', p.appearances?.features, 'a distinguishing scar', 2)));
    body.appendChild(createLockableTraitRow('Personality', 'personalityTraits', pick('personalityTraits', p.personalityTraits, 'Enigmatic', 3)));
    body.appendChild(createLockableTraitRow('Voice Style', 'voiceStyles', pick('voiceStyles', p.voiceStyles, 'Soft-spoken')));
    body.appendChild(createLockableTraitRow('Motivation', 'motivations', pick('motivations', p.motivations, 'Seeks knowledge')));
    body.appendChild(createLockableTraitRow('Secret', 'secrets', pick('secrets', p.secrets, 'Has a hidden past')));
    body.appendChild(createLockableTraitRow('Connections', 'connections', pick('connections', p.connections, 'Has a legendary mentor')));
    body.appendChild(createLockableTraitRow('Quest Hook', 'questHooks', pick('questHooks', p.questHooks, 'Needs help with a personal matter.')));

    card.appendChild(body);
    card.appendChild(htmlToElement(`
        <div class="tag-area">
            <div class="tags-container"></div>
            <input type="text" class="tag-input" placeholder="Add tag..." autocomplete="off">
        </div>
    `));

    return card;
}

/**
 * Creates a row for a lockable NPC trait.
 * @param {string} label - The display label for the trait.
 * @param {string} traitKey - The key used to identify the trait in `npcLocks`.
 * @param {string} value - The generated value for the trait.
 * @returns {HTMLElement} The trait row element.
 */
function createLockableTraitRow(label, traitKey, value) {
    const wrapper = document.createElement('div');
    wrapper.className = 'trait-row';
    const isLocked = npcLocks.hasOwnProperty(traitKey);

    wrapper.innerHTML = `
        <button class="lock-btn" aria-label="${isLocked ? 'Unlock trait' : 'Lock trait'}">${isLocked ? '🔒' : '🔓'}</button>
        <strong>${label}: </strong>
        <span class="trait" data-trait="${traitKey}" contenteditable="true">${value}</span>
    `;
    return wrapper;
}


/**
 * Sets up event listeners for the NPC generator page.
 */
function setupEventListeners() {
    const generateNpcBtn = document.getElementById('generateNPC');
    if (generateNpcBtn) {
        generateNpcBtn.addEventListener('click', () => {
            handleGenerateNPC();
            if (typeof gtag === 'function') {
                gtag('event', 'npc_generated', {
                    event_category: 'generator',
                    event_label: 'npc_button'
                });
            }
        });
    }

    // Delegated listener for lock buttons
    document.body.addEventListener('click', (event) => {
        const target = event.target;
        if (!target.matches('.lock-btn')) return;

        if (target.dataset.lock === 'name') {
            toggleNameLock(target);
        } else {
            toggleTraitLock(target);
        }
    });
}

function toggleNameLock(button) {
    const parent = button.closest('.card-title');
    const firstSpan = parent.querySelector('[data-trait="firstName"]');
    const lastSpan = parent.querySelector('[data-trait="lastName"]');
    if (!firstSpan || !lastSpan) return;

    const isLocked = npcLocks.firstName && npcLocks.lastName;

    if (isLocked) {
        delete npcLocks.firstName;
        delete npcLocks.lastName;
        button.textContent = '🔓';
        button.setAttribute('aria-label', 'Lock name');
    } else {
        npcLocks.firstName = firstSpan.textContent.trim();
        npcLocks.lastName = lastSpan.textContent.trim();
        button.textContent = '🔒';
        button.setAttribute('aria-label', 'Unlock name');
    }
    console.log('npcLocks:', npcLocks);
}

function toggleTraitLock(button) {
    const wrapper = button.closest('.trait-row');
    const span = wrapper?.querySelector('.trait');
    if (!span) return;

    const traitKey = span.getAttribute('data-trait');
    const isLocked = npcLocks.hasOwnProperty(traitKey);

    if (isLocked) {
        delete npcLocks[traitKey];
        button.textContent = '🔓';
        button.setAttribute('aria-label', 'Lock trait');
    } else {
        npcLocks[traitKey] = span.textContent.trim();
        button.textContent = '🔒';
        button.setAttribute('aria-label', 'Unlock trait');
    }
    console.log('npcLocks:', npcLocks);
}
