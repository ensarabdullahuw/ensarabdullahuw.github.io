/* ==========================================================================
   YOUR CONTENT — edit this file to add your own work.

   For every project:
     src      → path to the video, e.g. 'videos/cola-nostra.mp4'  (leave '' to show a placeholder)
     poster   → still image shown before the video plays, e.g. 'videos/cola-nostra.jpg'
     duration → 'mm:ss'
     year, platform ('Reels' / 'TikTok'…), views ('2.4M'), role (['Edit', 'Color']) → optional

   The files in videos/ are web copies (H.264, max 1920px, ~5 Mbps) of the originals in
   00. ESR/VideoPortfolio/Videos. Videos play muted on hover and with sound when clicked.
   ========================================================================== */

window.SITE = {
  name: 'Ensar Abdullahu',
  email: 'ensarabdullahu47@gmail.com',

  // Small line shown under every project (a project can override it with its own `credit`)
  credit: 'Project developed at HoB Studio.',

  // Paste your published Google Sheet link (the one ending in output=csv) between the quotes.
  // When it's set, the website reads your videos from the sheet and the list below is only a backup.
  sheetUrl: '',
};

window.PROJECTS = {
  showreel: {
    title: 'Showreel 2026',
    client: 'Selected work',
    year: '2026',
    duration: '00:31',
    src: 'videos/showreel.mp4',
    poster: 'videos/showreel.jpg',
    background: 'videos/showreel-bg.mp4', // light 720p copy that plays faintly behind the hero title
  },

  /* ---------- Social · vertical 9:16 ----------
     Order here = order on the site. Titles and descriptions come from the file
     names — change them to whatever you like. */
  vertical: [
    { title: 'Cola Nostra',                client: 'Product spot',        duration: '00:30', src: 'videos/cola-nostra.mp4',             poster: 'videos/cola-nostra.jpg' },
    { title: 'yalloFriends × HoB Studio',  client: 'Character animation', duration: '00:54', src: 'videos/yallofriends-hob-studio.mp4', poster: 'videos/yallofriends-hob-studio.jpg' },
    { title: 'Big Burger',                 client: 'Food content',        duration: '00:28', src: 'videos/big-burger.mp4',              poster: 'videos/big-burger.jpg' },
    { title: 'Flex24',                     client: 'Social ad',           duration: '00:27', src: 'videos/flex24.mp4',                  poster: 'videos/flex24.jpg' },
    { title: 'Fibulari në botën e çudirave', client: 'Fibula — Animated story', duration: '00:34', src: 'videos/fibulari-wonderland.mp4', poster: 'videos/fibulari-wonderland.jpg' },
    { title: 'WorkWise — Part 1',          client: 'Talking-head edit',   duration: '00:20', src: 'videos/workwise-01.mp4',             poster: 'videos/workwise-01.jpg' },
    { title: 'WorkWise — Part 2',          client: 'Talking-head edit',   duration: '00:20', src: 'videos/workwise-02.mp4',             poster: 'videos/workwise-02.jpg' },
    { title: 'Fibula — July',              client: 'Travel promo',        duration: '00:19', src: 'videos/fibula-01.mp4',               poster: 'videos/fibula-01.jpg' },
    { title: 'Fibula — Antalya',           client: 'Travel promo',        duration: '00:14', src: 'videos/fibula-02.mp4',               poster: 'videos/fibula-02.jpg' },
    { title: 'Elevator',                   client: 'Fendo',               duration: '00:06', src: 'videos/elevator-fendo.mp4',          poster: 'videos/elevator-fendo.jpg' },
  ],

  /* ---------- Films · horizontal 16:9 (the first one is featured large) ---------- */
  horizontal: [
    { title: 'Autino',                  client: 'Brand animation',         role: ['Motion design'],         duration: '00:46', src: 'videos/autino-brand-animation.mp4', poster: 'videos/autino-brand-animation.jpg' },
    { title: 'Dalipi Automobile',       client: 'Brand animation',         role: ['Motion design'],         duration: '00:53', src: 'videos/dalipi-brand-animation.mp4', poster: 'videos/dalipi-brand-animation.jpg' },
    { title: 'Starfetch',               client: 'Motion graphics',         role: ['Motion design'],         duration: '00:45', src: 'videos/starfetch.mp4',              poster: 'videos/starfetch.jpg' },
    { title: 'FixMyVideo',              client: 'Product animation',       role: ['Motion design'],         duration: '00:32', src: 'videos/fixmyvideo.mp4',             poster: 'videos/fixmyvideo.jpg' },
    { title: 'Dio',                     client: 'Image film',              role: ['Edit'],                  duration: '00:50', src: 'videos/dio-image-film.mp4',         poster: 'videos/dio-image-film.jpg' },
    { title: 'UZH Fokusvideo',          client: 'University of Zurich — Explainer', role: ['Edit', 'Motion design'], duration: '01:56', src: 'videos/uzh-fokusvideo.mp4', poster: 'videos/uzh-fokusvideo.jpg' },
    { title: 'Now Available',           client: 'Product promo',           role: ['Edit'],                  duration: '00:23', src: 'videos/draft-1.mp4',                poster: 'videos/draft-1.jpg' },
  ],
};
