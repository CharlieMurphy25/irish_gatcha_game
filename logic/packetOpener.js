// packetOpener.js
// The only module allowed to roll for cards. Reads packetConfig.js for odds
// and cards.json for the pool, returns a packet result. Does NOT save
// anything to the player's collection — that's collectionManager.js's job.
// Keeping roll logic separate from save logic means opening a packet can be
// previewed, retried, or unit tested without side effects.

const { RARITY_ODDS, PACKET_TYPES, PITY_SYSTEM } = require('./packetConfig');
const { cards } = require('./data/cards.json');

// Sanity check on load: catches a typo in packetConfig.js odds early,
// rather than silently skewing drop rates in production.
function validateOdds(odds) {
  const sum = Object.values(odds).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 0.001) {
    throw new Error(`Rarity odds must sum to 1, got ${sum}`);
  }
}

// Rolls a single rarity tier based on weighted odds.
function rollRarity(odds) {
  const roll = Math.random();
  let cumulative = 0;
  for (const [rarity, chance] of Object.entries(odds)) {
    cumulative += chance;
    if (roll <= cumulative) return rarity;
  }
  return Object.keys(odds)[0]; // fallback, should never hit
}

// Picks a random card from cards.json matching a given rarity.
function pickCardByRarity(rarity) {
  const pool = cards.filter(c => c.rarity === rarity);
  if (pool.length === 0) {
    throw new Error(`No cards found for rarity: ${rarity}`);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// Pity tracking lives here, not in collectionManager, since it only
// concerns the rolling process itself, not what happens after.
// pityState is passed in/out rather than stored globally, so the caller
// (collectionManager) owns persistence and packetOpener stays stateless.
function applyPity(pityState, rarity) {
  const sequence = ["Common", "Rare", "Epic", "Legendary"];
  const guaranteedIndex = sequence.indexOf(PITY_SYSTEM.guaranteedRarity);
  const rolledIndex = sequence.indexOf(rarity);

  if (!PITY_SYSTEM.enabled) {
    return { finalRarity: rarity, newPityCount: 0 };
  }

  if (rolledIndex >= guaranteedIndex) {
    // Pulled Epic+ naturally, reset the counter
    return { finalRarity: rarity, newPityCount: 0 };
  }

  const newCount = pityState.count + 1;
  if (newCount >= PITY_SYSTEM.pullsBeforeGuarantee) {
    return { finalRarity: PITY_SYSTEM.guaranteedRarity, newPityCount: 0 };
  }

  return { finalRarity: rarity, newPityCount: newCount };
}

// Main entry point. Opens one packet and returns the cards drawn plus
// the updated pity count, leaving the caller responsible for saving both.
function openPacket(packetTypeKey, pityState = { count: 0 }) {
  const packetType = PACKET_TYPES[packetTypeKey];
  if (!packetType) {
    throw new Error(`Unknown packet type: ${packetTypeKey}`);
  }

  const odds = packetType.oddsOverride || RARITY_ODDS;
  validateOdds(odds);

  const drawnCards = [];
  let currentPity = pityState.count;

  for (let i = 0; i < packetType.cardsPerPacket; i++) {
    const rolledRarity = rollRarity(odds);
    const { finalRarity, newPityCount } = applyPity(
      { count: currentPity },
      rolledRarity
    );
    currentPity = newPityCount;

    const card = pickCardByRarity(finalRarity);
    drawnCards.push(card);
  }

  return {
    packetType: packetType.name,
    cards: drawnCards,
    updatedPityCount: currentPity
  };
}

module.exports = {
  openPacket,
  // exported for testing / debugging individual pieces
  rollRarity,
  pickCardByRarity,
  applyPity
};
