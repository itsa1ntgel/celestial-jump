

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
