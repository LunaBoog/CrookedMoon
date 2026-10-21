# Crooked Moon — Game Boy RPG · Handoff (v8 · Full Moon)

**Written:** Oct 19, 2026 · **Build:** `crooked-moon-gb-v8.html` (≈16.7 MB, single file, runs from `file://`) · **Source:** `crooked-moon-gb-v8-src.zip`

**v8 = Full Moon** (§2d): the big enhancement pass, made for sending to a player from Moon's table. It brings:
- sharper art everywhere, from the 300–400px originals
- new twice-the-detail pixel sprites with real walk cycles
- a staged battle scene with **action commands**
- the Herald of Fools (Moors encounter 4)
- visible time of day in Wickermoor, plus a where-to-go tracker and task stamps
- a Session board
- the speaker's art standing behind the dialog box
- Liar's Dice at a real table
- a Continue card on the title screen
- a shareable **Adventurer's Card** and **The Story So Far** scrapbook

Story, tasks, scoring rules and the save format are unchanged. v7, v6 and v5 saves load. New state lives only in `STATE.v8`, a small stats bag.

**v7 = the glow-up** (§2c): new title screen, a "Which one are you?" start for players from Moon's table, a reworked battle stage, quest tracker + minimap, quest/achievement banners, new type, an HD station platform, settings, postcards. Story content and the save format are unchanged from v6.1; v6 saves load.

**v6.1 = the look pass** (§2b): sharp HD maps from the original VTT pack, outlined sprites so NPCs pop, and the real Ghostlight Express pulling into the station. Gameplay is unchanged from v6.

v6 takes the ON LOCATION v7.3 "way of things" (from `CM New Game/ON_LOCATION_to_CROOKED_MOON_Handoff.md`) and applies it to the Crooked Moon game. There is one big change from that handoff, which Moon asked for: **no three-day structure.** The game follows how the campaign was actually played, session by session, from Session Recaps #1–#8 and `Quests.docx`. After Session 8 it goes into open-ended in-world days ("Between Sessions") that never invent how a thread ends.

---

## 0. READ FIRST

- **The game never plays past the table.** Each open thread plays up to the edge of what the table knows. Then it shows **▸ AT THE TABLE** ("this thread hasn't been played yet"). When a new recap lands, the next session goes into `SESSIONS` and the frontier moves (§6 shows how).
- **The recaps stop at Session 8**, which v5 already covered. So v6 does two things:
  - it puts the ON LOCATION layer onto Sessions 1–8
  - it adds the Between Sessions days, which end at the promised dinner with the Druskenvalds. That dinner is where the real campaign is right now.
- **Saves:** nothing is wiped. New state lives on `STATE.v6`.
  - A v5 save loads, and `sessionFromFlags()` works out which session it's in.
  - ⚠️ Lesson learned: `STATE.x`/`STATE.y` are the player's tile coordinates. Never store anything at `STATE.x`.
- **High scores** live in `localStorage["cm_hiscores"]`. That's outside the `cmgb1:` prefix, so New Game never wipes it.

---

## 1. Decisions log

| Ver | Date | Decision |
|---|---|---|
| v5 | Sep 27 | Sessions 1–8 playable (see v5 handoff, kept in §9) |
| v6 | Sep 30–Oct 1 | ON LOCATION port, with **sessions instead of days**: each recap = one "day" with its task list, auto-logged notes and the end-of-session ritual |
| v6 | | Ritual = **Write Session Recap #N** (tick the real highlights; 3 false rumors are mixed in) → **Quest Log** in Quests.docx format + "by the numbers" + a promise-honesty check → level up if the table did → **"Last Time…"** card |
| v6 | | Sessions end **where the table stopped**: inline breaks in S1 (crash), S3 (marsh haint), S4 (Hand-Taker), S5 (Crooked Man on the porch), S6 (music-room rest) and S8 (back at the inn). S2 and S7 end when their task lists are done (you get a prompt, or it triggers at your next rest) |
| v6 | | **In-world days with no limit.** Every long rest = a new day. Phases: Twilight Hour (canon S2) → Afternoon → Dusk → Night. 150 s of active play per phase; the clock pauses in dialog, menus, battles and minigames |
| v6 | | Pools are **rolled once per day and saved**: villager troubles (27), party calls (28), tonight's Moors encounter, and Eleanor's books |
| v6 | | The diligence lesson is **"Look closer first"** at the table's real touch-it moments: trunks, cabin #2 record, hex bag, effigy on the altar, peacock, oven, bathroom curtain, stuffed bear |
| v6 | | **Promise ledger**, seeded from the recaps' real promises (ours and theirs); the honesty check runs at every wrap |
| v6 | | **Chore** = Eleanor's book hunt (canon S2: "Collect books for her and she will buy them"), not the invented ward candles |
| v6 | | Lifeline = **"Ask Caster — he's very wise"**: 3 per session, −50 each. (Before Caster joins: "Remember Adela's reading") |
| v6 | | **Arcade** final score + initials + top-10 board on the title screen. Scored at "Sessions 1–8" and again at "Through Dinner" |
| v6.1 | Oct 1 | **Maps re-made from the original VTT battlemaps** (no outside image work needed). Same layouts, so grids, exits and NPC spots didn't move |
| v6.1 | | The world renders at screen resolution (render scale RS up to 4×) instead of 480×336 blown up |
| v6.1 | | Sprites stay pixel art but get a dark 1px outline + faint moon rim; maps sit back 12%; on train cars the mist outside the car body is dimmed |
| v6.1 | | Train arrival = the Chapter 8 painting as a cinematic, then the real cars (dining · passenger · tender + loco) roll in on the station rails |
| v6 | | Caster can wander off (a "go find" party call). ⚠️ invented; you can turn it off by deleting the `casterGone` call |

