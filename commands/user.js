import { SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';

const adjectives = ["chill", "brave", "silent", "sharp", "frozen", "swift", "dark", "pure", "wild", "quiet", "lone"];
const nouns = ["ghost", "storm", "hunter", "shade", "blade", "void", "flame", "spirit", "hawk", "wolf"];
const verbs = ["strike", "run", "dash", "drift", "glide", "charge", "burn", "fade", "pierce", "hunt"];

const previousResults = new Map();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomWords(list, count) {
  const shuffled = [...list].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateUsername(baseWord, filler, position) {
  const username = position === 'start' ? `${baseWord}${filler}` : `${filler}${baseWord}`;
  return /^[a-zA-Z]+$/.test(username) ? username.toLowerCase() : null;
}

async function checkUsernameAvailability(username) {
  try {
    const res = await fetch(`https://discord.com/api/v9/users/@${username}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.status === 404; // Available if not found
  } catch (e) {
    console.error(`Error checking ${username}:`, e);
    return false;
  }
}

const data = new SlashCommandBuilder()
  .setName('user')
  .setDescription('Generate available Discord usernames using a word')
  .addStringOption(option =>
    option.setName('word')
      .setDescription('Word to include in the username')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('position')
      .setDescription('Position of the word in the username')
      .setChoices(
        { name: 'start', value: 'start' },
        { name: 'end', value: 'end' }
      )
      .setRequired(true))
  .addStringOption(option =>
    option.setName('filltype')
      .setDescription('Type of word to fill with')
      .setChoices(
        { name: 'noun', value: 'noun' },
        { name: 'verb', value: 'verb' },
        { name: 'adjective', value: 'adjective' }
      )
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('length')
      .setDescription('Max length of the username (2–32)')
      .setMinValue(2)
      .setMaxValue(32));

async function execute(interaction) {
  const word = interaction.options.getString('word').toLowerCase();
  const position = interaction.options.getString('position');
  const length = interaction.options.getInteger('length') || 12;
  const fillType = interaction.options.getString('filltype');

  let wordlist = fillType === 'noun' ? nouns : fillType === 'verb' ? verbs : adjectives;
  const fillers = getRandomWords(wordlist, 40);

  const key = JSON.stringify({ word, position, length, fillType });
  if (!previousResults.has(key)) previousResults.set(key, new Set());
  const alreadyUsed = previousResults.get(key);

  const possible = fillers.map(filler => generateUsername(word, filler, position))
    .filter(name => name && name.length <= length && !alreadyUsed.has(name));

  await interaction.deferReply();
  const available = [];

  for (const name of possible) {
    if (available.length >= 10) break;

    await delay(350);
    const isFree = await checkUsernameAvailability(name);

    if (isFree) {
      available.push(name);
      alreadyUsed.add(name);
    }
  }

  if (available.length === 0) {
    return interaction.editReply('❌ No new available usernames found with these settings. Try changing the word or increasing the length.');
  }

  await interaction.editReply(`✅ **Available usernames:**\n\n${available.map(u => `• \`${u}\``).join('\n')}`);
}

export default { data, execute };
