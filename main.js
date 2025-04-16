let questData = {};
let npcData = {};

document.addEventListener('DOMContentLoaded', () => {
  fetch('quests.json')
    .then(response => response.json())
    .then(data => {
      questData = data.questTypes;
      populateQuestTypeOptions(questData);
    });

  fetch('npcs.json')
    .then(response => response.json())
    .then(data => {
      npcData = data.npcParts;
    });

  document.getElementById('generateQuest').addEventListener('click', generateQuest);
  document.getElementById('generateNPC').addEventListener('click', generateNPC);
});

function populateQuestTypeOptions(data) {
  const select = document.getElementById('questType');
  for (let type in data) {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    select.appendChild(option);
  }
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateQuest() {
  const type = document.getElementById('questType').value;
  const quest = questData[type];

  if (!quest) {
    document.getElementById('questOutput').textContent = 'No quest data found.';
    return;
  }

  const description = getRandomItem(quest.descriptions);

  // Fill in placeholders
  let filledDescription = description.replace('{location}', getRandomItem(quest.locations));
  if (description.includes('{enemy}')) {
    const enemySource = quest.challenges || quest.threats || ["unknown enemy"];
    filledDescription = filledDescription.replace('{enemy}', getRandomItem(enemySource));
  }

  const challengeKey = quest.challenges ? "challenges" : (quest.threats ? "threats" : null);
  const obstacle = challengeKey ? getRandomItem(quest[challengeKey]) : "unknown danger";
  const reward = getRandomItem(quest.rewards);

  const result = `
    <strong>Quest Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}<br>
    <strong>Description:</strong> ${filledDescription}<br>
    <strong>Main Challenge:</strong> ${obstacle}<br>
    <strong>Reward:</strong> ${reward}
  `;

  document.getElementById('questOutput').innerHTML = result;
}

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

  const appearance = {
    hair: getRandomItem(npcData.appearances.hair),
    eyes: getRandomItem(npcData.appearances.eyes),
    clothing: getRandomItem(npcData.appearances.clothing),
    feature: getRandomItem(npcData.appearances.features),
  };

  const result = `
    <strong>NPC:</strong> ${race} ${occupation} (${gender})<br>
    <strong>Personality:</strong> ${personality}<br>
    <strong>Voice:</strong> ${voice}<br>
    <strong>Motivation:</strong> ${motivation}<br>
    <strong>Secret:</strong> ${secret}<br>
    <strong>Appearance:</strong> ${appearance.hair} hair, ${appearance.eyes} eyes, wearing ${appearance.clothing}, ${appearance.feature}<br>
    <strong>Connection:</strong> ${connection}<br>
    <strong>Quest Hook:</strong> ${questHook}
  `;

  document.getElementById('npcOutput').innerHTML = result;
}
