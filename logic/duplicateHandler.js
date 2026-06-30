// duplicateHandler.js
// Decides what happens when a player pulls a card they already own.
// Currently: convert to coins. Kept separate from collectionManager.js
// so the conversion rules (and any future alternative, like fusion or
// duplicate shards) can be changed without touching ownership logic.

// Coin value per rarity tier when converting a duplicate. Higher rarities
// pay out more, partly as compensation (a wasted Legendary pull stings
// more than a wasted Common one) and partly to give coins real value
// scaling with the packet odds in packetConfig.js.
const DUPLICATE_COIN_VALUES = {
  Common: 5,
  Rare: 15,
  Epic: 40,
  Legendary: 100
};

// Converts a single duplicate card into its coin value. Takes rarity
// rather than the full card object, since coin value currently depends
// only on rarity tier — keeps the function easy to test and reuse.
function convertDuplicateToCoins(rarity) {
  const value = DUPLICATE_COIN_VALUES[rarity];
  if (value === undefined) {
    console.warn(`duplicateHandler: unknown rarity "${rarity}", defaulting to Common value`);
    return DUPLICATE_COIN_VALUES.Common;
  }
  return value;
}

// Convenience helper for summarising a whole packet's worth of
// duplicates at once, e.g. for an end-of-packet "you earned X coins
// from duplicates" summary screen.
function summariseDuplicates(pulledCards) {
  const duplicates = pulledCards.filter(c => !c.isNew);
  const totalCoins = duplicates.reduce(
    (sum, c) => sum + convertDuplicateToCoins(c.rarity),
    0
  );

  return {
    duplicateCount: duplicates.length,
    totalCoins
  };
}

module.exports = {
  DUPLICATE_COIN_VALUES,
  convertDuplicateToCoins,
  summariseDuplicates
};
