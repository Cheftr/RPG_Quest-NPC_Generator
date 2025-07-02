/**
 * js/modules/shared-events.js
 *
 * Handles event listeners for components that appear on multiple pages,
 * like card interactions (export, tags) and navigation.
 */
import { showAlert, createElementWithAttrs } from './utils.js';

/**
 * Sets up event listeners for shared components.
 */
export function setupSharedEventListeners() {
    // Delegated event listener for dynamically created cards
    document.body.addEventListener('click', (event) => {
        const target = event.target;

        if (target.matches('.card-export')) {
            handleCardExport(target);
        } else if (target.matches('.remove-tag')) {
            handleRemoveTag(target);
        } else if (target.matches('.card-toggle')) {
            handleCardToggle(target);
        }
    });

    // Delegated listener for tag input
    document.body.addEventListener('keydown', (event) => {
        if (event.target.matches('.tag-input') && event.key === 'Enter') {
            event.preventDefault();
            handleAddTag(event.target);
        }
    });

    // Floating Nav
    document.querySelectorAll('#floating-nav button[data-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-target');
            const section = document.getElementById(id);
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Header/title menu toggle
    const toggleBtn = document.querySelector('.title-toggle');
    const titleMenu = document.querySelector('.title-menu');

    if (toggleBtn && titleMenu) {
        toggleBtn.addEventListener('click', (e) => {
            const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', !isOpen);
            titleMenu.hidden = isOpen;
            e.stopPropagation();
        });

        document.body.addEventListener('click', () => {
            if (toggleBtn.getAttribute('aria-expanded') === 'true') {
                toggleBtn.setAttribute('aria-expanded', 'false');
                titleMenu.hidden = true;
            }
        });

        titleMenu.addEventListener('click', e => e.stopPropagation());
    }
}


/**
 * Exports the content of a card to a .txt file.
 * @param {HTMLButtonElement} button - The export button that was clicked.
 */
function handleCardExport(button) {
    const card = button.closest('.card');
    if (!card) return;

    const title = card.querySelector('.card-title')?.textContent.trim().replace(/\s+/g, ' ') || 'Untitled';
    const body = card.querySelector('.card-body');
    const tags = Array.from(card.querySelectorAll('.tag-pill')).map(pill => `#${pill.textContent.slice(0, -1).trim()}`).join(' ');

    let content = `${title}\n`;
    content += '--------------------\n';

    body.querySelectorAll('p, .trait-row').forEach(el => {
        content += `${el.innerText.trim()}\n`;
    });

    if (tags) {
        content += '\n--------------------\n';
        content += `Tags: ${tags}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    link.href = url;
    link.download = `${safeFilename || 'export'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Adds a tag to the card's tag container.
 * @param {HTMLInputElement} input - The tag input field.
 */
function handleAddTag(input) {
    const tagText = input.value.trim();
    if (tagText) {
        const tagContainer = input.previousElementSibling;
        const tagPill = createElementWithAttrs('span', { class: 'tag-pill' });
        tagPill.textContent = tagText;

        const removeBtn = createElementWithAttrs('button', { class: 'remove-tag', 'aria-label': 'Remove tag' }, '🗑️');
        tagPill.appendChild(removeBtn);

        tagContainer.appendChild(tagPill);
        input.value = '';
    }
}

/**
 * Removes a tag pill from the DOM.
 * @param {HTMLButtonElement} button - The remove button inside the tag pill.
 */
function handleRemoveTag(button) {
    const tagPill = button.closest('.tag-pill');
    if (tagPill) {
        tagPill.remove();
    }
}

/**
 * Toggles the visibility of a card's body.
 * @param {HTMLButtonElement} button - The toggle button.
 */
function handleCardToggle(button) {
    const card = button.closest('.card');
    if (!card) return;

    card.classList.toggle('collapsed');
    const isExpanded = !card.classList.contains('collapsed');
    button.setAttribute('aria-expanded', isExpanded);
    button.textContent = isExpanded ? '▼' : '▶';
}
