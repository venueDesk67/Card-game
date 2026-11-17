# EQUINOX: HEAVEN vs HELL

An original anime-inspired browser trading card game. The first complete project build preserves the existing 40-card Aether and Umbra starter set from the `venueDesk67/Card-game` repository and expands the original prototype into a responsive, multi-file game.

## Run locally
1. Download and extract the ZIP.
2. Open `index.html` in a modern browser.
3. No build tools, server, database or paid API are required.

If your phone's file browser blocks local JavaScript, publish through GitHub Pages instead.

## GitHub Pages
1. Upload the contents of this folder (not the outer folder itself) into the root of your repository.
2. Open **Settings → Pages**.
3. Set source to **Deploy from a branch**.
4. Select `main` and `/(root)`, then save.
5. Wait for the Pages deployment to finish.

The expected URL format is `https://USERNAME.github.io/REPOSITORY/`.

## Included
- 20 Aether and 20 Umbra cards, retaining the repository's existing card names, statistics, effect descriptions and effect keys.
- 4000 LP per player, five-card opening hands, five monster zones and five Spell/Trap zones.
- Tribute Summoning, Attack and Defence positions, battle damage and direct attacks.
- Spells, set Traps, selected monster effects, graveyards and deck-out.
- CPU opponent with Easy, Normal and Hard decision profiles.
- Card archive, faction selection, rules screen, responsive duel interface and original local SVG assets.

## Rules notes and prototype limits
- Aether or Umbra may be selected by the player; the CPU uses the opposing faction.
- The first player does not draw on turn one. Each later turn begins with one draw.
- Tribute Summons use the turn's Normal Summon.
- Spell effects resolve immediately and choose the first valid target where targeting is required.
- Set Traps activate automatically when a matching event occurs, beginning the turn after they were set. There is no chain stack or response-priority system.
- Some effect interpretations are intentionally compact for this first build. The UI and rules screen describe the implemented prototype, not a tournament rules engine.
- The CPU uses a heuristic rather than machine learning. Difficulty changes its attack-risk tolerance.
- Sound controls are visual placeholders and report that sound is not included. Multiplayer, deck editing, campaign progression and online accounts are not included.

## Project files
- `index.html`: screens and semantic page structure.
- `style.css`: visual identity, battlefield, card layout, responsive design.
- `cards.js`: 40-card database and artwork metadata.
- `rules.js`: shared rule constants and validation.
- `effects.js`: effect resolution registry.
- `game.js`: central game state and duel engine.
- `cpu.js`: CPU turn logic and difficulty.
- `ui.js`: rendering, controls, menus, dialogs and collection.
- `assets/`: original SVG logos, faction symbols, backgrounds and card illustrations.

## Original content
EQUINOX names, faction concepts and SVG artwork in this package are authored for this project. The original 40-card identity data was preserved from the supplied public repository. Review ownership and licensing before redistributing the project commercially.
