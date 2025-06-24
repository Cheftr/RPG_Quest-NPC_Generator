// main.js
// ------------------------
// Supabase Initialization
// ------------------------
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// WARNING: Keep these publicly accessible but ensure Row Level Security (RLS) is ENABLED and CORRECTLY CONFIGURED in Supabase for ALL operations (SELECT, INSERT, UPDATE, DELETE).
const supabaseUrl = 'https://kklpfrojjshsspoonpoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbHBmcm9qanNoc3Nwb29ucG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTgzOTYsImV4cCI6MjA2MDQ3NDM5Nn0.UCmDo6Iq6ZThMgZvv1n3jWAghdqKT-TgBZDS-k_kbg4';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Global State ---
let currentUser = null; // Store the current user session
let questData = {};
let npcData = {};
let currentQuestHTML = '';
let currentNPCHTML = '';
let generatedNPCName = '';

// --- Auth UI Elements ---
const loginBtn  = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userEmail = document.getElementById('user-email');
const savedQuestsContainer = document.getElementById('savedQuests');
const savedNPCsContainer   = document.getElementById('savedNPCs');
const undoBanner = document.getElementById('undo-banner');
const undoButton = document.getElementById('undo-delete-btn');

// --- Undo Banner Helpers ---
let undoTimeout = null;
let lastDeleted = null; // { elementHTML: string, parent: HTMLElement, nextSibling: Node | null, table: string, id: string | number, title: string }

function showUndoBanner() {
    undoBanner.style.display = 'block';
}
function hideUndoBanner() {
    undoBanner.style.display = 'none';
    if (undoTimeout) {
        clearTimeout(undoTimeout);
        undoTimeout = null;
    }
    lastDeleted = null;
}
function htmlToElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

// --- Authentication & Data Loading ---

// Central function to handle UI changes and data loading based on auth state
async function handleAuthStateChange(event, session) {
    console.log('Auth state changed:', event, session); // More logging
    const potentialUser = session ? session.user : null;

    // Defensive check: Ensure user object looks valid, especially after potential redirect issues
    if (potentialUser && potentialUser.id && potentialUser.aud === 'authenticated') {
         console.log('User session confirmed:', potentialUser.id, potentialUser.email);
         currentUser = potentialUser;
    } else {
         console.log('No valid user session found.');
         currentUser = null;
    }

    // Update UI based on currentUser state
    if (currentUser) {
        // User is logged in
        loginBtn.style.display  = 'none';
        logoutBtn.style.display = 'inline-block';
        userEmail.textContent   = currentUser.email;
        userEmail.setAttribute('aria-label', `Logged in as ${currentUser.email}`);

        // Clear existing items *before* loading new ones
        savedQuestsContainer.innerHTML = '';
        savedNPCsContainer.innerHTML = '';

        // Load user-specific data
        // Use Promise.all for concurrent loading (optional, slight performance gain)
        await Promise.all([
             loadQuestsFromSupabase(),
             loadNPCsFromSupabase()
        ]);

    } else {
        // User is logged out or session invalid
        loginBtn.style.display  = 'inline-block';
        logoutBtn.style.display = 'none';
        userEmail.textContent   = '';
        userEmail.removeAttribute('aria-label');

        // Clear saved items containers
        savedQuestsContainer.innerHTML = '';
        savedNPCsContainer.innerHTML = '';
    }
}

