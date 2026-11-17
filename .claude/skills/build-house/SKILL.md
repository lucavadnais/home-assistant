---
name: build-house
description: Model the user's own house for this smart-home dashboard from photos of it, as a hand-crafted 3D scene in src/houses/custom/, so the app shows their home (with clickable room windows tied to Home Assistant) instead of the author's. Use when the user runs /build-house, or asks to build, model, change or refine "my house" in this project.
---

# Build the user's house

This project shows a house as a detailed, stylised 3D scene (React Three Fiber) whose windows light up with the rooms' Home Assistant lights; clicking a window switches its room. The house shipped is the author's home, 6538. This command builds the user's own house **at the same level of detail**, as real scene code written from their photos, in `src/houses/custom/`. When that folder exists the app draws it instead of 6538.

Speak the user's language (default to French: the project and its users are French-speaking). Many users are not developers: keep the conversation about their house, run every command yourself, and don't show them code unless they ask.

Read [modelling.md](modelling.md) before writing any scene code: it holds the conventions, the building blocks you can reuse, how to read photos, and how to estimate sizes.

## Ground rules

- Write only inside `src/houses/custom/`. Never edit the author's model or the shared scene files (`src/scene/`, `src/houses/default/`, `src/houses/index.js`), and never delete anything outside `src/houses/custom/` and `house-photos/` (this command's own files in `.claude/` included): import and reuse. If a shared part almost fits, copy it into `src/houses/custom/` and adapt the copy. This keeps the author's house intact and lets the user pull project updates without conflicts.
- `src/houses/custom/` and `house-photos/` are git-ignored: the user's house and photos never leave their machine through git.
- Deleting `src/houses/custom/` brings the author's house back. Tell the user so the first time you create it.

## Asking the user

