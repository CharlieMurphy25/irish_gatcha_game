// saveState.js
// Raw persistence only — reads and writes the player's save data to
// localStorage. Knows nothing about packets, rarity, or pity; it just
// stores whatever shape collectionManager.js gives it. Swapping this for
// a backend API later (fetch/POST instead of localStorage) should not
// require any changes outside this file.

const SAVE_KEY = 'irishGachaCollection';
const SAVE_VERSION = 1;

// Default shape for a brand new player with no save data yet.
function getDefaultCollection() {
  return {
    version: SAVE_VERSION,
    ownedCards: {},
    pityCount: 0,
    coins: 0,
    createdAt: new Date().toISOString()
  };
}

// Reads the save from localStorage. Falls back to a fresh default
// collection if nothing exists yet, or if the saved data is corrupted
// (bad JSON, wrong shape) rather than crashing the whole app.
function loadCollection() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return getDefaultCollection();
    }

    const parsed = JSON.parse(raw);

    if (!parsed.ownedCards || typeof parsed.pityCount !== 'number') {
      console.warn('saveState: save data malformed, resetting to default');
      return getDefaultCollection();
    }

    // Version mismatch handling: if you change the save shape later
    // (e.g. add a new field), bump SAVE_VERSION and add a migration
    // step here rather than wiping the player's collection.
    if (parsed.version !== SAVE_VERSION) {
      console.warn('saveState: save version mismatch, migration may be needed');
    }

    return parsed;
  } catch (err) {
    console.error('saveState: failed to load collection', err);
    return getDefaultCollection();
  }
}

// Writes the save to localStorage. Returns true/false so callers can
// detect failure (e.g. localStorage full or disabled) without throwing.
function saveCollection(collectionData) {
  try {
    const toSave = {
      ...collectionData,
      version: SAVE_VERSION
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
    return true;
  } catch (err) {
    console.error('saveState: failed to save collection', err);
    return false;
  }
}

// Wipes the save entirely. Used for a "reset my collection" debug/dev
// option, or a future account logout flow. Deliberately separate from
// loadCollection's fallback so it can only be triggered explicitly.
function clearCollection() {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (err) {
    console.error('saveState: failed to clear collection', err);
    return false;
  }
}

module.exports = {
  loadCollection,
  saveCollection,
  clearCollection,
  getDefaultCollection
};
