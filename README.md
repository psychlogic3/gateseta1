# PsychLogic · GATE 2027 Psychology Mock Test Series · Set 1 (Mocks 1–5)

## What is in this repository
| Path | What it is |
|---|---|
| `index.html`, `css/`, `js/`, `assets/` | The test portal |
| `data/config.js` | Test names, unlock dates (IST) and the 10 student access codes |
| `data/mock-1.js` | Mock 1 (already open) |
| `locked/mock-2.js.enc` … `mock-5.js.enc` | Mocks 2–5, **encrypted**. Nobody can read them before their date. |
| `scripts/build.js` | Builds the website and unlocks each paper on its date |
| `.github/workflows/deploy.yml` | Runs every day at 10:00 AM IST (plus a 10:30 AM backup) and publishes the site |

## One-time setup (about 10 minutes)
1. **Create the repository.** On GitHub: **New repository** → name `psychlogic-gate-set-1` → **Public** → *Create repository*.
2. **Upload the files.** Click **uploading an existing file**. Drag in **everything inside** the unzipped folder, including the `.github` folder, and click **Commit changes**.
   - If the `.github` folder does not upload, create it by hand: **Add file → Create new file**, type `.github/workflows/deploy.yml` as the name, paste the contents of that file, and commit.
3. **Add the unlock key.** **Settings → Secrets and variables → Actions → New repository secret**.
   - Name: `UNLOCK_KEY`
   - Value: the key from the separate file `UNLOCK_KEY (keep private).txt`.
4. **Turn on Pages.** **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. **Publish the first time.** **Actions → “Publish site and unlock mocks” → Run workflow**. Wait for the green tick (about 1 minute).
6. **Custom domain.** **Settings → Pages → Custom domain** → type `gate.psychlogic.in` → **Save**.
7. **Cloudflare DNS.** Add a record:
   - Type: `CNAME`
   - Name: `gate`
   - Target: `<your-github-username>.github.io`
   - Proxy status: **DNS only** (grey cloud) until GitHub shows “HTTPS certificate is ready”. Then tick **Enforce HTTPS** in GitHub Pages settings.

## After setup
- Each mock unlocks automatically at **10:00 AM IST** on its date. GitHub’s scheduler can sometimes run a few minutes late. A backup run happens at 10:30 AM.
- To unlock immediately, for example if a run was delayed: **Actions → Run workflow**.
- Never upload the key file itself to GitHub.

© PsychLogic · Where Psychology Meets Strategy
