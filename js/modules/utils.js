/**
 * js/modules/utils.js
 *
 * Contains shared helper functions used across different modules.
 */

/**
 * Creates a DOM element from an HTML string.
 * @param {string} htmlString - The HTML string to convert.
 * @returns {Node} The first element created from the string.
 */
export const htmlToElement = (htmlString) => {
    const template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
};

/**
 * Gets a random item from an array.
 * @param {Array<T>} arr - The array to pick from.
 * @returns {T|null} A random item or null if the array is empty.
 */
export const getRandomItem = (arr) => {
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
export const createElementWithAttrs = (tag, attributes, textContent) => {
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
 * Shows a styled alert message. In a real app, this would be a modal.
 * @param {string} message - The message to display.
 */
export const showAlert = (message) => {
    // For now, we'll use the browser's alert.
    // This could be replaced with a custom modal implementation later.
    alert(message);
};

/**
 * Fetches and parses JSON data from the server.
 * @param {string[]} paths - An array of paths to the JSON files.
 * @returns {Promise<Object[]>} A promise that resolves to an array of JSON data objects.
 */
export const loadData = async (paths) => {
    try {
        const responses = await Promise.all(paths.map(path => fetch(path)));
        responses.forEach(res => {
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        });
        const data = await Promise.all(responses.map(res => res.json()));
        console.log('Data loaded successfully.');
        return data;
    } catch (error) {
        console.error('Failed to load data:', error);
        showAlert('Error loading essential data. Please check the console and try refreshing.');
        return [];
    }
};
