# EQUINOX QA / TEST REPORT

## Static checks performed during generation
- [x] Project structure generated.
- [x] 40 unique card IDs included.
- [x] Exactly 20 Aether and 20 Umbra cards included.
- [x] Required HTML, CSS and JavaScript files included.
- [x] Script order and relative asset paths authored for GitHub Pages subpaths.
- [x] SVG assets generated locally; no external image hosting required.
- [x] JavaScript syntax checked with Node.js after generation.

## Gameplay checks
- [x] Node.js engine smoke test: database counts, opening hands, starting LP, Normal Summon, direct attack damage, turn progression, two-Tribute Level 8 summon, Tribute-to-Graveyard handling and deck-out.
- [x] JavaScript syntax check passed for all six scripts after final corrections.
- [ ] A complete real-browser duel has not been manually played in this generation environment.
- [ ] Physical Android/iPhone touch testing remains outstanding.

Do not interpret the passing engine smoke test as proof of exhaustive browser QA.

## Known limitations to address in future versions
- No chain stack, response priority or manual Trap response window.
- Spell targeting currently uses the first valid target.
- CPU strategy is heuristic and intentionally lightweight.
- The Hard profile evaluates risk more carefully but is not a search-based AI.
- The UI's sound toggle is a placeholder; no sound assets are included.
- No multiplayer, persistent collection, deck builder or campaign.
- Full cross-device touch testing remains to be performed on physical devices.
- A complete duel should be tested in Chrome and Firefox after deployment.

## Manual acceptance checklist
- [ ] Start a duel with Aether.
- [ ] Start a duel with Umbra.
- [ ] Confirm 4000 LP and five opening cards.
- [ ] Summon a Level 1–4 monster.
- [ ] Tribute Summon Level 5–10 monsters with the correct number of Tributes.
- [ ] Change battle position.
- [ ] Attack Attack Position and Defence Position monsters.
- [ ] Make a direct attack.
- [ ] Activate each Spell.
- [ ] Set each Trap and verify its trigger.
- [ ] Use manual monster effects.
- [ ] Complete several CPU turns at each difficulty.
- [ ] Verify LP victory and deck-out.
- [ ] Verify the victory screen and new-duel reset.
- [ ] Test 360px, 390px, 430px, tablet and desktop widths.
- [ ] Verify no CSS, JS or SVG asset returns a 404 on GitHub Pages.
