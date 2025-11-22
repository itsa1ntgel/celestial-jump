

## Running the app

```bash
npm install
npm run dev
```

## Building the app

```bash
npm run build
```

## Pushing changes to GitHub and triggering Netlify

Follow these steps if you are not comfortable with code. You only need to paste the commands as shown.

1) **Find your GitHub repo URL.** In your browser on GitHub, click the green **Code** button and copy the HTTPS URL (it looks like `https://github.com/<your-username>/<your-repo>.git`).

2) **Add the GitHub remote once.** Paste the URL you copied into this command and run it in the project folder:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   ```

3) **Confirm you are on the `work` branch.**
   ```bash
   git branch --show-current
   ```
   If you see something else, switch with `git checkout work`.

4) **Push the branch to GitHub.** This sends your latest commit to GitHub and is what Netlify watches for new deployments.
   ```bash
   git push -u origin work
   ```

5) **Check Netlify.** Netlify should start a new deploy automatically. If it does not, open your site in Netlify, go to **Deploys**, and click **Trigger deploy**.

## Seeing JSX correctly in VS Code

If JSX looks broken (red squiggles or plain-text) in VS Code, try these steps:

1) Open the project folder in VS Code (File → Open Folder → select this `celestial-jump` folder).
2) Confirm the file extension is `.jsx` (for example `CelestialJump.jsx`).
3) In the bottom-right of VS Code, click the language mode and pick **JavaScript React (JSX)**. This tells the editor to treat the file as JSX.
4) Install the **Prettier** extension (by esbenp) if prompted; the project auto-selects it for formatting.
5) If the language mode still is wrong, reload VS Code (`Ctrl/Cmd+Shift+P` → **Reload Window**). The `.vscode/settings.json` file in this project forces `.js` and `.jsx` to use the JSX-aware mode.
