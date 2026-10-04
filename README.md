# Witness the Fitness

A simple training and diet plan app that lives on your phone.

- **Your plan, your phone.** Everything is saved on the device you use. No accounts, and nobody else can see or change your plan.
- **Edit anything.** Tap **Edit plan**, tap any text to change it, add or remove exercises, meals, options and recipes, then **Save**.
- **Works offline.** Once opened, it works at the gym without signal.
- **Backups.** **Menu → Export backup** saves your plan as a file. **Restore backup** loads it on another phone.

## Install on your phone

Open the app link, then:

- **iPhone (Safari):** tap Share, then **Add to Home Screen**.
- **Android (Chrome):** tap ⋮, then **Add to Home screen** (or **Install app**).

It then opens full screen like a normal app.

## Hosting

The app is plain HTML, CSS and JavaScript with no build step, served by GitHub Pages from the `main` branch.
To publish changes, push to `main`. When you change any file, bump `CACHE` in `sw.js` (e.g. `wtf-v2`) so installed copies pick up the update.

## Files

| File | What it does |
|---|---|
| `index.html` | Page shell |
| `app.js` | Rendering, editing, saving and backups |
| `templates.js` | The example and blank starting plans |
| `styles.css` | Look and feel, light and dark |
| `sw.js` | Offline support |
| `manifest.webmanifest`, `icons/` | Home-screen install |
