// collectionManager.js
// Owns the player's collection state: which cards they have, how many
// duplicates, and the pity counter. Sits between packetOpener.js (rolls
// cards, knows nothing about the player) and saveState.js (raw read/write,
// knows nothing about game rules). This file is the only place that
// decides what a "new card" or "duplicate" actually means for the player.

const { openPacket } = require('./packetOpener');
const { loadCollection, saveCollection } = require('./saveState');
const { convertDuplicateToCoins } = require('./duplicateHandler');

// Shape of a player's saved collection (see saveState.js for persistence):
// {
//   ownedCards: { "music_001": 2, "historical_001": 1, ... }  // id -> count owned
//   pityCount: 7,
//   coins: 150
// }

// Opens a packet, applies the results to the player's save data, and
// returns a summary the UI layer can use to drive the reveal animation.
function openPacketForPlayer(packetTypeKey) {
  const collection = loadCollection();

  const result = openPacket(packetTypeKey, { count: collection.pityCount });

  const pulledCards = result.cards.map(card => {
    const alreadyOwned = collection.ownedCards[card.id] > 0;

    if (alreadyOwned) {
      collection.ownedCards[card.id] += 1;
      const coinsAwarded = convertDuplicateToCoins(card.rarity);
      collection.coins += coinsAwarded;
      return { ...card, isNew: false, coinsAwarded };
    } else {
      collection.ownedCards[card.id] = 1;
      return { ...card, isNew: true, coinsAwarded: 0 };
    }
  });

  collection.pityCount = result.updatedPityCount;
  saveCollection(collection);

  return {
    packetType: result.packetType,
    pulledCards
  };
}

// Returns true/false for every card id, used by the collection book to
// render owned vs silhouette without exposing full save data to the UI.
function getOwnershipMap(allCardIds) {
  const collection = loadCollection();
  const map = {};
  allCardIds.forEach(id => {
    map[id] = collection.ownedCards[id] > 0;
  });
  return map;
}

// How many of a specific card the player owns (0 if none).
function getOwnedCount(cardId) {
  const collection = loadCollection();
  return collection.ownedCards[cardId] || 0;
}

// Basic collection-wide stats, useful for a "X / 70 collected" header.
function getCollectionStats(totalCardCount) {
  const collection = loadCollection();
  const uniqueOwned = Object.keys(collection.ownedCards).filter(
    id => collection.ownedCards[id] > 0
  ).length;

  return {
    uniqueOwned,
    totalCardCount,
    percentComplete: Math.round((uniqueOwned / totalCardCount) * 100),
    coins: collection.coins
  };
}

module.exports = {
  openPacketForPlayer,
  getOwnershipMap,
  getOwnedCount,
  getCollectionStats
};
