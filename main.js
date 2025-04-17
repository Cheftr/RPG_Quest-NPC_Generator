let questData = {};
let npcData = {};

let currentQuestHTML = '';
let currentNPCHTML = '';

document.addEventListener('DOMContentLoaded', () => {
  fetch('quests.json')
    .then(r => r.json())
    .then(data => {
      questData = data.questTypes;
      populateQuestTypeOptions(questData);
    });

  fetch('npcs.json')
    .then(r => r.json())
    .then(data => {
      npcData = data.npcParts;
    });

  document.getElementById('generateQuest').addEventListener('click', generateQuest);
  document.getElementById('generateNPC').addEventListener('click', generateNPC);
  document.getElementById('saveQuest').addEventListener('click', saveCurrentQuest);
  document.getElementById('saveNPC').addEventListener('click', saveCurrentNPC);
});

function populateQuestTypeOptions(data) {
  const select = document.getElementById('questType');
  select.innerHTML = '';
  const anyOption = document.createElement('option');
  anyOption.value = 'any';
  anyOption.textContent = 'Any';
  select.appendChild(anyOption);
  for (let type in data) {
    const o = document.createElement('option');
    o.value = type;
    o.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    select.appendChild(o);
  }
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateQuest() {
  let type = document.getElementById('questType').value;
  if (type === 'any') {
    type = getRandomItem(Object.keys(questData));
  }
  const quest = questData[type];
  if (!quest) {
    document.getElementById('questOutput').textContent = 'No side quests found.';
    return;
  }
  let desc = getRandomItem(quest.descriptions)
    .replace('{location}', getRandomItem(quest.locations));
  if (desc.includes('{enemy}')) {
    const src = quest.challenges || quest.threats || ['unknown enemy'];
    desc = desc.replace('{enemy}', getRandomItem(src));
  }
  const key = quest.challenges ? 'challenges' : (quest.threats ? 'threats' : null);
  const obstacle = key ? getRandomItem(quest[key]) : 'unknown danger';
  const reward = getRandomItem(quest.rewards);

  currentQuestHTML = `
    <strong contenteditable="true">Quest Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}<br>
    <strong contenteditable="true">Description:</strong> ${desc}<br>
    <strong contenteditable="true">Main Challenge:</strong> ${obstacle}<br>
    <strong contenteditable="true">Reward:</strong> ${reward}
  `;
  document.getElementById('questOutput').innerHTML = currentQuestHTML;
}

let generatedNPCName = '';  // Variable to store the generated NPC name

function generateNPC() {
  const race = getRandomItem(npcData.races);
  const gender = getRandomItem(npcData.genders);
  const occupation = getRandomItem(npcData.occupations);
  const personality = getRandomItem(npcData.personalityTraits);
  const motivation = getRandomItem(npcData.motivations);
  const secret = getRandomItem(npcData.secrets);
  const questHook = getRandomItem(npcData.questHooks);
  const voice = getRandomItem(npcData.voiceStyles);
  const connection = getRandomItem(npcData.connections);
  const app = {
    hair: getRandomItem(npcData.appearances.hair),
    eyes: getRandomItem(npcData.appearances.eyes),
    clothing: getRandomItem(npcData.appearances.clothing),
    feature: getRandomItem(npcData.appearances.features)
  };

  // Generate NPC Name
  const firstName = getRandomItem(npcData.firstNames);
  const lastName = getRandomItem(npcData.lastNames);
  generatedNPCName = `${firstName} ${lastName}`;  // Save the generated name
  
  currentNPCHTML = ` 
    <strong contenteditable="true">NPC Name:</strong> ${generatedNPCName}<br>
    <strong contenteditable="true">NPC:</strong> ${race} ${occupation} (${gender})<br>
    <strong contenteditable="true">Personality:</strong> ${personality}<br>
    <strong contenteditable="true">Voice:</strong> ${voice}<br>
    <strong contenteditable="true">Motivation:</strong> ${motivation}<br>
    <strong contenteditable="true">Secret:</strong> ${secret}<br>
    <strong contenteditable="true">Appearance:</strong> ${app.hair} hair, ${app.eyes} eyes, wearing ${app.clothing}, ${app.feature}<br>
    <strong contenteditable="true">Connection:</strong> ${connection}<br>
    <strong contenteditable="true">Quest Hook:</strong> ${questHook}
  `;
  document.getElementById('npcOutput').innerHTML = currentNPCHTML;
}

function saveCurrentQuest() {
  if (!currentQuestHTML.trim()) return;
  const card = createCard('Quest Title', currentQuestHTML, 'savedQuests');
  document.getElementById('savedQuests').appendChild(card);
}

function saveCurrentNPC() {
    if (!currentNPCHTML.trim()) return;
    
    // Use the stored NPC name as the card title
    const card = createCard(generatedNPCName, currentNPCHTML, 'savedNPCs');
    document.getElementById('savedNPCs').appendChild(card);
  }

// This function will create a pill tag when the user presses Enter
function handleTagInput(event, tagsContainer) {
    if (event.key === "Enter" && event.target.value.trim() !== "") {
      const tagText = event.target.value.trim();
      createTag(tagText, tagsContainer);
      event.target.value = ''; // Reset input field after creating tag
    }
  }
  
  // This function creates a pill-style tag element
  function createTag(tagText, tagsContainer) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = tagText;
  
    // Optional: allow removal of tags by clicking
    tag.onclick = () => tag.remove();
  
    tagsContainer.appendChild(tag);
  }
  
  function createCard(defaultTitle, contentHTML, containerId) {
    const card = document.createElement('div');
    card.className = 'card';
  
    // Header: Title + Toggle + Delete + Export
    const hdr = document.createElement('div');
    hdr.className = 'card-header';
  
    const title = document.createElement('div');
    title.className = 'card-title';
    title.contentEditable = true;
    title.textContent = defaultTitle;
  
    const toggle = document.createElement('button');
    toggle.className = 'toggle-btn';
    toggle.textContent = '▼';
    toggle.onclick = () => {
      body.classList.toggle('collapsed');
      toggle.textContent = body.classList.contains('collapsed') ? '▶' : '▼';
    };
  
    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = '✖';
    del.onclick = () => card.remove();
  
    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-btn';
    exportBtn.textContent = 'Export';
    exportBtn.onclick = () => exportCard(card, defaultTitle);
  
    hdr.appendChild(title);
    hdr.appendChild(toggle);
    hdr.appendChild(del);
    hdr.appendChild(exportBtn);
  
    // Tags bar
    const tags = document.createElement('div');
    tags.className = 'card-tags';
    tags.contentEditable = true;
    tags.setAttribute('placeholder', 'Add tags...');
    
    tags.addEventListener('keydown', (event) => handleTagInput(event, tags));
  
    // Body
    const body = document.createElement('div');
    body.className = 'card-body';
    body.contentEditable = true;
    body.innerHTML = contentHTML;
  
    card.appendChild(hdr);
    card.appendChild(tags);
    card.appendChild(body);
  
    return card;
  }
  
  function exportCard(card, title) {
    const fileContent = `
      Title: ${title}
      Content: 
      ${card.querySelector('.card-body').innerText}
    `;
    
    // Create a Blob and download the file
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.txt`;
    link.click();
  }
  
  
  function exportCard(card, title) {
    const fileContent = `
      Title: ${title}
      Content: 
      ${card.querySelector('.card-body').innerText}
    `;
    
    // Create a Blob and download the file
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.txt`;
    link.click();
  }
  

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");
  const root = document.documentElement;
  const darkMode = localStorage.getItem("theme") === "dark";

  if (darkMode) {
    root.classList.add("dark-mode");
  }

  toggle.addEventListener("click", () => {
    root.classList.toggle("dark-mode");
    const isDark = root.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
});
