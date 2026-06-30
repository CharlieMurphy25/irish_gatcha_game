// collectionBook.js
// Renders the collection book screen: a grid of all cards grouped by
// category, showing owned cards normally and unowned cards as locked
// silhouettes. Reads from collectionManager.js (ownership only) and
// cards.json (card data), and never writes to either — this screen is
// strictly read-only with respect to game state.

import { getOwnershipMap, getCollectionStats, getOwnedCount } from './collectionManager.js';
import { showCardDetail } from './cardDetail.js';

let allCards = [];

// Entry point. Called once when the player navigates to the collection
// book screen. Fetches card data, builds the DOM, and wires up clicks.
async function renderCollectionBook(containerEl) {
  const response = await fetch('./data/cards.json');
  const data = await response.json();
  allCards = data.cards;

  const ownershipMap = getOwnershipMap(allCards.map(c => c.id));
  const stats = getCollectionStats(allCards.length);

  containerEl.innerHTML = '';
  containerEl.appendChild(buildHeader(stats));

  const categories = groupByCategory(allCards);
  Object.entries(categories).forEach(([categoryName, cardsInCategory]) => {
    containerEl.appendChild(
      buildCategorySection(categoryName, cardsInCategory, ownershipMap)
    );
  });
}

// Groups the flat card list into { categoryName: [cards] } so the book
// can render one section per category rather than one undivided grid.
function groupByCategory(cards) {
  return cards.reduce((groups, card) => {
    if (!groups[card.category]) groups[card.category] = [];
    groups[card.category].push(card);
    return groups;
  }, {});
}

// Builds the "X / 70 collected" header with overall progress.
function buildHeader(stats) {
  const header = document.createElement('div');
  header.className = 'collection-header';
  header.innerHTML = `
    <h2>Collection</h2>
    <p>${stats.uniqueOwned} / ${stats.totalCardCount} collected (${stats.percentComplete}%)</p>
    <p class="coin-display">${stats.coins} coins</p>
  `;
  return header;
}

// Builds one category section: a heading plus a grid of card tiles.
function buildCategorySection(categoryName, cardsInCategory, ownershipMap) {
  const section = document.createElement('div');
  section.className = 'category-section';

  const heading = document.createElement('h3');
  heading.textContent = categoryName;
  section.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'card-grid';

  cardsInCategory.forEach(card => {
    grid.appendChild(buildCardTile(card, ownershipMap[card.id]));
  });

  section.appendChild(grid);
  return section;
}

// Builds a single tile. Owned cards show name, image, and rarity;
// unowned cards render as a locked silhouette with no identifying info,
// preserving the "what am I missing" pull of an unfinished collection.
function buildCardTile(card, isOwned) {
  const tile = document.createElement('div');
  tile.className = isOwned
    ? `card-tile owned rarity-${card.rarity.toLowerCase()}`
    : 'card-tile locked';

  if (isOwned) {
    const owned = getOwnedCount(card.id);
    tile.innerHTML = `
      <img src="${card.image}" alt="${card.name}" />
      <p class="card-name">${card.name}</p>
      <p class="card-rarity">${card.rarity}</p>
      ${owned > 1 ? `<span class="dupe-badge">x${owned}</span>` : ''}
    `;
    tile.addEventListener('click', () => showCardDetail(card.id));
  } else {
    tile.innerHTML = `
      <div class="silhouette"></div>
      <p class="card-name">???</p>
    `;
    // Locked tiles are intentionally not clickable — no detail to show
    // for a card the player hasn't unlocked yet.
  }

  return tile;
}

export { renderCollectionBook };
