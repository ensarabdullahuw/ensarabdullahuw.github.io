# How to add or change your videos

You set this up once (about 20 minutes). After that, adding a video takes 2 minutes and you never touch the code.

**Three free tools, three jobs:**

| Tool | Job | Think of it as |
|---|---|---|
| **Cloudinary** | stores your video files | a hard drive on the internet |
| **Google Sheets** | the list of videos on your site | your "database" |
| **Netlify** | puts the website online | the web host |

---

## Part 1 · Make your video list (Google Sheet) — once

1. Go to **sheets.google.com** and click **Blank spreadsheet**.
2. Click **File → Import → Upload**, and choose `videos-sheet-template.csv` from this `portfolio` folder.
3. Choose **Replace current sheet** → **Import data**. You'll see the example projects. **One row = one video.**
4. Click **File → Share → Publish to web**.
   - First dropdown: pick your sheet (usually **Sheet1**)
   - Second dropdown: pick **Comma-separated values (.csv)**
   - Click **Publish** → **OK**, then **copy the link** it shows you.
5. Open `js/projects.js` and paste that link between the quotes on the `sheetUrl` line:
   ```js
   sheetUrl: 'https://docs.google.com/spreadsheets/d/e/....../pub?output=csv',
   ```
   Use a code editor such as VS Code (free). TextEdit can change `'` into `’` and break the link.

## Part 2 · Upload a video (Cloudinary) — every new video

1. Sign up free at **cloudinary.com**.
2. Open **Media Library** (or **Assets**) → **Upload** → drag in your `.mp4`.
3. Click the uploaded video → **Copy URL**. It looks like
   `https://res.cloudinary.com/your-name/video/upload/v1234/my-video.mp4`

Export tip: **H.264 .mp4, 1080p**, and keep each file small (ideally under 50 MB) so the site loads fast.

## Part 3 · Put it on your site (Google Sheet) — every new video

Paste the link into the **video** column of a row and fill in the rest:

| Column | What to type | Example |
|---|---|---|
| section | `showreel`, `social` (9:16) or `film` (16:9) | social |
| title | project name | Scent of Midnight |
| client | who it was for | Fragrance brand |
| video | the Cloudinary link | https://res.cloudinary.com/… .mp4 |
| poster | leave **empty** (Cloudinary makes a thumbnail automatically) | |
| length | minutes:seconds | 00:30 |
| year | | 2026 |
| platform | social only: Reels / TikTok / Shorts | Reels |
| views | social only | 2.4M |
| roles | films only, separated by commas | Edit, Color, Sound |

- **Add** a video → add a row
- **Remove** a video → delete the row
- **Reorder** → move rows (the order in the sheet is the order on the site; the first `film` is the big featured one)
- Don't rename the top row (the column names)

Changes show up on the website in about **5 minutes** (Google's delay). Refresh the page.

## Part 4 · Put the website online (Netlify) — once

1. Sign up free at **netlify.com** (sign up first, or the site gets deleted after an hour).
2. Go to **app.netlify.com/drop**.
3. Drag the whole **`portfolio` folder** onto the page.
4. You get a link like `something.netlify.app` — that's your website. You can rename it in **Site configuration**, or connect your own domain later.

You only repeat Part 4 if you change the design or text in the code — **not** when you add videos.

---

## If something doesn't work

- **Video doesn't show** → open the link in your browser. It must play by itself and end in `.mp4`. Google Drive, Dropbox and YouTube links **won't work** in the video column.
- **Changes don't appear** → wait 5 minutes, then refresh.
- **Site shows the old example projects** → the sheet couldn't be read. Check the `sheetUrl` link ends in `output=csv` and the sheet is still published.

## Without the sheet (optional)

You can also skip Google Sheets. Put videos in a `videos/` folder next to `index.html` and write the paths into `js/projects.js` (e.g. `src: 'videos/night-ritual.mp4'`). Then drag the folder to Netlify again every time you change something.