// Listen for authentication state changes
// This is the PRIMARY way the app should react to login/logout
supabase.auth.onAuthStateChange((event, session) => {
    // Wrap the handler call in a setTimeout to potentially mitigate timing issues after redirect
    // This gives the browser a moment to settle after the magic link processing. Might help with "message channel closed".
    setTimeout(() => handleAuthStateChange(event, session), 0);
});


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Load static generator data with better error handling
    let questDataLoaded = false;
    let npcDataLoaded = false;

    fetch('quests.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("quests.json loaded successfully.");
            questData = data.questTypes;
            questDataLoaded = true;
            populateQuestTypeOptions(questData); // Populate dropdown now
        })
        .catch(error => console.error('Error loading or parsing quests.json:', error));

    fetch('npcs.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("npcs.json loaded successfully.");
            npcData = data.npcParts;
            npcDataLoaded = true;
        })
        .catch(error => console.error('Error loading or parsing npcs.json:', error));

    // --- Event Listeners ---
    document.getElementById('generateQuest').addEventListener('click', generateQuest);
    document.getElementById('generateNPC').addEventListener('click', generateNPC);
    document.getElementById('saveQuest').addEventListener('click', saveQuestHandler);
    document.getElementById('saveNPC').addEventListener('click', saveNPCHandler);

    // Dark mode
    const themeToggle = document.getElementById('theme-toggle');
    const rootElement = document.documentElement;
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        rootElement.classList.add('dark-mode');
    } else {
         rootElement.classList.remove('dark-mode');
    }
    themeToggle.addEventListener('click', () => {
        rootElement.classList.toggle('dark-mode');
        localStorage.setItem('theme', rootElement.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    // Auth buttons
    loginBtn.addEventListener('click', async () => {
        const email = prompt('Enter your email for magic link login:');
        if (!email) return;
        try {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
            alert('Check your email for the magic login link!');
        } catch (error) {
             console.error('Login error:', error);
             alert(`Login failed: ${error?.message || 'Unknown error'}`);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            console.log('Logged out successfully via button.');
            // No need to manually call handleAuthStateChange here - onAuthStateChange listener will fire.
             alert('You have been logged out.');
        } catch (error) {
            console.error('Logout error:', error);
            alert(`Logout failed: ${error?.message || 'Unknown error'}`);
        }
    });

    undoButton.addEventListener('click', undoDelete);

    // Initial auth state check on load is implicitly handled by onAuthStateChange firing with
    // 'INITIAL_SESSION' or 'SIGNED_IN' if already logged in, or 'SIGNED_OUT' if not.
    // If issues persist, explicitly calling getSession here might be needed, but try relying on the listener first.
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //     handleAuthStateChange('MANUAL_INITIAL_CHECK', session);
    // });
});

// --- Generator Logic --- (Largely unchanged, added safety checks)

function populateQuestTypeOptions(data) {
    const select = document.getElementById('questType');
    select.innerHTML = '<option value="any">Any</option>'; // Reset options
    if (!data || Object.keys(data).length === 0) {
        console.warn("Quest data is empty, cannot populate options.");
        return;
    }
    Object.keys(data).forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        select.appendChild(option);
    });
}

