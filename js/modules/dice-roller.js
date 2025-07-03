/**
 * js/modules/dice-roller.js
 *
 * Handles all logic for the dice roller component.
 */

/**
 * Initializes the dice roller component.
 */
export function initDiceRoller() {
    setupEventListeners();
}

/**
 * Gets the number of dice to roll from the input field.
 * @returns {number} The number of dice, defaulting to 1.
 */
function getDiceCount() {
    const countInput = document.getElementById('diceCount');
    if (!countInput) return 1;
    const count = parseInt(countInput.value, 10);
    return isNaN(count) ? 1 : Math.min(Math.max(count, 1), 20);
}

/**
 * Displays the result of a dice roll.
 * @param {string} result - The text to display as the result.
 */
function showDiceResult(result) {
    const output = document.getElementById('diceResult');
    if (!output) return;
    output.textContent = `🎲 ${result}`;
    output.classList.add('flash');
    setTimeout(() => output.classList.remove('flash'), 800);
}

/**
 * Rolls dice and shows the result.
 * @param {number} sides - The number of sides on the die.
 * @param {number} count - The number of dice to roll.
 */
function rollDice(sides, count) {
    if (typeof gtag === 'function') {
        gtag('event', `dice_roll_d${sides}`, {
            event_category: 'dice',
            event_label: `d${sides}x${count}`,
        });
    }
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    showDiceResult(rolls.join(', '));
}

/**
 * Sets up event listeners for the dice roller.
 */
function setupEventListeners() {
    document.querySelectorAll('.dice-btn').forEach(icon => {
        icon.addEventListener('click', () => {
            const sides = parseInt(icon.dataset.sides, 10);
            const count = getDiceCount();
            icon.classList.add('spin');
            setTimeout(() => icon.classList.remove('spin'), 600);
            rollDice(sides, count, `d${sides}x${count}`);
        });
    });

    const rollCustomBtn = document.getElementById('rollCustomDice');
    const customDiceInput = document.getElementById('customDice');

    if (rollCustomBtn && customDiceInput) {
        rollCustomBtn.addEventListener('click', () => {
            const val = parseInt(customDiceInput.value, 10);
            const count = getDiceCount();
            if (val > 1) {
                rollDice(val, count, `d${val}x${count}`);
            } else {
                showDiceResult('Invalid');
            }
        });
    }
}
