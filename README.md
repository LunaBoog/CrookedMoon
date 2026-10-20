# The Crooked Moon · The Ghostlight Express

A pocket, Game Boy–style RPG of Moon's *Crooked Moon* D&D table. It follows Sessions 1–8 and the Between Sessions days, then stops where the real table stops.

**Play:** open `docs/index.html` in Chrome. It's a single self-contained file that runs from `file://` with no internet needed. If GitHub Pages is on, use the Pages link instead.

**Current build:** v8 · Full Moon.

## Build from source
```
python3 build.py        # concatenates js/*.js + build assets/css/fonts → build/crooked-moon-gb.html
node validate.js        # static checks
python3 play7.py        # full end-to-end bot run (Playwright)
cp build/crooked-moon-gb.html docs/index.html
```
See `CROOKED_MOON_GB_HANDOFF.md` for the full design and registry notes.

Campaign, maps, monster and NPC art: *The Crooked Moon* by Avantris (VTT Asset Pack). Fonts are SIL OFL.