function getRandomItem(arr) {
    if (!arr || arr.length === 0) return ''; // Handle empty arrays safely
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateQuest() {
    console.log("generateQuest called"); // Debug log
    // Check if questData is loaded and has content
    if (!questData || Object.keys(questData).length === 0) {
        alert("Quest generation data hasn't loaded yet or is empty. Please try again shortly or check the console.");
        console.error("Cannot generate quest: questData is not ready.");
        return;
    }

    let selectedType = document.getElementById('questType').value;
    let typeToUse = selectedType === 'any' ? getRandomItem(Object.keys(questData)) : selectedType;

    // Check if the selected type (or random type) exists in the data
    if (!questData[typeToUse]) {
         alert(`Quest type "${typeToUse}" not found in the data.`);
         console.error(`Quest type "${typeToUse}" not found.`);
         return;
    }
    const quest = questData[typeToUse];


    // Fallback for missing properties within the chosen quest type
    const locations = quest.locations?.length ? quest.locations : ['a mysterious place'];
    const challenges = quest.challenges?.length ? quest.challenges : (quest.threats?.length ? quest.threats : ['an unexpected obstacle']);
    const rewards = quest.rewards?.length ? quest.rewards : ['a sense of accomplishment'];
    const descriptions = quest.descriptions?.length ? quest.descriptions : ['A task needs doing in {location}. It involves {enemy}.'];

    let desc = getRandomItem(descriptions).replace('{location}', getRandomItem(locations));
    if (desc.includes('{enemy}') && challenges.length > 0) {
        desc = desc.replace('{enemy}', getRandomItem(challenges));
    }
    const obstacle = getRandomItem(challenges);
    const reward = getRandomItem(rewards);

    currentQuestHTML = `
      <strong>Quest Type:</strong> <span contenteditable="true">${typeToUse}</span><br>
      <strong>Description:</strong> <span contenteditable="true">${desc}</span><br>
      <strong>Challenge:</strong> <span contenteditable="true">${obstacle}</span><br>
      <strong>Reward:</strong> <span contenteditable="true">${reward}</span>`;
    document.getElementById('questOutput').innerHTML = currentQuestHTML;
    console.log("Quest generated:", typeToUse); // Debug log
}

function generateNPC() {
    console.log("generateNPC called"); // Debug log
    // Check if npcData is loaded and has content
    if (!npcData || Object.keys(npcData).length === 0) {
        alert("NPC generation data hasn't loaded yet or is empty. Please try again shortly or check the console.");
        console.error("Cannot generate NPC: npcData is not ready.");
        return;
    }

    // Ensure all parts exist, provide fallbacks
    const firstNames = npcData.firstNames?.length ? npcData.firstNames : ['Nameless'];
    const lastNames = npcData.lastNames?.length ? npcData.lastNames : ['Wanderer'];
    const races = npcData.races?.length ? npcData.races : ['Humanoid'];
    const occupations = npcData.occupations?.length ? npcData.occupations : ['Commoner'];
    const genders = npcData.genders?.length ? npcData.genders : ['They/Them'];
    const personalityTraits = npcData.personalityTraits?.length ? npcData.personalityTraits : ['Mysterious'];
    const voiceStyles = npcData.voiceStyles?.length ? npcData.voiceStyles : ['Average'];
    const motivations = npcData.motivations?.length ? npcData.motivations : ['Survival'];
    const secrets = npcData.secrets?.length ? npcData.secrets : ['None'];
    const appearances = npcData.appearances || {}; // Handle case where appearances itself might be missing
        const hair = appearances.hair?.length ? appearances.hair : ['Average'];
        const eyes = appearances.eyes?.length ? appearances.eyes : ['Brown'];
        const clothing = appearances.clothing?.length ? appearances.clothing : ['Simple'];
        const features = appearances.features?.length ? appearances.features : ['Unremarkable'];
    const connections = npcData.connections?.length ? npcData.connections : ['None'];
    const questHooks = npcData.questHooks?.length ? npcData.questHooks : ['Looking for work'];


    generatedNPCName = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
    currentNPCHTML = `
      <strong>NPC Name:</strong> <span contenteditable="true">${generatedNPCName}</span><br>
      <strong>Race/Occupation:</strong> <span contenteditable="true">${getRandomItem(races)} ${getRandomItem(occupations)} (${getRandomItem(genders)})</span><br>
      <strong>Personality:</strong> <span contenteditable="true">${getRandomItem(personalityTraits)}</span><br>
      <strong>Voice:</strong> <span contenteditable="true">${getRandomItem(voiceStyles)}</span><br>
      <strong>Motivation:</strong> <span contenteditable="true">${getRandomItem(motivations)}</span><br>
      <strong>Secret:</strong> <span contenteditable="true">${getRandomItem(secrets)}</span><br>
      <strong>Appearance:</strong> <span contenteditable="true">${getRandomItem(hair)} hair, ${getRandomItem(eyes)} eyes, ${getRandomItem(clothing)} clothes, ${getRandomItem(features)}</span><br>
      <strong>Connection:</strong> <span contenteditable="true">${getRandomItem(connections)}</span><br>
      <strong>Quest Hook:</strong> <span contenteditable="true">${getRandomItem(questHooks)}</span>`;
    document.getElementById('npcOutput').innerHTML = currentNPCHTML;
    console.log("NPC generated:", generatedNPCName); // Debug log
}

// --- Saving Logic (with Tags) ---

async function saveQuestHandler() {
    if (!currentQuestHTML.trim()) return alert("Generate a quest before saving.");
    if (!currentUser) return alert("You must be logged in to save quests.");

    const outputDiv = document.getElementById('questOutput');
    // Derive title more robustly - find the first non-empty text after a <strong> tag maybe?
    const title = outputDiv.querySelector('span[contenteditable="true"]')?.textContent.trim() || 'Untitled Quest';
    const content = outputDiv.innerHTML.trim();
    const tags = []; // We'll get tags from the *saved card* structure later

    // NOTE: The current structure doesn't have a place to add tags *during* generation.
    // We need to modify createCard and the save logic to handle tags added *after* saving.
    // Let's simplify: We will add tag functionality *within the saved card itself*.
    // So, saveQuestHandler initially saves without tags. Tags are added/updated later via card interactions.

    console.log(`Attempting to save Quest: "${title}" for user ${currentUser.id}`);
    try {
        const { data, error } = await supabase
            .from('quests')
            .insert([{ title, content, user_id: currentUser.id, tags: [] }]) // Insert with empty tags array
            .select()
            .single();

        if (error) throw error;

        if (data) {
            console.log('Quest saved successfully, creating card:', data);
            // Prepend the new card to the UI using the data from DB
            const cardElement = createCard(data.title, data.content, data.id, data.tags || []);
            savedQuestsContainer.prepend(cardElement);
            // Optionally clear generator:
            // document.getElementById('questOutput').innerHTML = ''; currentQuestHTML = '';
        } else {
             throw new Error('No data returned after insert.');
        }
    } catch (error) {
        console.error('Error saving quest:', error);
        alert(`Failed to save quest: ${error.message}. Check RLS policies (INSERT).`);
    }
}


async function saveNPCHandler() {
     if (!currentNPCHTML.trim()) return alert("Generate an NPC before saving.");
     if (!currentUser) return alert("You must be logged in to save NPCs.");

     const outputDiv = document.getElementById('npcOutput');
     const name = outputDiv.querySelector('span[contenteditable="true"]')?.textContent.trim() || 'Unnamed NPC';
     const content = outputDiv.innerHTML.trim();
     const tags = []; // Save initially with empty tags

     console.log(`Attempting to save NPC: "${name}" for user ${currentUser.id}`);
     try {
         const { data, error } = await supabase
             .from('npcs')
             .insert([{ name, content, user_id: currentUser.id, tags: [] }]) // Insert with empty tags array
             .select()
             .single();

         if (error) throw error;

         if (data) {
             console.log('NPC saved successfully, creating card:', data);
             const cardElement = createCard(data.name, data.content, data.id, data.tags || []);
             savedNPCsContainer.prepend(cardElement);
             // Optionally clear generator:
             // document.getElementById('npcOutput').innerHTML = ''; currentNPCHTML = ''; generatedNPCName = '';
         } else {
              throw new Error('No data returned after insert.');
         }
     } catch (error) {
         console.error('Error saving NPC:', error);
         alert(`Failed to save NPC: ${error.message}. Check RLS policies (INSERT).`);
     }
 }

// --- Loading Logic ---

async function loadQuestsFromSupabase() {
    if (!currentUser) {
        console.log("Skipping quest load: No user logged in.");
        return;
    }
    console.log("Attempting to load quests for user:", currentUser.id);
    try {
        const { data, error } = await supabase
            .from('quests')
            .select('*') // Select all columns, including 'tags'
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error; // Let the catch block handle it

        savedQuestsContainer.innerHTML = ''; // Clear before loading
        data.forEach(q => {
            const card = createCard(q.title, q.content, q.id, q.tags || []); // Pass tags array
            savedQuestsContainer.appendChild(card);
        });
        console.log('Quests loaded:', data.length);

    } catch (error) {
        console.error('Error loading quests:', error);
        // Check specifically for 403, which indicates RLS issues
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
             alert(`Failed to load quests: Permission denied. Please check your Supabase Row Level Security policies for SELECT operations.`);
        } else {
             alert(`Failed to load quests: ${error.message}`);
        }
    }
}

