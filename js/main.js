/* ==========================================================================
   Portfolio — main.js
   GSAP + ScrollTrigger + Lenis.

   Performance rules followed throughout:
   - only transform / opacity are animated while scrolling
   - nothing reads layout (getBoundingClientRect etc.) inside scroll updates
   - placeholders and videos only run while on screen

   0. Content source (Google Sheet or projects.js)
   1. Helpers           5. Lightbox              9. Scroll animations
   2. Render content    6. Boot & smooth scroll  10. Text reveals & counters
   3. Placeholders      7. Loader & intro        11. Page progress
   4. Players           8. Cursor
   ========================================================================== */
(() => {
  'use strict';

  const SITE = window.SITE || {};
  const FALLBACK = window.PROJECTS || { showreel: {}, vertical: [], horizontal: [] };

  /* 0. Content source -----------------------------------------------------
     If SITE.sheetUrl is set, projects are read from that published Google
     Sheet (CSV) on every visit. Any section missing from the sheet — or the
     whole sheet, if it can't be reached — falls back to js/projects.js.     */
  const parseCSV = text => {
    const rows = [];
    let row = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') quoted = false;
        else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  };

  const fromSheet = rows => {
    const head = (rows.shift() || []).map(h => h.trim().toLowerCase());
    const out = { showreel: null, vertical: [], horizontal: [] };
    rows.forEach(r => {
      const o = {};
      head.forEach((h, k) => (o[h] = (r[k] || '').trim()));
      if (!o.title && !o.video) return;
      const item = {
        title: o.title, client: o.client, src: o.video, poster: o.poster,
        duration: o.length, year: o.year, platform: o.platform, views: o.views,
        role: (o.roles || '').split(',').map(x => x.trim()).filter(Boolean),
      };
      const section = (o.section || '').toLowerCase();
      if (section.startsWith('show')) out.showreel = item;
      else if (/^(social|vertical|9)/.test(section)) out.vertical.push(item);
      else if (/^(film|horizontal|16)/.test(section)) out.horizontal.push(item);
    });
    return out;
  };

  const loadContent = async () => {
    if (!SITE.sheetUrl) return FALLBACK;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const url = SITE.sheetUrl + (SITE.sheetUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(res.status);
      const sheet = fromSheet(parseCSV(await res.text()));
      return {
        showreel: sheet.showreel || FALLBACK.showreel,
        vertical: sheet.vertical.length ? sheet.vertical : FALLBACK.vertical,
        horizontal: sheet.horizontal.length ? sheet.horizontal : FALLBACK.horizontal,
      };
    } catch (err) {
      console.warn('Could not load the Google Sheet, using js/projects.js instead.', err);
      return FALLBACK;
    }
  };

  // Cloudinary can serve a still frame of any video: same link, .jpg instead of .mp4
  const withPoster = item => {
    if (item && item.src && !item.poster && item.src.includes('res.cloudinary.com')) {
      item.poster = item.src.replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, '.jpg');
    }
    return item;
  };

  const start = DATA => {
  [DATA.showreel, ...DATA.vertical, ...DATA.horizontal].forEach(withPoster);

  /* 1. Helpers ----------------------------------------------------------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const FPS = 25;
  const PAGE_RUNTIME = 180; // the whole page reads as a 3-minute reel
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const startTime = performance.now();

  const pad = n => String(n).padStart(2, '0');
  const timecode = sec => {
    sec = Math.max(0, sec);
    return `${pad(Math.floor(sec / 3600))}:${pad(Math.floor(sec / 60) % 60)}:${pad(Math.floor(sec) % 60)}:${pad(Math.floor((sec % 1) * FPS))}`;
  };
  const toSeconds = str => String(str || '0').split(':').reduce((t, n) => t * 60 + Number(n), 0);
  const seeded = seed => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Real video when `src` is set, otherwise a calm placeholder (lighting varies per project)
  const mediaHTML = (item, label, seed = 1) => {
    if (item.src) {
      // With a poster: load nothing until played. Without one: load just enough to show a frame (1s in, past any fade from black).
      return item.poster
        ? `<video class="media-el" data-src="${esc(item.src)}" poster="${esc(item.poster)}" muted loop playsinline preload="none"></video>`
        : `<video class="media-el" src="${esc(item.src)}#t=1" muted loop playsinline preload="metadata"></video>`;
    }
    const r = seeded(seed * 131 + 7);
    const vars = `--px:${Math.round(15 + r() * 70)}%;--py:${Math.round(5 + r() * 40)}%;--lx:${Math.round(10 + r() * 50)}%;--ly:${Math.round(20 + r() * 45)}%`;
    return `<div class="ph" style="${vars}"><span class="ph-light"></span><span class="ph-mark"></span><span class="ph-label mono">${label}</span></div>`;
  };

  /* 2. Render content ---------------------------------------------------- */
  if (SITE.name) $$('.site-name').forEach(el => (el.textContent = SITE.name));
  if (SITE.email) {
    $('#contactMail').href = `mailto:${SITE.email}`;
    $('#contactMailText').textContent = SITE.email;
  }

  $('#reelMedia').innerHTML = mediaHTML(DATA.showreel || {}, 'Showreel', 99);

  const vTrack = $('#vTrack');
  vTrack.innerHTML = DATA.vertical.map((p, i) => `
    <article class="phone" data-i="${i}">
      <div class="phone-screen" role="button" tabindex="0" data-open="vertical:${i}" data-cursor="Play" aria-label="Play ${esc(p.title)}">
        <div class="phone-media">${mediaHTML(p, '9:16 · 1080×1920', i + 1)}</div>
        <div class="phone-progress"><b></b></div>
        <div class="phone-top mono">${p.platform ? `<span class="phone-platform">${esc(p.platform)}</span>` : '<span></span>'}<span data-tc>00:00:00:00</span></div>
      </div>
      <div class="phone-meta">
        <span class="mono">${pad(i + 1)}</span>
        <div><h3>${esc(p.title)}</h3><p class="mono">${[p.client, p.views && `${p.views} views`].filter(Boolean).map(esc).join(' · ')}</p></div>
      </div>
    </article>`).join('');

  const filmHTML = (p, i, featured) => {
    const r = seeded(i * 977 + 13);
    let segs = '', left = 100;
    while (left > 0) {
      const w = Math.min(left, 3 + r() * 13);
      segs += `<i style="flex:${w.toFixed(2)};--s:${(0.4 + r() * 0.6).toFixed(2)}"></i>`;
      left -= w;
    }
    return `
    <article class="film${featured ? ' film--featured' : ''}" data-i="${i}">
      <div class="film-frame" role="button" tabindex="0" data-open="horizontal:${i}" data-cursor="Play" aria-label="Play ${esc(p.title)}">
        <div class="film-media">${mediaHTML(p, '16:9 · 1920×1080', i + 20)}</div>
        <div class="letterbox top"></div><div class="letterbox bottom"></div>
        <div class="film-hud mono"><span><i class="rec-dot"></i> Playing</span><span data-tc>00:00:00:00</span></div>
      </div>
      <div class="film-timeline"><div class="film-segs">${segs}</div><i class="film-playhead"></i></div>
      <div class="film-info">
        <span class="film-idx mono">${pad(i + 1)}</span>
        <div><h3 class="film-title">${esc(p.title)}</h3><p class="film-client">${esc(p.client)}</p></div>
        <div class="film-meta mono"><span>${(p.role || []).map(esc).join(' · ')}</span><span>${[p.year, p.duration].filter(Boolean).map(esc).join(' — ')}</span></div>
      </div>
    </article>`;
  };
  const [featured, ...restFilms] = DATA.horizontal;
  $('#filmList').innerHTML =
    (featured ? filmHTML(featured, 0, true) : '') +
    (restFilms.length ? `<div class="film-grid">${restFilms.map((p, k) => filmHTML(p, k + 1, false)).join('')}</div>` : '');

  /* 3. Placeholders: animate only while visible --------------------------- */
  const phObserver = new IntersectionObserver(entries => {
    entries.forEach(en => en.target.classList.toggle('in-view', en.isIntersecting));
  });
  $$('.ph').forEach(el => phObserver.observe(el));

  /* 4. Players: real <video> or simulated placeholder playback ----------- */
  const players = [];
  const makePlayer = (root, item, onProgress) => {
    const pl = { root, video: $('video', root), dur: toSeconds(item.duration) || 15, t: 0, playing: false, tcEls: $$('[data-tc]', root), onProgress };
    players.push(pl);
    return pl;
  };
  const play = pl => {
    if (!pl || pl.playing) return;
    pl.playing = true;
    pl.root.classList.add('is-playing');
    if (pl.video) {
      if (!pl.video.getAttribute('src')) pl.video.src = pl.video.dataset.src;
      pl.video.play().catch(() => {});
    }
  };
  const pause = pl => {
    if (!pl || !pl.playing) return;
    pl.playing = false;
    pl.root.classList.remove('is-playing');
    if (pl.video) pl.video.pause();
  };

  // Hero: the light copy of the reel plays faintly behind the title while the hero is on screen
  const heroVideo = $('#heroVideo');
  const heroSrc = DATA.showreel && DATA.showreel.background;
  if (heroVideo && heroSrc && !reduceMotion) {
    heroVideo.src = heroSrc;
    heroVideo.preload = 'auto';
    heroVideo.addEventListener('playing', () => heroVideo.classList.add('is-ready'), { once: true });
    new IntersectionObserver(([en]) => (en.isIntersecting ? heroVideo.play().catch(() => {}) : heroVideo.pause()))
      .observe($('.hero'));
  }

  const reelPlayer = makePlayer($('.reel'), DATA.showreel || {});
  new IntersectionObserver(([en]) => (en.isIntersecting ? play(reelPlayer) : pause(reelPlayer)), { threshold: 0.2 }).observe($('.reel'));

  const phones = $$('.phone');
  const phonePlayers = phones.map((el, i) => {
    const bar = $('.phone-progress b', el);
    return makePlayer(el, DATA.vertical[i], p => (bar.style.transform = `scaleX(${p})`));
  });

  // The timeline width is cached so the playhead never reads layout per frame
  const filmPlayers = $$('.film').map(el => {
    const head = $('.film-playhead', el);
    let width = 0;
    const measure = () => (width = head.parentElement.clientWidth);
    measure();
    addEventListener('resize', measure);
    return makePlayer(el, DATA.horizontal[Number(el.dataset.i)], p => (head.style.transform = `translateX(${p * width}px)`));
  });

  // Computer: hover to play. Phone/tablet: plays while it's mostly on screen.
  const bindPlayback = (list, selector) => {
    if (finePointer) {
      list.forEach(pl => {
        const el = $(selector, pl.root);
        el.addEventListener('pointerenter', () => play(pl));
        el.addEventListener('pointerleave', () => pause(pl));
      });
    } else {
      const io = new IntersectionObserver(entries => entries.forEach(en => {
        const pl = list.find(p => p.root.contains(en.target));
        en.intersectionRatio > 0.6 ? play(pl) : pause(pl);
      }), { threshold: [0, 0.6] });
      list.forEach(pl => io.observe($(selector, pl.root)));
    }
  };
  bindPlayback(phonePlayers, '.phone-screen');
  bindPlayback(filmPlayers, '.film-frame');

  // One clock for everything; text only changes once per video frame (25 fps)
  const liveTc = $$('[data-live-tc], [data-runtime]');
  let lastNow = performance.now(), textAcc = 0;
  const tick = () => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastNow) / 1000);
    lastNow = now;
    textAcc += dt;
    const writeText = textAcc >= 1 / FPS;
    if (writeText) textAcc = 0;
    for (const pl of players) {
      if (!pl.playing) continue;
      const v = pl.video;
      let p;
      if (v && v.duration) { pl.t = v.currentTime; p = v.currentTime / v.duration; }
      else { pl.t = (pl.t + dt) % pl.dur; p = pl.t / pl.dur; }
      if (pl.onProgress) pl.onProgress(p);
      if (writeText) for (const el of pl.tcEls) el.textContent = timecode(pl.t);
    }
    if (writeText) {
      const elapsed = timecode((now - startTime) / 1000);
      for (const el of liveTc) el.textContent = elapsed;
    }
  };

  /* 5. Lightbox ---------------------------------------------------------- */
  const lb = $('#lightbox'), lbFrame = $('#lbFrame');
  let lenis = null;
  let lbOpen = false;
  const resumeAfter = [];

  const openLightbox = (kind, i) => {
    const item = kind === 'reel' ? DATA.showreel : (DATA[kind] || [])[i];
    if (!item) return;
    const vertical = kind === 'vertical';
    lbFrame.className = `lb-frame ${vertical ? 'is-v' : 'is-h'}`;
    lbFrame.innerHTML = item.src
      ? `<video src="${esc(item.src)}"${item.poster ? ` poster="${esc(item.poster)}"` : ''} controls autoplay playsinline></video>`
      : `${mediaHTML(item, '', i + 50)}<p class="lb-note mono">Placeholder — add a video for “${esc(item.title)}” in js/projects.js</p>`;
    $$('.ph', lbFrame).forEach(el => el.classList.add('in-view'));
    $('#lbMeta').textContent = `${vertical ? '9:16' : '16:9'} · ${item.duration || ''}`;
    $('#lbTitle').textContent = item.title || '';
    $('#lbSub').textContent = [item.client, item.year].filter(Boolean).join(' — ');

    resumeAfter.length = 0;
    players.forEach(pl => { if (pl.playing) { resumeAfter.push(pl); pause(pl); } });
    lbOpen = true;
    if (lenis) lenis.stop();
    if (window.gsap) {
      gsap.killTweensOf([lb, lbFrame]);
      gsap.set(lb, { visibility: 'visible' });
      gsap.to(lb, { opacity: 1, duration: 0.35, ease: 'power2.out' });
      gsap.fromTo(lbFrame, { opacity: 0, y: 24, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'expo.out', delay: 0.05 });
    } else {
      lb.style.visibility = 'visible';
      lb.style.opacity = 1;
    }
    $('#lbClose').focus({ preventScroll: true });
  };

  const closeLightbox = () => {
    if (!lbOpen) return;
    lbOpen = false;
    const v = $('video', lbFrame);
    if (v) v.pause();
    const done = () => {
      lbFrame.innerHTML = '';
      lb.style.visibility = 'hidden';
      resumeAfter.forEach(play);
    };
    if (lenis) lenis.start();
    if (window.gsap) gsap.to(lb, { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: done });
    else { lb.style.opacity = 0; done(); }
  };

  const openFrom = el => {
    const [kind, i] = el.dataset.open.split(':');
    openLightbox(kind, Number(i));
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-open]');
    if (t) openFrom(t);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') return closeLightbox();
    const t = (e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('[data-open]');
    if (t) { e.preventDefault(); openFrom(t); }
  });
  $('#lbClose').addEventListener('click', closeLightbox);
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  /* 6. Boot & smooth scroll ---------------------------------------------- */
  // Without GSAP (CDN blocked) everything still shows, just without motion
  if (!window.gsap || !window.ScrollTrigger) {
    document.body.classList.remove('is-loading');
    $('.loader').remove();
    setInterval(tick, 40);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.add(tick);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  const scrollToTarget = target => {
    if (lenis) return lenis.scrollTo(target, { duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4) });
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY;
    scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  $$('[data-scroll]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = id && id.length > 1 ? $(id) : null;
    if (!el) return;
    e.preventDefault();
    const host = el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
    scrollToTarget(id === '#top' ? 0 : host);
  }));

  /* 7. Loader & intro ---------------------------------------------------- */
  const splitChars = el => {
    const text = el.textContent;
    el.textContent = '';
    for (const ch of text) {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
    }
    return $$('.char', el);
  };
  const splitWords = el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(' '));
            const m = document.createElement('span'); m.className = 'wm';
            const w = document.createElement('span'); w.className = 'w'; w.textContent = part;
            m.appendChild(w); frag.appendChild(m);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return $$('.w', el);
  };

  const heroChars = $$('.hero-title .split').flatMap(splitChars);
  gsap.set(heroChars, { yPercent: 115 });
  gsap.set('.hero-kicker, .hero-foot', { y: 20, opacity: 0 });
  gsap.set('.nav > *', { y: -12, opacity: 0 });
  gsap.set('.viewfinder', { opacity: 0, scale: 1.04 });

  const intro = () => {
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to(heroChars, { yPercent: 0, duration: 1.3, stagger: 0.022 }, 0)
      .to('.viewfinder', { opacity: 1, scale: 1, duration: 1.4 }, 0)
      .to('.nav > *', { y: 0, opacity: 1, duration: 1, stagger: 0.06 }, 0.2)
      .to('.hero-kicker, .hero-foot', { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 0.4);
  };
  const finishLoading = () => {
    document.body.classList.remove('is-loading');
    if (lenis) lenis.start();
    intro();
  };

  if (reduceMotion) {
    $('.loader').remove();
    finishLoading();
  } else {
    const counter = { f: 0 };
    const total = FPS * 2;
    const tcEl = $('.loader-tc'), pctEl = $('.loader-pct'), barEl = $('.loader-bar i');
    gsap.timeline()
      .to(counter, {
        f: total, duration: 1.2, ease: 'power2.inOut',
        onUpdate: () => {
          const p = counter.f / total;
          tcEl.textContent = timecode(counter.f / FPS);
          pctEl.textContent = `${Math.round(p * 100)}%`;
          barEl.style.transform = `scaleX(${p})`;
        },
      })
      .to('.loader-inner', { opacity: 0, duration: 0.3, ease: 'power2.in' }, '+=0.1')
      .to('.loader-top', { yPercent: -100, duration: 1, ease: 'expo.inOut' })
      .to('.loader-bottom', { yPercent: 100, duration: 1, ease: 'expo.inOut' }, '<')
      .add(finishLoading, '-=0.6')
      .set('.loader', { display: 'none' });
  }

  /* 8. Cursor (desktop only) --------------------------------------------- */
  if (finePointer) {
    document.body.classList.add('has-cursor');
    const cur = $('.cursor'), label = $('.cursor-label');
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.3, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.3, ease: 'power3' });
    addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      const a = !t && e.target.closest('a, button');
      cur.classList.toggle('is-label', !!t);
      cur.classList.toggle('is-link', !!a);
      if (t) label.textContent = t.dataset.cursor;
    });
  }

  /* 9. Scroll animations (created in page order so pins stack correctly) */
  const isDesktop = () => innerWidth >= 900;

  // Hero: content drifts up and fades as you leave
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero-content', { yPercent: -15, opacity: 0, ease: 'none' }, 0)
    .to('.viewfinder', { opacity: 0, ease: 'none' }, 0);

  // Showreel: a small frame opens to full-bleed
  const reelSmall = () => {
    const w = isDesktop() ? innerWidth * 0.34 : innerWidth * 0.72;
    const h = (w * 9) / 16;
    return { x: (innerWidth - w) / 2, y: (innerHeight - h) / 2 };
  };
  gsap.timeline({
    scrollTrigger: { trigger: '.reel', start: 'top top', end: '+=120%', pin: true, scrub: 0.6, invalidateOnRefresh: true },
  })
    .fromTo('.reel-frame',
      { clipPath: () => { const s = reelSmall(); return `inset(${s.y}px ${s.x}px ${s.y}px ${s.x}px round 12px)`; } },
      { clipPath: 'inset(0px 0px 0px 0px round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
    .to('.reel-left', { x: () => (isDesktop() ? -reelSmall().x : 0), y: () => (isDesktop() ? 0 : -reelSmall().y), opacity: 0, ease: 'power2.inOut', duration: 1 }, 0)
    .to('.reel-right', { x: () => (isDesktop() ? reelSmall().x : 0), y: () => (isDesktop() ? 0 : reelSmall().y), opacity: 0, ease: 'power2.inOut', duration: 1 }, 0)
    .to('.reel-ui', { opacity: 1, duration: 0.2 }, 0.8)
    .to({}, { duration: 0.2 });

  // Marquee: steady loop that speeds up briefly when you scroll fast
  const mTrack = $('.marquee-track');
  mTrack.innerHTML += mTrack.innerHTML;
  const marquee = gsap.to(mTrack, { xPercent: -50, duration: 36, ease: 'none', repeat: -1, paused: true });
  ScrollTrigger.create({
    trigger: '.marquee', start: 'top bottom', end: 'bottom top',
    onToggle: self => (self.isActive ? marquee.play() : marquee.pause()),
    onUpdate: self => {
      const boost = 1 + Math.min(4, Math.abs(self.getVelocity()) / 800);
      gsap.to(marquee, { timeScale: boost, duration: 0.2, overwrite: true, onComplete: () => gsap.to(marquee, { timeScale: 1, duration: 1.2 }) });
    },
  });

  // Social: phones rise in, one after another
  gsap.from(phones, { y: 60, opacity: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '#vTrack', start: 'top 85%', once: true } });

  // Films: letterbox-style reveal plays once as each enters
  $$('.film').forEach(film => {
    gsap.timeline({ scrollTrigger: { trigger: film, start: 'top 85%', once: true } })
      .fromTo($('.film-frame', film), { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' })
      .from($$('.film-timeline, .film-info', film), { y: 24, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' }, 0.5);
  });

  /* 10. Text reveals & counters ------------------------------------------ */
  $$('[data-reveal]').forEach(el => {
    gsap.from(splitWords(el), { yPercent: 110, duration: 1.2, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
  });
  $$('[data-fade]').forEach(el => {
    gsap.from(el, { y: 24, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  gsap.to(splitWords($('#aboutText')), {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '#aboutText', start: 'top 78%', end: 'bottom 50%', scrub: true },
  });

  $$('[data-count]').forEach(el => {
    const o = { v: 0 };
    const end = Number(el.dataset.count), suffix = el.dataset.suffix || '';
    el.textContent = `0${suffix}`;
    gsap.to(o, {
      v: end, duration: 2, ease: 'expo.out',
      onUpdate: () => (el.textContent = `${Math.round(o.v)}${suffix}`),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  const contactChars = $$('.contact-title .split').flatMap(splitChars);
  gsap.from(contactChars, { yPercent: 115, duration: 1.3, stagger: 0.022, ease: 'expo.out', scrollTrigger: { trigger: '.contact-title', start: 'top 82%', once: true } });

  /* 11. Page progress: nav timecode + thin bar --------------------------- */
  const navTc = $('#navTc'), progressFill = $('#progressFill');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      progressFill.style.transform = `scaleX(${self.progress})`;
      navTc.textContent = timecode(self.progress * PAGE_RUNTIME);
    },
  });

  // Fonts change text metrics — re-measure once they've loaded
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }; // end start()

  loadContent().then(start);
})();