---

## 2. What's new (player-facing)

- **HUD pill:** `📜 S3 5/14 · 🌅 Day 7 Twilight Hour`. Tap it to open the Session tab.
- **Menu tabs:**
  - **Session:** the task list with who each task came from, the session notes, and the recaps you've written
  - **Ledger:** standing with the five factions, promises both ways, a look-closer log
  - **Glossary:** 34 terms, 5e rules plus words of the Hollow
  - **Journal:** now opens with the Quest Log in Quests.docx layout. Purple "▸ at the table" lines mark threads the table hasn't played yet
- **Villager walk-ups:** a named townsperson with **!** walks up to you.
  1. They rant (Mm-hm / Keep listening…, or "Cut in" for −1 standing).
  2. They ask the real question.
  3. You pick one of 3 answers: +2 / +1 / −1 standing with their faction.
- **Party calls:** a PC pulls the leader aside, in their own voice.
  - Some options are literally what the table did.
  - Some calls are **go-finds**: Caster, or the baby goat from the ritual sack. There's no arrow, just a hint.
- **Night encounters:** from the book's **Moors Encounters d8**, with the real **Starting Attitude** dice. An attitude modal shows ≤4 Hostile / 5–8 Indifferent / ≥9 Friendly. Not every encounter is a fight:
  - Boogleswarms want Azareth's teeth (honey cake = Sweet Tooth)
  - a Gobblegeist with a goat (Oswick's wicker star = Repelled by Stars)
  - a Skitterswarm heading for the cemetery (Body Burrowing)
  - a hilltop Old Ways feast
  - scouts
  - a cart
- **Morning card** after a night at the Inn: the day's list, "around town", and Old Rusty's grave count (the cemetery grows every night, canon S3).
- **First-time explainers**, each with a pixel diagram, the rule in a character's voice, a numbered plan, and a goal: sessions, villagers, party calls, look closer, days, the moors, books.
- **Between Sessions:** see §4.
- **Title screen:** HIGH SCORES board, PRESS START, "v6".

---

## 2b. The look (v6.1)

**Why the maps were hard to look at:** v5 baked the VTT maps down to 24 px per grid square, quantized them to 64 colours with dithering, and then the 480×336 canvas was CSS-stretched ~3–4×. Every map was effectively a blurry, dithered thumbnail.

**What changed**
- **Assets** (`tools/build_hd.py`, rewrites `build/assets.js`; previous file kept as `build/assets_v6.js`):
  - Every map comes from `TFL/Assets/Crooked_Moon_-_VTT_Asset_Pack_V2/Maps/Battlemaps/Gridless/WebP/` as WebP. Train cars at 112 px/square, everything else 80 px/square, light unsharp mask, no dithering.
  - Village = `Region Maps/MAP_11_2_Wickermoor_Village.jpeg` (1500×2000); hollow map 1600×1040.
  - `ASSETS.train` = a top-down strip cut from the real car maps (`tools/train_sprite.py`: everything not connected to the image border is the car). Order left→right: dining, passenger, tender + locomotive (nose right). `cars` holds each width.
  - `ASSETS.scene_train` = `Art/Scenes/Adventure/SCENE_Chapter8_Ghostlight_Express.jpeg` at 1280×720.
- **Rendering** (`js/20_hd.js`):
  - `RS = ceil(VSCALE × devicePixelRatio)`, capped at 4. The world canvas, lighting canvas and battle canvas are `VW·RS × VH·RS`; each frame starts with `setTransform(RS,…)`, so all the game code still thinks in 480×336.
  - Map art and monster art draw with smoothing on (`smooth(c,true)`); the pixel people stay crisp.
  - `drawOutlined()` paints each sprite into a small tile, then stamps a dark ring + faint `#f1dca0` rim around it. Shadows go straight to the world (`SHADOW_C`) so they aren't outlined. Turn off with `HD.outline=false` / `HD.rim=false`.
  - **Auto-quality:** if the world averages worse than ~40 fps, RS steps down (never below 2), then the rim turns off.
  - Train cars: `CAR_BODY` (measured from each car's black outline) – the mist outside it is dimmed 50%. The whitish blurred tracks at the car ends are in the original art (the liminal space); they're now dimmed, not removed.
  - The shroud streaks in the cars are fewer and fainter.
- **The arrival** (`cutscene_trainArrives`): whistle → `trainCinematic()` (the painting, slow push toward the lamp, fog, letterbox, "THE GHOSTLIGHT EXPRESS") → `trainPullsIn()` (the strip slides in from the left on rows 8–9 with chugs and teal steam, eases to a stop with the locomotive and its lamp on screen, beam ahead) → the Vagrant.

---

---

## 2c. v7 · The Glow-Up (Oct 10)

Built for sending to a player from the table. Everything is layered on top of v6.1 the usual way (re-assigned function declarations); no story, task or score logic changed.

**New files**
- `js/21_v7_core.js` — loading screen, options (`V7.opt`, saved in `cmgb1:v7opts`), HUD overlay `#hud7` over the world canvas (quest tracker `#trk7`, minimap `#mm7`, "A ▸ Talk" chip `#pr7`), quest banners + achievement pops (toast interception), top-bar party chips (crown = leader, YOU = player), the dialog box (per-speaker voices, narration style, punctuation pauses, YOU tag), iris transitions, run (Shift), postcards (P), title screen (painting + logo), `charSelect` → **"Which one are you?"** (sets `STATE.me`), new-game intro line in the player's PC voice + a How-to-play card, Options tab, new `drawOverlays`.
- `js/22_v7_battle.js` — battle intro bars + BOSS title cards, new `layoutFoes`, typed hit FX (`DMGCOL`), sprite-shatter deaths, lagging HP bars, portrait turn ribbon, turn sweep banner, tumbling d20 (NAT 20 burst / NAT 1 crack / ADV-DIS), victory screen with XP bar, new level-up and game-over cards.
- `js/23_v7_world.js` — footstep dust, new `drawMarkers` (gold diamond + ground ring for the objective, twinkling ✦, animated "…"), additive lamp/fire/jar glows (`LIGHTS7` for painted lamps), the arrival cinematic with the new title card.
- `js/24_v7_menus.js` — Party cards with the PC card art, Bestiary with big monster art, Achievements (was Badges), tab icons, minigames rendered at screen resolution, d20 skill-check modal, autosave chip, new credits (painting backdrop, "starring you as …", cast portraits).
- `js/25_v7_you.js` — **★ You** menu tab (the player's PC: thread of fate, their lore, every logged moment that names them, switch who you are), SESSION COMPLETE banner.
- `css/v7.css` — the whole look (injected at `/*__V7CSS__*/`).
- `tools/paint_station.py` — paints the HD Prologue platform (1600×880, matches the 20×11 grid; rails centred on row 9 so the arriving train sits on them).
- `tools/build_v7.py` — writes `build/assets_v7.js` (logo, title painting, station) and `build/fonts_v7.css` (embedded fonts).
- `art_v7/` — `cm_logo.png` + `title_bg.png` (from `tableforgelite/public/cm_logo.png` and `bg.gif`), font files.

**Type** (all SIL OFL, embedded): IM Fell English SC = titles/names · Jacquard 24 (pixel blackletter) = only big flourishes, **never all-caps** (its capitals are unreadable) · Pixelify Sans = UI + dialog, with **Jersey 10 digits** swapped in via `unicode-range` (Pixelify's 8 reads as S) · Silkscreen = tiny labels · IM Fell English = parchment docs. Ligatures are off (Pixelify's "fi" is broken).

**Keys:** Shift run · T expand tracker · N minimap · P postcard · everything else as before. DM Screen (`) is still visible (Moon's call).

**State:** `STATE.me` (the player's PC; old saves default it to the leader). Options live outside the save (`cmgb1:v7opts`), so they survive New Game.

**Decisions**

| Decision | Why |
|---|---|
| Friend is a player at the table → New Game asks "Which one are you?" and the game marks that PC as YOU everywhere | Moon, Oct 9 |
| Desktop browser first; phone layout kept working | Moon, Oct 9 |
| DM tools left visible | Moon, Oct 9 |
| ⚠️ Invented: one opening line per PC (`ME_LINE`), short PC hooks on the select screen (`PC_HOOK`) | connective tissue in each PC's established voice; edit freely |

---

## 2d. v8 · Full Moon (Oct 19)

Layered the usual way (re-assigned function declarations, five new files). Nothing in js/00–25 was edited.

**New files**
- `js/26_v8_art.js` merges `ASSETS_V8`, which `tools/build_v8_art.py` writes into `build/assets_v8.js`, into the old keys:
  - `mon` → `IMG["mon:*"]`: painted monster art, 300px WebP
  - `por` → `IMG["por:*"]`: 128px pixel busts (64 colours, drawn crisp)
  - `pc` → `IMG["card:*"]` / `IMG["pc:*"]`: 400px cards and 128px busts
  - `npc` → `IMG["npc:*"]`: full-body / bust NPC art, 300px (used in dialog, cast and card)

  `build.py` strips the old 64/120px copies out of `assets.js`, so they never ship twice. Source art is `Crooked Moon/_build/src/{mon,npc,pc}`.

  Rebuild: `python3 tools/build_v8_art.py "<…>/Crooked Moon/_build/src"`. Hand-tuned bust crops are in `CROP`.
- `js/27_v8_sprites.js` is the new pixel people.
  - Each look, facing and walk frame is painted once into a cached 40×64 "art pixel" canvas.
  - `SPR8.S=.75`: one art pixel is ¾ of a world pixel, so 3×3 screen pixels at 4× render scale.
  - Three-tone hue-shifted shading, real side and back views, a 4-frame time-based walk, blinking. NPCs animate while they slide between tiles.
  - **The PCs are bespoke, matched to their card art.** Azareth has a jack-o'-lantern head, a crooked witch hat and a scythe. Lucky has a skull, long hair, a pirate hat and a pistol. Poppi has porcelain skin, red/black pigtails, a ruff and harlequin diamonds. Krodha has a brown hood and robe, staff and gourd (the card is brown, not green). Tessie has teal scales, a fin crest, a bow and a quiver. Caster is a ghost greyhound.
  - Everyone else is built from the unchanged `LOOK` params (hair styles, hats, apron, scarf, beard, glasses, pipe, cane, pigeon, wheelchair, child/tall/wide).
  - `drawChar8Big(c,x,footY,look,dir,{scale,frame})` draws a sprite with a baked outline, for battles, cards and Liar's Dice.
  - **Options ▸ Character sprites ▸ CLASSIC** brings the v5 renderer back (`SPR8.old`).
- `js/28_v8_battle.js`
  - **Action commands** (`actPrompt8`, Options toggle, on by default):
    - **STRIKE.** On a PC attack roll, a ring closes on the target. PERFECT (±60ms) gives advantage on that roll ("Inspired"); GOOD (±140ms) gives +1.
    - **BRACE.** When a monster's attack hits a PC, PERFECT halves the damage and GOOD takes 2 off (`_brace` → `dealRaw`).
    - No press means the dice alone decide. The bot and fast pacing time out cleanly. The first 4 uses show "press A as the rings meet".
  - **The stage:** a soft-focus location backdrop (pre-blurred once per battle), light rays tinted per location, two layers of ground fog and drifting motes. The party is drawn big (1.42×) and outlined; the active hero steps forward walking. Caster sits at Tessie's feet.
  - **Wolves** use the Hypnovulfen art, greyed for the pack. The six procedural monsters are repainted: peacock, clock, feast, tablecloth, bath and supplicant (`PAINT_PROC8`).
  - **Moors encounter 4: the Herald of Fools.** The text and attitude dice come from Wickermoor Hollow: Encounters, and the art is from the pack.
    - Secret **Endless Footwork** (DC 20 Religion). In battle, any PC can try "pin its feet" (Athletics DC 14): restrained, plus 20 necrotic.
    - Hostile: fight / grab its ankles / back away. Indifferent: watch (learn the secret). Friendly: Lucky plays (Performance 13).
    - ⚠️ The two Warrior Veterans have no art. They're narrated and collapse when the Herald is beaten or stopped.
- `js/29_v8_world.js`
  - Markers sit above the taller sprites.
  - **Time of day** (Options toggle):
    - Twilight is a warm soft-light, Dusk is amber, Night is a cool multiply.
    - Window glows on every village building at Dusk and Night (from `VBLD`).
    - Fireflies in the village after dusk and always in the woods.
  - **Tracker "where":** a compass arrow and "12 steps" / "next door · X" / "2 areas away" (BFS through exits).
  - **Task stamps:** the `✓ … a/b` gold toasts become a wax-seal card under the tracker with a progress bar (moved to the bottom on phones).
  - Quest banners wait for the place-name banner and for battles to end, so they no longer stack.
- `js/30_v8_menus.js`
  - **Session board:** chapter-art header, progress ring, an UP NEXT card (the objective, its NPC portrait, where to go), and To do / Optional / Done cards with the portrait of whoever asked (`porFor8`).
  - Options ▸ v8 toggles.
  - **Liar's Dice at a table:** wood, felt, cups, ivory dice, the Wainwrights seated, a bid plaque. The rules are unchanged.
  - Vignette and grain on every minigame.
  - **Title Continue card:** who, level, session, place, play time.
  - **The speaker stands behind the dialog box.** It uses the full NPC art and replaces the box portrait while shown. There's an Options toggle; it's hidden on phones.
  - **Adventurer's Card:** a 1080×1350 PNG with the card art, name, "played by" (latest arcade initials), grade and score so far, 10 stats and a random moment from the notes that names the player's PC. It's under ★ You, Options, and a button on the arcade screen.
  - **The Story So Far:** a scrapbook with one parchment page per session and its notes. It's under ★ You, Session and Options.
  - Credits get a **YOUR RUN** block.
- `css/v8.css` is injected at `/*__V8CSS__*/`, and `assets_v8.js` at `/*__ASSETS8__*/`.


**v8.1 · Oct 20 (Moon's request): free walking + doors on A** (`js/31_v8_explore.js`)
- In **Wickermoor Village**, buildings and tree lines no longer block. `MAPS.village.grid` has every `#` cleared at load, so only the map edge, people and solid props stop you.
- **Every exit is now entered with A, Space or Z**, never by walking into it. This covers doors, train couplings and paths off a map.
  - Stepping onto an exit just puts you on the doorstep.
  - A works while you're standing on the exit or facing it.
  - The prompt chip reads `A ▸ ENTER / GO / LOOK <place>`.
  - Locked ways still give their reason, and a ★ event on an exit still fires first.
  - Hidden, still-locked secret ways stay solid.
- `tryMove` is re-assigned without the old exit branch. `facedEntity` falls back to `{type:"exit"}`, and `interact` routes that to `useExit8`.
- The bot uses `warp()`, so it is unaffected.

**State:** `STATE.v8 = {acts, perfect, braces, stamps, cards}` (display only, not scored). Options live with the v7 ones as `v8_*` keys in `cmgb1:v7opts`.

**Decisions**

| Decision | Why |
|---|---|
| Big enhancement pass for sending to a player | Moon, Oct 19 |
| Action commands map onto 5e: PERFECT = advantage, BRACE = resistance | keeps the dice honest; toggle off for pure dice |
| Herald of Fools added now that the pack has its art | closes the old "entries 4/7 reroll" gap (7, the headless centaurs, still rerolls) |
| ⚠️ Invented: the Herald scene's choices and lines, the veterans' fate, the Friendly-Lucky tune | connective tissue; edit freely |
| Krodha's sprite follows his card (brown robe), not the v5 green | the card is canon art |

---

## 3. Content by session

**Tasks** are `done()` checks on v5 flags. ✱ = optional. **Recap** = the false rumors mixed into that session's recap.

| S | Title (recap date) | Ends at | Tasks | Recap |
|---|---|---|---|---|
| 1 | The Mists and the Ghost Train (Dec 24, 2025) | Crash: "giant gaping mouth. Boss battle time." | board · crooked passenger · seal crack✱ · meet Druskenvalds · tarot✱ · 6 spirits✱ · Harlequin · furnace | 6 rumors |
| 2 | Fight the Train · Wickermoor (Feb 15) | After the four shops (prompt) | Level 2 at start ("We all level up before the fight"). jars · loco · reward · pine✱ · escort · wolves · mayor · night at inn · board · Trading Post · Bookstore · Tailor · jacket✱ | 6 |
| 3 | Masonry, Hex Bag & Wytchwood (Mar 7) | Marsh haint + Goodberry | mason · finger · identify · church · Taylor farm · note✱ · Morgan · Eleanor · Hilda · map · Wytchwood · body · camp · river · marsh | 6 |
| 4 | Deeper into the Woods (Apr 7) | Hand-Taker dies → "roll for long rest next session" | graves✱ · gate · bowls · chalk✱ · alchemy✱ · smoke · boss | 5 |
| 5 | Out of the Woods · Back to Town (Apr 21) | The Crooked Man on the porch | loot/solve · walk back (+5 days) · Doris · jacket✱ · cloak✱ · destroy hex · weasels · effigy→Eleanor · Green Queen✱ · Grey✱ · Randall · Jenkins✱ · manor | 5 |
| 6 | Crooked House · Ground Floor (May 5) | Rest in the Music Room | portraits✱ · peacock (Gem) · spirit board · Petunia (Cup) · oven✱ · feast✱ · harpsichord (Key) | 5 |
| 7 | Crooked House · Upper Floor (Aug 12) | Floor 3 opens (prompt) | mirror✱ · clock · Sally (Doll) · bathroom✱ · journal✱ · Filthy Jasper · balcony✱ | 5 |
| 8 | Crooked House · The Attic (Sep 17) | Back at the inn, level 5 → arcade "Sessions 1–8" → Between Sessions | trophy room (Pin) · library✱ · Whisp✱ · nursery (Bear) · trapdoor · runes · Vessla | 5 |

There are **110 canon highlight lines** (`NOTE_FLAGS`). Each is tied to its canonical session (`NOTE_SESSION`), so a recap always contains exactly that session's events, even if you wander ahead before wrapping.

---

## 4. Between Sessions (the S9 slot): the frontier

These are built only from Quests.docx and the end of Recap #8. ▸ = stops at the frontier.

| Task | Plays up to… |
|---|---|
| **Dinner with the Druskenvalds** | The invitation arrives "in a few days": default Day(S8 end)+3 ❓. It comes by mailbox if you have one, otherwise under the Inn door. Walter waits at the manor gate (at Dusk). At dinner Phillip sets down a book marked **PATRINI**, then ▸ "that's the next session at Moon's table" → arcade "Through Dinner" → credits |
| Get a mailbox | Fully playable (Theodora, 5gp) |
| Tell Randall the weasels are handled | He confirms the Foxwillow lift. ▸ when the cart rolls (the promise stays open) |
| Tell Eleanor what Poppi found | The curse book, plus Lethica if Azareth read it. ▸ Azareth's answers still need time |
| Finneas's Grey notes | Ask, wait 2 days, get the notes (restates canon S3/S5 only). ▸ Edwardia |
| Check the Taylor farm | Your note is still there. ▸ the Taylors haven't come back |
| Weasel-pelt belt✱ | Canon desire (S6). Thomasin, 10gp, pick up the next day |
| Rusty's count ×3 days✱ | ▸ Maidenmist |
| Bakery cellar after dark✱ | Scratching, maybe giggling. ▸ |
| Ask Alda about the cook✱ | ▸ |
| Ask Morgan the way to Memory's Rest✱ | ▸ |
| Bard Lucky plays the Green Queen✱ | Harpsichord minigame, tips |
| Eleanor's books ×3✱ | Daily chore |

After dinner the days just keep going: new rolls, books, night encounters.

---

## 5. Registries & state

**Files:**
- `js/13_sessions.js`: `SESSIONS[1..9]`, `NOTE_FLAGS`, `NOTE_SESSION`, `RUMORS`, `sessionBreak(n,{noCard})`, the ritual (`openRecapComposer`, `openQuestLog`, `openSessionCard`), the NEXT UP override, the HUD pill, the Session tab.
- `js/14_days.js`: `PHASES`, `rollDay`, `ensureSched`, `daysTick`, `VISITORS` (`spawnVisitor`/`bfsStep`), walk-ups (`runTrouble`/`answerQ`), `runCall`, go-find (`HIDEOUTS`), night roamers (`attitudeModal`/`runRoamer`), `openMorning`, the books.
- `js/15_pools.js`:
  - `PERSONA` (25 townsfolk)
  - `TROUBLES` (27)
  - `CALLS` (28: 4 on the train, 15 in the village/anywhere, 5 in the house, 2 in the woods, 2 go-finds)
  - `ROAMERS` (Moors d8 entries 1, 2, 3, 5, 6, 8; 4 and 7 reroll because there's no art yet)
  - new MON (boogleswarm, skitterswarm, gobblegeist, oldwayschosen), with secrets and ENC
  - wicker star + the Wickery shop
  - `BOOK_TITLES`
- `js/16_ledger.js`: standing (`FACTION_NAME`), `promise`/`keepPromise` + `PROMISE_FLAGS`, `lookCloser()` + the 8 wrapped canon moments, `EXPLAIN` + `drawExplainer`, `GLOSS` (34) + `learnTerm` hooks, the Ledger/Glossary tabs, the 14 new badges.
- `js/17_downtime.js`: Quests.docx alignment (main/other, `frontier` strings, new quests: checkins, troupe, bloodycup, dinner), `frontier()`, `DOWNTIME_TASKS`, the townsfolk hooks, Walter + `dinnerFrontier()`, the green-scarf attunement at S7 (canon).
- `js/18_score.js`: `finalScore(arc)`, `showArcade(arc)` (a Promise), `cm_hiscores`, the title board, credits text.
- `js/19_dm.js`: DM Screen sections, `applySessionPreset(n)`, `window.DAY` / `window.V6` hooks.
- `js/99_boot.js`: `boot()` (moved out of 12_game so the layers install first).

**Edits to v5 files:**
- 04/06/07: `sessionBreak` calls
- 06: the altar look-closer, +5 days on the walk back
- 07: the S8 ending → arcade → Between card, plus the `readLibrary` flag
- 05: Poppi's finger only if she grew one
- 09: extensible menu tabs (`MENU_TABS` / `MENU_HTML` / `MENU_WIRE`)
- 12: `boot()` removed

**`STATE.v6` fields:**
- `session`, `wrapped{}`, `snooze{}`, `sessStart{}`
- `day`, `phase`, `phaseT`, `clockT`, `sched`, `fired`, `cd`, `roll{day}`
- `notes[]` (each `{s,day,cat,icon,text,key}`)
- `heardIds`, `callIds`, `heard`, `best`, `cut`, `calls`, `callsBest`
- `look{id:{looked,did,catch,blind,reveal}}`
- `promises{id:{text,who,by,s,day,kept}}`
- `standing{village,oldWays,patientLady,brightsingers,newcomers}`
- `hints{session}`, `recaps{n}`, `honest{n}`
- `books`, `bookBag`, `booksDay`
- `gloss`, `explained`
- `goFind`, `casterAway`, `casterFound`, `goatFound`
- `roamers`, `metRoamerDay`, `nightsSurvived`
- `graves{day}`, `done`, `scored{arc}`, `hsT`
- `tableLog[]`, `dinnerDay`, `dt{}`

**Hook pattern:** each layer reassigns function declarations, the same way ON LOCATION does:
- `setF`, `giveKey`, `badge`, `learnLore` → `onFlag` → notes, promises, standing, glossary
- `objective`, `objectiveTarget`, `updateHUD`, `restParty`, `warp`, `drawLighting`, `drawWorld`, `drawProp`, `loop`
- `check`, `attackRoll`, `saveRoll`, `addSt`, `battle`, `learnSecret`
- `showTitle`, `rollCredits`, `openScorecard`, `renderDM`, `applyPreset`, `loadGame`, `freshState`
- TALK wrappers in 16 and 17

**Score (`finalScore`) rows:**

| Row | Points |
|---|---|
| Session tasks done / missed (wrapped sessions only) | +100 / −75 |
| Optional tasks | +60 |
| Between Sessions tasks | +100 |
| Spirits helped | +150 |
| Heirlooms | +100 |
| Recaps written | +100 |
| Highlights remembered | +20 |
| Perfect recap | +200 |
| Rumors written down as fact | −40 |
| Honest about promises | +100 |
| Promises kept | +100 |
| Villagers: best / heard / cut off | +75 / +25 / −40 |
| Party calls (plus +40 per best answer) | +30 |
| Looked closer / took blind | +40 / −60 |
| Books for Eleanor | +50 |
| Caster found / goat found | +100 / +100 |
| Nights on the moors | +50 |
| Secrets | +50 |
| Bestiary | +25 |
| Badges | +40 |
| Lore + glossary | +10 |
| Battles won | +30 |
| Nat 20s | +20 |
| Party members downed | −40 |
| Standing | ×10 |
| Best-answer accuracy | ×500 |
| Caster hints used | −50 |

**Grades ("Through Dinner"):** S ≥ 19,500 · A ≥ 16,000 · B ≥ 12,500 · C ≥ 9,000. The "Sessions 1–8" arc uses ×0.9.

**Calibration (play7 bot):** the bot does every task, writes perfect recaps and answers honestly, but hears only one villager and makes one party call. It scores ≈17,200 at Sessions 1–8 and ≈18,900 through dinner. Both are **A**. An S needs the Hollow too: villagers, calls, books, nights.

---

## 6. Keeping up with the real campaign: adding Session 9 when the recap lands

1. Build the new content the usual way (maps, TALK, EVENTS) in a new `js/2x_session9.js`. Set flags for its milestones.
2. In `SESSIONS`:
   - Turn index 9 into the real Session 9: title, recap date, `last`, the `quests` from the recap header, and `tasks`.
   - Move "Between Sessions" to index 10.
   - Update `S_FLAGS` / `S_SPOT` / `S_LVL` in 19_dm and the dinner frontier (17) so dinner becomes the real scene.
3. Add `NOTE_FLAGS` lines for its highlights, with `NOTE_SESSION` entries, and add `RUMORS[9]`.
4. Put an inline `await sessionBreak(9)` where the table stopped, or let the task list end it.
5. Move each ▸ frontier string in `QUESTS[*].frontier` / `frontier()` calls forward to what the table now knows.
6. Between real updates, the DM can jot "what we did tonight" in **DM Screen ▸ Table Log**. It shows in the Quest Log.

---

## 7. Canon check

### ✅ Canon

- **Session spine:** all session titles/dates (recap file dates), session end points, quests lists, highlight lines and promises → Recaps #1–#8.
- **Quests.docx:** main/other split, Places to Visit.
- **Twilight Hour (S2):** "Each hex = 6 mi; two a day" (S3); the cemetery grows each night (S3).
- **Promises and wishes from the recaps:**
  - Randall's lift (S5)
  - Eleanor's accord and the book collecting (S2)
  - Finneas's compilation (S5)
  - Azareth's belt wish (S6)
  - dinner "in a few days" + the Patrini book (S8)
- **The book's own data:**
  - Moors Encounters table + Starting Attitude rules (Wickermoor Hollow: Encounters)
  - Boogleswarm / Skitterswarm / Gobblegeist / Old Ways Chosen secrets (monster cards)
  - Factions & NPCs (personas, kids' names, factions)
  - NPC Name Generator (Edith Finch, Grover Haggard, Molly Reeves, Nigel Pilkington, Matilda Stubbs, Clara Wolcott, Wilbur Gower)
  - Oswick's "candles AND wickerwork"; the Wicker Vigil (ch. 12 title)
- **The table's own moments:**
  - Lucky's naked casing of the Trading Post, "sleepy" vs "festive", elections and the duel, "Who are the dirtiest louts", Krodha's evil twin and wolf disguise
  - Tessie too shy for Hilda, Azareth oversharing to Eleanor
  - the goat
  - Azareth's mouth full of teeth, Krodha's disfigured face
  - "Remember the 3rd", Lucky and Krodha gambling so Krodha can eat the sin (S7)

### ⚠️ Adapted or invented connective tissue

- The villager rants' specific wording and answer options.
- Siv's rat-buyer ("hood up, coppers").
- Grover's fiddle in the fog.
- Nigel's "tracks from the west".
- Gobblegeist / scouts / cart flavor lines.
- Monster stat blocks (simplified).
- Book titles.
- Rusty's numbers (212 + 1–3 a night).
- Finneas's two-day delay; the belt price.
- Dinner set dressing (candles, PATRINI on the spine).
- Caster wandering off.
- The baby goat being found, and its four fates.
- The "Lucky keeps his clothes on" promise.
- Morgan forgetting to go to Memory's Rest herself.
- Trap DC 10 if you looked closer at the oven.
- Hex bag "toothache" flavor if grabbed blind.

### ❓ Moon decides

- **Dinner timing:** default Day+3. DM ▸ "Send the dinner invitation now" works anytime.
- **Should Caster wander?** On by default.
- **Performance Troupe / Bloody Cup dates:** kept as "soon"; their quests show "date unknown".
- **Is Memory's Rest the sanatorium on Moonsong Lake?** The encounter table implies it. Morgan only says "west-northwest".
- **Does Randall (a cultist in the book) ever actually drive the cart?**
- **Rules-literacy party calls** (5e teaching): not added. The Glossary covers terms passively.

### Content warnings, as handled on-screen

- **Ch. 2:** community/religious conflict. The hilltop feast's sacrifice stays off-screen ("you wish you hadn't"). Harm to animals: the goat, implied.
- **Crooked House:** unchanged from v5 (implied).
- **Krodha's disfigurement call:** written supportively. The choice is his.

---

## 8. Validation (Oct 19 · v8)

- `build.py` OK (16.7 MB). `validate.js`: 0 errors / 0 warnings (35 monsters, 29 encounters, 7 roamers).
- `play7.py` full run (S1→S8→Between→dinner→arcade ×2→credits): **0 page errors**. Two runs scored 17,315–17,355 at Sessions 1–8 and 18,785–19,085 through dinner, all A, the same range as v7. The bot's battles go through the action-command prompts.
- `compat.py`: a v5 save loads.
- Screenshot sweeps at 1280×860, 1366×768, 1920×1080, 1024×700 and 390 px @3×. They covered:
  - title + Continue card, intro, station, village at day, dusk and night, dialog with the standing figure
  - Session board, Options, Story So Far, Adventurer's Card PNG
  - Liar's Dice
  - battles: wolves, feast + tablecloth, peacock, Herald of Fools
- FPS in headless Chromium is 53–60.

### v7 (Oct 10)

`build.py` OK (13.9 MB) · `validate.js` 0/0 · `play7.py` full run (S1→S8→Between→dinner→arcade×2→credits) **0 page errors**, 194 steps, scores in the v6 range (17,325 / 18,755, both A) · `compat.py` v5 save loads · screenshot sweeps at 1280×860, 1366×768, 1920×1080, 1024×700, 390 px: title, character select, intro, station, train arrival, cinematic, battles (wolves, Hand-Taker boss card, victory), every menu tab, recap composer, quest log, arcade, credits, Liar's Dice.

### Earlier (Oct 1)

**v6.1:** `build.py` OK (12.9 MB) · `validate.js` 0/0 · `play7.py` full run 0 page errors on the HD build · `shots_hd.py` / `shots_train.py` / `shots_m.py` (390 px @3×) checked: station cinematic, train pull-in, every car, village, house, battle.

**v6:**

- `python3 build.py`: `node --check` OK on the bundle and the embedded script. 5.16 MB.
- `node validate.js`: 0 errors / 0 warnings. v6 checks:
  - personas/looks exist
  - every trouble and call has **exactly one** best answer
  - call `where` values are valid
  - go-find hideouts are walkable
  - roamer ENC exists
- `play7.py` (new, **supersedes play4/play6**): new game → all of S1 (every spirit, look-closers) → … → S8 → arcade saved → Between Sessions (walk-up, party call, night roamer, Caster go-find, mailbox, Randall, Eleanor, Finneas ×2 days, Taylor note, Morgan, Alda, belt, Rusty ×3 days, bakery at night, invitation in mailbox) → dinner → arcade saved → credits.
  - All 8 recaps written. Both arcade entries are on the board.
  - **0 page errors.**
  - Minigames are stubbed in the bot; v5 tested them.
- `compat.py`: a v5-style save with no `v6` block loads, and its session is derived (S5 for the "Up the hill" state). 0 errors.
- `shots.py`: screenshots of every new screen, including 390 px mobile (session card, world, explainer, arcade). Layout holds.
- play4/play6 still run with no errors. play6 can't finish the house, though: it presses Esc at the new look-closer modals, which by design = "leave it". Use play7.

---

## 9. Build

```
unzip crooked-moon-gb-v8-src.zip -d cm && cd cm
python3 tools/build_v8_art.py "<…>/Crooked Moon/_build/src"   # only if the portrait/monster/PC art changed (assets_v8.js is in the zip)
python3 tools/build_v7.py   # only if art_v7/ or the station changed (python3 tools/paint_station.py build/station.webp first)
python3 build.py            # concatenates js/*.js (sorted) + build/assets.js + v7 assets/css/fonts into build/crooked-moon-gb.html
node validate.js            # static checks
python3 play7.py            # full E2E (Playwright; pw.py opens file:///home/claude/cm/build/… — edit the path)
```

`build/assets.js` (the HD VTT art) is included in the zip. To regenerate it: `python3 tools/build_hd.py "<…>/TFL/Assets/Crooked_Moon_-_VTT_Asset_Pack_V2"` (it loads the existing assets.js for portraits/monsters/PCs and replaces maps + adds the train art). The old dithered pipeline is `tools/build_assets.py`.

**DM Screen (`)** now has:
- **SESSIONS:** jump to S1–S8 or Between; Wrap this session now
- **WICKERMOOR DAYS:**
  - today's roll
  - advance time of day; next day
  - reroll the pools
  - fire a walk-up / party call / night encounter / go-find
  - send the dinner invitation
- **TABLE LOG**
- **SCORE:** arcade preview; clear the board (two clicks)

The v5 presets still work too.

---

## 10. Next ideas

- Session 9 itself, once the recap lands (§6).
- Art for Moors entry 7 (headless centaurs). Entry 4 (Herald of Fools) is in as of v8.
- Action-command variants for spells and saves (a "focus" ring for concentration?).
- Hand-drawn pixel sprites for named NPCs (Eleanor, Hilda, Morgan…) beyond the LOOK-param ones.
- A Wytchwood-table version of the night roamers for the woods.
- Mail as a channel: letters from Eleanor and Randall in the mailbox.
- A shared high-score board via the TableForge Pi (Node + Socket.IO + sql.js are already there).
- Optional 5e rules-literacy party calls.