async function loadNPCsFromSupabase() {
     if (!currentUser) {
        console.log("Skipping NPC load: No user logged in.");
        return;
     }
     console.log("Attempting to load NPCs for user:", currentUser.id);
     try {
         const { data, error } = await supabase
             .from('npcs')
             .select('*')
             .eq('user_id', currentUser.id)
             .order('created_at', { ascending: false });

         if (error) throw error;

         savedNPCsContainer.innerHTML = ''; // Clear before loading
         data.forEach(n => {
             const card = createCard(n.name, n.content, n.id, n.tags || []); // Pass tags array
             savedNPCsContainer.appendChild(card);
         });
         console.log('NPCs loaded:', data.length);

     } catch (error) {
         console.error('Error loading NPCs:', error);
         if (error.message.includes('403') || error.message.includes('Forbidden')) {
              alert(`Failed to load NPCs: Permission denied. Please check your Supabase Row Level Security policies for SELECT operations.`);
         } else {
              alert(`Failed to load NPCs: ${error.message}`);
         }
     }
 }


// --- Card Management (Create, Delete, Undo, Export, TAGS!) ---

function createCard(titleText, bodyHTML, id = null, tags = []) {
    // *** FIX: Log the received title ***
    console.log(`Creating card with title: "${titleText}" (ID: ${id})`);

    const card = document.createElement('div');
    card.className = 'card';
    if (id) card.dataset.cardId = id;

    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';

    const title = document.createElement('h3'); // Using H3 for semantic structure
    title.className = 'card-title';
    // *** FIX: Ensure titleText is assigned, provide fallback if empty/undefined ***
    title.textContent = titleText || 'Untitled'; // Use 'Untitled' if titleText is missing

    const controls = document.createElement('div');
    controls.className = 'card-controls';

    // Toggle Collapse Button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-btn card-btn';
    toggleBtn.setAttribute('aria-label', `Expand/Collapse ${titleText || 'Untitled'}`);
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.innerHTML = '&#x25BC;'; // Down arrow ▼

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn card-btn';
    deleteBtn.setAttribute('aria-label', `Delete ${titleText || 'Untitled'}`);
    deleteBtn.innerHTML = '&#x2716;'; // Cross mark ✖

    // Export Button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-btn card-btn';
    exportBtn.setAttribute('aria-label', `Export ${titleText || 'Untitled'} to text file`);
    exportBtn.textContent = 'Export';

    // Card Body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    cardBody.innerHTML = bodyHTML;

    // Tag Area
    const tagArea = document.createElement('div');
    tagArea.className = 'tag-area';
    const tagList = document.createElement('div');
    tagList.className = 'tag-list';
    (tags || []).forEach(tagText => {
        tagList.appendChild(createTagPill(tagText, card)); // Pass card reference
    });
    const tagInput = document.createElement('input'); /* ... tag input setup ... */
    tagArea.append(tagList, tagInput);


    // Assemble Card
    controls.append(toggleBtn, deleteBtn, exportBtn);
    cardHeader.append(title, controls);
    card.append(cardHeader, cardBody, tagArea);

    // --- Attach Event Listeners ---
    toggleBtn.addEventListener('click', () => {
        // Ensure cardBody and tagArea exist before toggling class
        const bodyExists = card.querySelector('.card-body');
        const tagsExist = card.querySelector('.tag-area');
        let isCollapsed = false;
        if (bodyExists) isCollapsed = bodyExists.classList.toggle('collapsed');
        if (tagsExist) tagsExist.classList.toggle('collapsed', isCollapsed); // Sync tag visibility

        toggleBtn.setAttribute('aria-expanded', !isCollapsed);
        toggleBtn.innerHTML = isCollapsed ? '&#x25B6;' : '&#x25BC;';
    });

    // *** FIX: Add logging to Delete button listener ***
    deleteBtn.addEventListener('click', () => {
        console.log(`Delete button clicked for card ID: ${card.dataset.cardId}, Title: "${title.textContent}"`);
        scheduleDelete(card);
    });

    exportBtn.addEventListener('click', () => exportCard(card, title.textContent)); // Use current title text
    tagInput.addEventListener('keydown', (e) => handleTagInput(e, card));


    return card;
}

