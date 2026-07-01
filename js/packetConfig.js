// packetConfig.js
// Defines drop rate odds and packet structure for the card collection system.
// Keep this separate from cards.json (card data) and packetOpener.js (logic)
// so rarity odds can be rebalanced without touching either.

const RARITY_ODDS = {
  Common: 0.60,
  Rare: 0.28,
  Epic: 0.10,
  Legendary: 0.02
};

// Sanity check: odds should always sum to 1. Worth asserting this in
// packetOpener.js on load, since a typo here silently breaks drop rates.

const PACKET_TYPES = {
  standard: {
    name: "Standard Packet",
    cardsPerPacket: 3,
    oddsOverride: null // uses RARITY_ODDS as-is
  },
  premium: {
    name: "Premium Packet",
    cardsPerPacket: 5,
    oddsOverride: {
      Common: 0.45,
      Rare: 0.35,
      Epic: 0.16,
      Legendary: 0.04
    }
  }
};

// Pity system: guarantees a minimum rarity after N consecutive
// sub-Epic pulls, to avoid long unlucky streaks souring the loop.
const PITY_SYSTEM = {
  enabled: true,
  pullsBeforeGuarantee: 25,
  guaranteedRarity: "Epic"
};

// Which packet type the daily trivia reward grants by default.
const DAILY_REWARD_PACKET = "standard";

export {
  RARITY_ODDS,
  PACKET_TYPES,
  PITY_SYSTEM,
  DAILY_REWARD_PACKET
};
