// packetOpeningScreen.js
// The reveal screen shown after a player earns a packet (from trivia,
// battle wins, etc). This is the ONLY UI screen that calls
// openPacketForPlayer — every other screen only reads collection state
// after the fact. Handles the card-by-card reveal animation and the
// end-of-packet duplicate summary.

import { openPacketForPlayer } from './collectionManager.js';
import { summariseDuplicates } from './duplicateHandler.js';

const REVEAL_DELAY_MS = 600; // pause between each card flip

// Entry point. Called when a player taps "open packet" after completing
// trivia or earning a packet some other way. packetTypeKey matches a key
// in packetConfig.js (e.g. 'standard', 'premium').
async function openPacketScreen(containerEl, packetTypeKey) {
  containerEl.innerHTML = '';
  const stage = buildStage();
  containerEl.appendChild(stage);

  // Roll happens immediately, but reveal is paced out visually below.
  // This keeps the actual game-state mutation (collectionManager call)
  // separate from the presentation timing.
  const result = openPacketForPlayer(packetTypeKey);

  showOpeningAnimation(stage, () => {
    revealCardsSequentially(stage, result.pulledCards, () => {
      showSummary(stage, result);
    });
  });
}

// Builds the empty stage container the reveal sequence renders into.
function buildStage() {
  const stage = document.createElement('div');
  stage.className = 'packet-stage';
  return stage;
}

// Plays the initial "packet shaking / about to open" animation before
// any cards are shown. onComplete fires once the animation finishes.
function showOpeningAnimation(stage, onComplete) {
  const packetEl = document.createElement('div');
  packetEl.className = 'packet-icon shaking';
  packetEl.textContent = 'Tap to open';
  stage.appendChild(packetEl);

  packetEl.addEventListener('click', () => {
    packetEl.classList.add('bursting');
    setTimeout(() => {
      packetEl.remove();
      onComplete();
    }, 400);
  }, { once: true });
}

// Reveals each pulled card one at a time with a short delay between
// each, so duplicates and rarities land with visual weight rather than
// dumping the whole packet on screen at once.
function revealCardsSequentially(stage, pulledCards, onAllRevealed) {
  let index = 0;

  function revealNext() {
    if (index >= pulledCards.length) {
      onAllRevealed();
      return;
    }

    const card = pulledCards[index];
    stage.appendChild(buildRevealCard(card));
    index += 1;
    setTimeout(revealNext, REVEAL_DELAY_MS);
  }

  revealNext();
}

// Builds a single revealed card tile. New cards get a "NEW" badge and a
// rarity-coloured glow class; duplicates show the coin payout instead so
// the conversion feels like a reward rather than a letdown.
function buildRevealCard(card) {
  const el = document.createElement('div');
  el.className = `reveal-card rarity-${card.rarity.toLowerCase()} ${card.isNew ? 'is-new' : 'is-duplicate'}`;

  el.innerHTML = `
    <img src="${card.image}" alt="${card.name}" />
    <p class="card-name">${card.name}</p>
    <p class="card-rarity">${card.rarity}</p>
    ${card.isNew
      ? '<span class="new-badge">NEW</span>'
      : `<span class="dupe-coin-badge">+${card.coinsAwarded} coins</span>`}
  `;

  return el;
}

// Shows the end-of-packet summary: new cards count, duplicate coins
// earned, and a button to continue (back to collection book or home).
function showSummary(stage, result) {
  const { duplicateCount, totalCoins } = summariseDuplicates(result.pulledCards);
  const newCount = result.pulledCards.filter(c => c.isNew).length;

  const summary = document.createElement('div');
  summary.className = 'packet-summary';
  summary.innerHTML = `
    <h3>${result.packetType} opened</h3>
    <p>${newCount} new card${newCount === 1 ? '' : 's'}</p>
    <p>${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} (+${totalCoins} coins)</p>
    <button class="continue-btn">Continue</button>
  `;

  summary.querySelector('.continue-btn').addEventListener('click', () => {
    // Navigation is intentionally left to the caller (e.g. the screen
    // that invoked openPacketScreen) rather than hardcoded here, since
    // packets can be opened from multiple entry points (trivia reward,
    // future battle reward) that may want to return somewhere different.
    stage.dispatchEvent(new CustomEvent('packet-opening-complete', {
      bubbles: true,
      detail: result
    }));
  });

  stage.appendChild(summary);
}

export { openPacketScreen };