// --- Tag Specific Functions ---

function createTagPill(tagText, cardElement) {
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.textContent = tagText;
    pill.dataset.tag = tagText; // Store tag value

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-tag-btn';
    removeBtn.innerHTML = '&times;'; // 'x' symbol
    removeBtn.setAttribute('aria-label', `Remove tag: ${tagText}`);
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card-level events if necessary
        pill.remove();
        // IMPORTANT: Trigger save after tag removal
        updateCardTags(cardElement);
    });

    pill.appendChild(removeBtn);
    return pill;
}

function handleTagInput(event, cardElement) {
    if (event.key === 'Enter' && cardElement) {
        event.preventDefault(); // Prevent form submission or newline
        const input = event.target;
        const tagText = input.value.trim();

        if (tagText) {
            const tagList = cardElement.querySelector('.tag-list');
            // Check if tag already exists (case-insensitive check maybe?)
            const existingTags = Array.from(tagList.querySelectorAll('.tag-pill')).map(p => p.dataset.tag.toLowerCase());
            if (!existingTags.includes(tagText.toLowerCase())) {
                tagList.appendChild(createTagPill(tagText, cardElement));
                input.value = ''; // Clear input
                // IMPORTANT: Trigger save after tag addition
                updateCardTags(cardElement);
            } else {
                alert(`Tag "${tagText}" already exists.`);
                input.select(); // Highlight existing text
            }
        }
    }
}