Ask with the AskUserQuestion tool, not in a message: the user picks an option or types their own answer in the "Other" box it always adds, instead of writing a reply to a list of questions. Only open-ended requests (add photos, describe what's off) stay in plain text.

- One dialog holds up to 4 questions, each with 2–4 options; ask the rest in a following dialog. Put what you know in the question itself: the user may see only the dialog.
- Offer real candidates, most likely first marked "(recommandé)", worked out from the photos: never a bare list of every possible answer. "Other" covers the rest; don't add an "Autre" option yourself.
- Short headers (12 characters at most): "Façade", "Salon", "Voisins".

What to ask this way:

- **Which window belongs to which room**: one question per Home Assistant area. Options are the 2–3 most plausible windows plus "Pas de fenêtre visible" (its devices stay in the side list). Give each window option a `preview`: a small ASCII sketch of the façade with the windows numbered and that one marked, so the user picks by looking, not by reading a description. Several windows for one room: a multiSelect question (previews only work on single-select, so describe the windows in the options instead).
- **What a photo shows**, when you're unsure: options are the likely categories (front, left side, corner…).
- **Which way the front faces**: the 2–3 bearings the aerial view, shadows or the street suggest, then "Je ne sais pas" (assume south and say so).
- **Neighbours**: e.g. "Les voisins, simplifiés (recommandé)", "Seulement ma maison et mon terrain", "Les voisins en détail".
- **A part no photo shows**: "J'ajoute une photo de ce côté" (then wait for it in `house-photos/`) or "Faites une version plausible".
- **Floors, attached garage, basement**, when the photos leave it open.

If AskUserQuestion isn't available, ask the same questions in one short message, with the options listed for each.

## 1. Get the project ready

- `npm install` if `node_modules/` is missing.
- Home Assistant is optional. If `.env.local` is missing, ask whether they use it; if so, help them create it from `.env.example` (their instance URL, a long-lived access token from their HA profile → Security). Without it the house still works, with no clickable rooms.
- `node scripts/ha-areas.mjs` lists the rooms (Home Assistant areas) as `id<TAB>name`. Exit code 2: Home Assistant isn't reachable; say why and continue without rooms if they want.

## 2. The photos

Photos go in `house-photos/` at the project root. If it's missing or empty, create it and tell the user what helps most, then wait:

- the front façade, straight on (most important), and each side, and the back;
- a three-quarter view or two; an aerial or satellite view (a screenshot from a map works);
- close-ups of the entrance, stairs, balconies, trim, materials;
- for each room they control, a photo where that room's window can be seen;
- the lot around: walk, driveway, fences, trees, and the neighbours if they want them.

Photos must be saved as files in that folder: an image pasted into the conversation can be seen once but can't be kept for later runs.

Then:

1. Look at every photo (Read each image). If one can't be read (HEIC, or too large), ask for a JPEG export.
2. Work out what each photo shows (front, back, left side, right side, corner, aerial, room window, entrance, detail, yard, plan), then ask (see Asking the user) only what the photos leave open: a photo you can't place, which window belongs to which room, which way the front faces (for the sun), the neighbours, a side no photo shows, floors or anything odd (half-buried basement, attached garage, shared wall).
3. Save it all in `house-photos/photos.json` so later runs reuse it:
   ```json
   { "info": { "floors": 2, "facing": "sud", "notes": "…" },
     "photos": [ { "file": "IMG_1234.jpg", "shows": "front", "area": "", "note": "" } ] }
   ```
   If it exists, start from it and only ask about new photos.

## 3. Plan before you build

Work out, from all the photos together (modelling.md → Reading the photos, Estimating sizes): the footprint and volumes, floor heights, the roof, every façade's openings floor by floor, the entrance, the materials and colours, what's around and how far the lot reaches. Write that plan as a short comment block at the top of `src/houses/custom/index.jsx`, with the key dimensions as named constants (like `FRONT`, `FLOOR`, `TOP` in `src/houses/default/RearHouse.jsx`): every position should derive from them, so a correction is one number.

## 4. Build it

Create `src/houses/custom/index.jsx` exporting the house module described in `src/houses/index.js` (name, frontAzimuth, framing, lot, rooms, trees, Model). Split the scene into files by part as 6538 does (`House.jsx`, `Surroundings.jsx`, …) once it grows. Build in passes, checking the render after each (step 5):

1. Massing: volumes, floor lines, roof shape, ground and lot. Get proportions right before anything else.
2. Openings: every window and door, with frames, trim, lintels, sills. Room windows go in `rooms` (drawn by `RoomWindow`); others are `StaticWindow`s.
3. Details: entrance, stairs, balconies, railings, canopies, cornices, chimneys, gutters, materials.
4. Surroundings: walk, driveway, fences, plants, street; neighbours if wanted (with a `Ghost` version for the "Autres bâtiments" setting). Widen `lot` to take in everything you add.

Then `npm run build` must pass.

## 5. Look at your render and compare

You can't get the detail right without seeing what you built. Start `npm run dev` in the background, then look at the scene with whatever browser tool you have (the built-in browser or preview of the Claude desktop app, Claude in Chrome, or a headless browser):

- `http://localhost:5173/?clean&view=front` — panels hidden, front façade face-on. Also `view=right`, `back`, `left`, `corner`, `top`.
- Compare each view with the matching photos: proportions, floor count, window count and spacing per floor, roof, entrance, colours. List the differences, fix the biggest first, look again. Keep going until each façade matches its photo; don't hand back a first draft.
- Check in day and night: the settings (arrow on the weather card) force them; a room window should glow when its lights are on.
- Check the weather: force rain, then snow (same settings). It must fall over the whole scene, on the neighbours and the street as much as on the house; if part of the scene stays dry, `lot` doesn't cover it. In winter, snow must also lie on every roof and on the ground.

If you have no way to see the page, ask the user for screenshots of those URLs.

## 6. Hand it over and refine

Tell the user, briefly: the URL to open, what you assumed or couldn't see (and which photo would settle it), and that they can now describe what's off in their own words ("le toit est à deux versants", "il manque une fenêtre au 2e à droite"). For each correction: change the code, look at the render again, compare with the photos, and only then tell them.

## Sharing it across devices

To deploy their house (for example on a Raspberry Pi that builds from git), the user removes the `src/houses/custom/` line from `.gitignore` in their own clone and commits the folder, or copies it to the device before building. It must never go into the author's repository.
