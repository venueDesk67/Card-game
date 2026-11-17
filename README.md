# EQUINOX: Heaven vs Hell

A browser-based prototype of an original two-faction trading card game. Built with plain HTML, CSS and JavaScript so it can be hosted on GitHub Pages.

## Run locally
1. Download and unzip the project.
2. Open `index.html` in a modern browser.
3. No build step or server is required.

## Publish on GitHub Pages
1. Create a new GitHub repository (for example, `equinox-card-game`).
2. Upload `index.html`, `style.css`, `cards.js`, `game.js` and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.
6. Wait for GitHub Pages to publish the site.

## Included
- Two 20-card decks: Aether and Umbra (40 unique cards total).
- Opening hands of five cards and 4000 Life Points per player.
- Five monster zones and five Spell/Trap zones per side.
- Normal Summon once per turn.
- Tribute Summoning: Levels 5–6 require 1 Tribute, 7–8 require 2, and 9–10 require 3.
- Attack and Defence positions, monster combat, direct attacks and Life Point damage.
- Spell and Trap cards, Graveyards, deck-out loss, simple CPU opponent.
- Card effects for the listed cards, implemented as practical prototype interpretations.

## Rules interpretations / simplifications
This is a first playable prototype, not a full tournament rules engine:
- The player controls Aether; the CPU controls Umbra.
- Both opening hands are dealt five cards. Aether takes the first turn without drawing; each later turn starts with one draw.
- A Tribute Summon uses the single Normal Summon for that turn.
- Spells resolve immediately and, where targeting is needed, the first valid target is selected automatically. This keeps the first build simple; a target picker is a next-step improvement.
- Set Traps activate automatically when their listed trigger occurs, beginning the turn after they were set.
- Trap effects are resolved automatically; there is no chain stack or response priority system.
- The card text “once per turn” abilities are implemented where practical, but the prototype does not yet have a full response/chain framework.
- Monster effects for Seraph Guardian, Chaos Reaper, Malgrath and Elysius are activated with the Use Effect control. Their effects are once per turn. Some effects have been interpreted to fit a compact game loop. For example, Heavenly Reversal negates a monster's triggered effect when detected; effects that require choosing among several targets currently use the first valid target.
- ELYSIUS protects other Aether monsters from destruction. The prototype currently protects Aether monsters on the player's side.
- Battle effects and AI choices are intentionally basic.

## Known limitations to address next
- The CPU plays a simple heuristic and is not strategically strong.
- No animations, sound, card art assets, deck editor, mulligan, or multiplayer.
- The initial card set is intentionally fixed; no duplicate cards.
- Several effects currently choose the first valid target automatically rather than opening a target picker.
- The AI's own spells/traps use a simplified resolution path.
- A formal automated rules test suite should be added before expanding the card pool.

## Files
- `index.html`: page layout
- `style.css`: responsive styling
- `cards.js`: 40-card database
- `game.js`: duel engine and interface logic