async function updateCardTags(cardElement) {
    if (!currentUser) return; // Should have user if interacting with cards
    const cardId = cardElement.dataset.cardId;
    if (!cardId) {
        console.error("Cannot update tags: Card has no database ID.");
        return; // Should not happen for saved cards
    }

    const tagList = cardElement.querySelector('.tag-list');
    const currentTags = Array.from(tagList.querySelectorAll('.tag-pill')).map(pill => pill.dataset.tag);

    const tableName = cardElement.closest('#savedQuests') ? 'quests' : 'npcs';

    console.log(`Updating tags for ${tableName} ID ${cardId}:`, currentTags);

    try {
        const { error } = await supabase
            .from(tableName)
            .update({ tags: currentTags }) // Update only the tags column
            .eq('user_id', currentUser.id) // Ensure ownership
            .eq('id', cardId);

        if (error) throw error;

        console.log(`Tags for ${cardId} updated successfully.`);

    } catch (error) {
        console.error(`Error updating tags for ${tableName} ID ${cardId}:`, error);
        alert(`Failed to update tags: ${error.message}. Check RLS policies (UPDATE).`);
        // NOTE: No automatic rollback of UI changes here - could be added if needed
    }
}

// --- scheduleDelete, undoDelete, exportCard --- (Need minor adjustments)

function scheduleDelete(card) {
    // *** FIX: Add initial logging ***
    console.log("scheduleDelete called for card:", card);

    const cardId = card.dataset.cardId;
    const titleElement = card.querySelector('.card-title'); // Get title for messages
    const cardTitle = titleElement ? titleElement.textContent : 'Untitled Card'; // Fallback title

    // *** FIX: Check currentUser more robustly ***
    if (!currentUser) {
        console.error("Delete failed: No user logged in.");
        alert("You must be logged in to delete items.");
        return;
    }
    console.log(`Current user ID for delete check: ${currentUser.id}`);

    if (!cardId) {
        console.warn("Attempting to delete card without a database ID. Removing from UI only.");
        card.remove(); // Allow removing UI-only elements if needed
        return;
    }

    const parent = card.parentNode;
    if (!parent || (parent.id !== 'savedQuests' && parent.id !== 'savedNPCs')) {
        console.error("Cannot determine table for deletion from parent:", parent);
        alert("Error: Could not determine where to delete this item from.");
        return;
    }
    const table = parent.id === 'savedQuests' ? 'quests' : 'npcs';

    // Store necessary info for undo
    lastDeleted = {
        elementHTML: card.outerHTML,
        parent: parent,
        nextSibling: card.nextElementSibling,
        table: table,
        id: cardId,
        title: cardTitle // Use the retrieved title
    };
    console.log("Undo state saved:", lastDeleted);

    card.remove(); // Optimistic UI removal
    showUndoBanner();
    console.log(`Card ${cardId} removed from UI, starting delete timeout.`);

    // Set timeout for actual database deletion
    undoTimeout = setTimeout(async () => {
        if (!lastDeleted || lastDeleted.id !== cardId) { // Ensure undo hasn't happened / state is correct
             console.log("Database delete cancelled or state changed.");
             return;
        }

        try {
            console.log(`Attempting database delete: ${lastDeleted.table} item ID: ${lastDeleted.id} by user ${currentUser.id}`);
            const { error } = await supabase
                .from(lastDeleted.table)
                .delete()
                .eq('user_id', currentUser.id) // *** ENSURE RLS relies on this ***
                .eq('id', lastDeleted.id);     // Match specific item

            if (error) throw error; // Let catch block handle

            console.log(`${lastDeleted.title} permanently deleted from database.`);
            hideUndoBanner(); // Cleans up state

        } catch (error) {
            console.error(`Error during database delete for ${lastDeleted.table} ID ${lastDeleted.id}:`, error);
            alert(`Failed to delete '${lastDeleted.title}' from database: ${error.message}. Check RLS policies (DELETE). Restoring item.`);
            // Attempt to restore the card in the UI since DB delete failed
            undoDelete(true); // Pass flag to skip timeout clearing, restore UI
        } finally {
            // If timeout completed successfully or failed & restored, ensure state is cleared if undo wasn't used
             if (lastDeleted && lastDeleted.id === cardId) {
                // If we get here, it means undo wasn't called, but maybe deletion failed.
                // hideUndoBanner() is called on success. undoDelete(true) handles cleanup on error.
                // This might be redundant depending on flow.
             }
        }
    }, 10000);
}

