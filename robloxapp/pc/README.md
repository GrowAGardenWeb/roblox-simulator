# robloxpcapp

Recreation of the Roblox desktop app. Built as plain HTML/CSS/JS first; Electron wraps it into a `.exe`.

- Open `index.html` in a browser to preview (window buttons only work inside Electron).
- `npm install && npm start` runs it as a desktop window.
- `npm run build` creates the Windows installer in `dist/` (run it on Windows, or use the GitHub Action below).
- The GitHub Action `robloxpcapp-exe` builds the `.exe` on a Windows runner and uploads it as an artifact.

Screens done so far: Home (title bar, side bar, header, friends row, banner, recommended games).
