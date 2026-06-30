// cardDetail.js
// Renders the detail view for a single owned card: full stats (with
// rarity multiplier applied), trait, move, and lore text. Read-only —
// pulls card data from cards.json and ownership count from
// collectionManager.js, never writes anything. Opened from
// collectionBook.js when the player taps an owned card tile.

import { getOwnedCount } from './collectionManager.js';

let allCards = null;

// Loads and caches cards.json once, since cardDetail may be opened
// repeatedly in a session and the card list doesn't change at runtime.
async function loadCardData() {
  if (allCards) return allCards;
  const response = await fetch('./data/cards.json');
  const data = await response.json();
  allCards = data.cards;
  return allCards;
}

// Entry point, called by collectionBook.js with a card id. Renders into
// a modal-style overlay rather than navigating away, so the player can
// close it and land back on the same scroll position in the book.
async function showCardDetail(cardId, containerEl) {
  const cards = await loadCardData();
  const card = cards.find(c => c.id === cardId);

  if (!card) {
    console.error(`cardDetail: no card found with id ${cardId}`);
    return;
  }

  const ownedCount = getOwnedCount(cardId);
  const overlay = buildOverlay(card, ownedCount);

  containerEl.appendChild(overlay);
}

// Builds the full overlay: backdrop, card panel, stats, trait, move,
// lore, and a close button. Clicking the backdrop (not the panel)
// closes it, matching standard modal behaviour.
function buildOverlay(card, ownedCount) {
  const overlay = document.createElement('div');
  overlay.className = 'card-detail-overlay';

  overlay.innerHTML = `
    <div class="card-detail-panel rarity-${card.rarity.toLowerCase()}">
      <button class="close-btn" aria-label="Close">×</button>
      <img src="${card.image}" alt="${card.name}" class="detail-image" />
      <h2>${card.name}</h2>
      <p class="detail-meta">${card.category} · ${card.rarity} · x${card.rarityMultiplier}</p>
      ${ownedCount > 1 ? `<p class="owned-count">Owned: ${ownedCount}</p>` : ''}

      <div class="stat-block">
        ${buildStatRow('Strength', card.baseStats.strength, card.rarityMultiplier)}
        ${buildStatRow('Agility', card.baseStats.agility, card.rarityMultiplier)}
        ${buildStatRow('Constitution', card.baseStats.constitution, card.rarityMultiplier)}
      </div>

      <div class="ability-block">
        <h3>Trait — ${card.trait.name}</h3>
        <p>${card.trait.description}</p>
      </div>

      <div class="ability-block">
        <h3>Move — ${card.move.name}</h3>
        <p>${card.move.description}</p>
      </div>

      <div class="lore-block">
        <p>${card.lore}</p>
      </div>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('close-btn')) {
      overlay.remove();
    }
  });

  return overlay;
}

// Renders a single stat row showing the base value and the effective
// value after the rarity multiplier is applied, so the multiplier's
// impact is visible rather than just stated as a number on its own.
function buildStatRow(label, baseValue, multiplier) {
  const effectiveValue = Math.round(baseValue * multiplier);
  return `
    <div class="stat-row">
      <span class="stat-label">${label}</span>
      <span class="stat-value">${effectiveValue}</span>
      <span class="stat-base">(${baseValue} base)</span>
    </div>
  `;
}

export { showCardDetail };