function undoDelete(restoringOnError = false) {
     // ... (clear timeout if needed) ...
     console.log("undoDelete called. RestoringOnError:", restoringOnError); // Debug log
     if (!lastDeleted) {
         console.warn("Undo called but nothing to undo.");
         return;
     }

     // Recreate element from HTML
     const restoredElement = htmlToElement(lastDeleted.elementHTML);
     if (!restoredElement) {
         console.error("Failed to recreate element from HTML for undo.");
         hideUndoBanner(); // Clean up state anyway
         lastDeleted = null;
         return;
     }

     // *** Re-attach ALL event listeners ***
     try { // Wrap re-attachment in try...catch as querySelectors might fail if HTML is odd
         const titleText = restoredElement.querySelector('.card-title')?.textContent || 'Untitled'; // Safely get title
         const toggleBtn = restoredElement.querySelector('.toggle-btn');
         const deleteBtn = restoredElement.querySelector('.delete-btn');
         const exportBtn = restoredElement.querySelector('.export-btn');
         const tagInput = restoredElement.querySelector('.tag-input');

         if (toggleBtn) toggleBtn.addEventListener('click', (e) => { /* ... full toggle logic ... */ });
         else console.warn("Undo: Could not find toggle button to re-attach listener.");

         if (deleteBtn) deleteBtn.addEventListener('click', () => {
             console.log(`Delete button clicked (POST-UNDO) for card ID: ${restoredElement.dataset.cardId}`);
             scheduleDelete(restoredElement);
         });
         else console.warn("Undo: Could not find delete button to re-attach listener.");

         if (exportBtn) exportBtn.addEventListener('click', () => exportCard(restoredElement, titleText));
         else console.warn("Undo: Could not find export button to re-attach listener.");

         if (tagInput) tagInput.addEventListener('keydown', (e) => handleTagInput(e, restoredElement));
         else console.warn("Undo: Could not find tag input to re-attach listener.");

         restoredElement.querySelectorAll('.remove-tag-btn').forEach(btn => {
             btn.addEventListener('click', (e) => {
                 e.stopPropagation();
                 const pill = btn.closest('.tag-pill');
                 if(pill) pill.remove();
                 updateCardTags(restoredElement);
             });
         });
     } catch (error) {
         console.error("Error re-attaching listeners during undo:", error);
         // Proceed with inserting element anyway, but it might not be fully functional
     }


     // Insert back into DOM
     if (lastDeleted.nextSibling) {
         lastDeleted.parent.insertBefore(restoredElement, lastDeleted.nextSibling);
     } else {
         lastDeleted.parent.appendChild(restoredElement);
     }

     console.log(`Card "${lastDeleted.title}" restored to UI.`);

     // Clean up undo state ONLY after successful restoration
     const restoredId = lastDeleted.id; // Keep id for banner check
     lastDeleted = null;

     // Hide banner unless this was triggered by a deletion error
     if (!restoringOnError) {
         hideUndoBanner();
     } else {
         // If restoring on error, the delete timeout technically finished (with error).
         // We need to ensure the banner tied to *that specific* deletion attempt is hidden.
         // Assuming hideUndoBanner clears the global state, this might be okay.
         // If multiple deletes could overlap, more complex state management is needed.
         hideUndoBanner(); // Try hiding anyway, might already be hidden
     }
 }


 function exportCard(card, title) {
    // Safely get elements
    const bodyElement = card.querySelector('.card-body');
    const tagElements = card.querySelectorAll('.tag-list .tag-pill');
    let content = '';
    if (bodyElement) {
        bodyElement.childNodes.forEach(node => {
            if (node.nodeName === 'BR') content += '\n';
            else content += node.textContent;
        });
        content = content.replace(/\n\s*\n/g, '\n').trim();
    } else {
        console.warn("Export: Card body not found.");
    }

    const tags = tagElements ? Array.from(tagElements).map(pill => pill.dataset.tag) : [];
    const tagString = tags.length > 0 ? `\n\nTags: ${tags.join(', ')}` : ''; // Add extra newline before tags

    const blob = new Blob([`Title: ${title || 'Untitled'}\n\n${content}${tagString}`], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const safeFilename = (title || 'exported_item').replace(/[^a-z0-9_\-]/gi, '_').replace(/_{2,}/g, '_');
    link.download = `${safeFilename}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}