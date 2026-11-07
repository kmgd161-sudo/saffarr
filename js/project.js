(function () {
  const projectCarousels = document.querySelectorAll('#projectCarousel');
  const lightbox = document.getElementById('galleryLightbox');

  if (!projectCarousels.length || !lightbox) return;

  const lightboxGrid = document.getElementById('lightboxGrid');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxMeta = document.getElementById('lightboxMeta');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');
  const lbClose = document.getElementById('lbClose');
  const lbMenu = document.getElementById('lbMenu');
  const lbCompact = document.getElementById('lbCompact');
  const lbDownload = document.getElementById('lbDownload');
  const lbShare = document.getElementById('lbShare');
  const lbMobilePage = document.getElementById('lbMobilePage');
  const projectShowMobile = document.body.matches('.project-page, .project-show-grid-page, .project-show-arch-page') && window.matchMedia('(max-width: 767.99px)').matches;
  let activeLightboxSources = [];
  let activeLightboxIndex = 0;

  /* ---------------- draggable-scroll helper, shared by the inline
     carousel and the lightbox strip below ---------------- */
  function makeDraggable(el, onTap) {
    let dragging = false;
    let dragMoved = false;
    let startX = 0;
    let startScroll = 0;
    let downTarget = null;

    el.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      dragMoved = false;
      downTarget = event.target.closest('img, video');
      startX = event.clientX;
      startScroll = el.scrollLeft;
      el.classList.add('dragging');
      el.setPointerCapture(event.pointerId);
    });

    el.addEventListener('pointermove', event => {
      if (!dragging) return;
      if (Math.abs(event.clientX - startX) > 6) dragMoved = true;
      el.scrollLeft = startScroll - (event.clientX - startX);
    });

    const stop = event => {
      if (event.type === 'pointerup' && !dragMoved && downTarget && onTap) {
        onTap(downTarget);
      }
      dragging = false;
      downTarget = null;
      el.classList.remove('dragging');
      if (event.pointerId !== undefined && el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
    };

    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
  }

  /* ---------------- inline "related projects" carousel ---------------- */
   /* ---------------- inline "related projects" carousel ---------------- */

  projectCarousels.forEach(projectCarousel => {

    const galleryMedia = Array.from(
      projectCarousel.querySelectorAll('img, video')
    );

    makeDraggable(projectCarousel, media => openProjectLightbox(media));

    projectCarousel.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') {
        projectCarousel.scrollBy({
          left: 280,
          behavior: 'smooth'
        });
      }

      if (event.key === 'ArrowLeft') {
        projectCarousel.scrollBy({
          left: -280,
          behavior: 'smooth'
        });
      }
    });

    galleryMedia.forEach((media, index) => {

      media.setAttribute('tabindex', '0');
      media.setAttribute('role', 'button');

      media.setAttribute(
        'aria-label',
        `Open project ${index + 1} of ${galleryMedia.length}`
      );

      media.addEventListener('click', () => {
        openProjectLightbox(media);
      });

      media.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openProjectLightbox(media);
        }
      });

    });

  });

  /* ---------------- footer meta (same for every project on this page) ---------------- */
  if (lightboxMeta) {
    ['FIELD', 'CLIENT', 'SERVICE'].forEach(label => {
      const match = Array.from(document.querySelectorAll('.project-meta p')).find(p => {
        const b = p.querySelector('b');
        return b && b.textContent.trim().toUpperCase() === label;
      });
      if (!match) return;
      const value = match.textContent.replace(match.querySelector('b').textContent, '').trim();
      const span = document.createElement('span');
      span.innerHTML = `<b>${label}</b> ${value}`;
      lightboxMeta.appendChild(span);
    });
  }

  /* ---------------- lightbox open/close ---------------- */
  let lastFocused = null;
  const lightboxBody = lightbox.querySelector('.lightbox-body');

  /* Grid view shows 2 rows of square (297x297 in the source design) cells.
     A vh-based CSS cap alone can't tell the header/footer chrome apart from
     the rest of the viewport, so on short/landscape screens it still let
     row 2 run past the visible area. Measuring the real available height
     here and feeding it back in as --lb-row keeps both rows on-screen at
     any viewport size — the CSS min(..., 30vh) stays only as a fallback
     before this has run once. */
  function syncCompactRowHeight() {
    if (!lightboxBody) return;
    const rows = 2;
    const gap = 14; // must match .lightbox-grid's gap in css/style.css
    const paddingY = 24; // must match .lightbox-grid's vertical padding
    const available = lightboxBody.clientHeight - paddingY * 2 - gap * (rows - 1);
    const perRow = Math.max(60, Math.floor(available / rows));
    lightboxGrid.style.setProperty('--lb-row', perRow + 'px');
  }

  if (lightboxBody) {
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncCompactRowHeight).observe(lightboxBody);
    } else {
      window.addEventListener('resize', syncCompactRowHeight);
    }
    syncCompactRowHeight();
  }

  function createLightboxMedia(src) {
    const isVideo = /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(src);
    if (!isVideo) {
      const img = document.createElement('img');
      img.src = src.replace(/'/g, '').trim();
      img.alt = '';
      img.draggable = false;
      return img;
    }

    const video = document.createElement('video');
    video.src = src.replace(/'/g, '').trim();
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = 'metadata';
    /* mobile lightbox is swiped between full-bleed items, so it keeps the
       plain, control-less video used before; desktop/tablet gets the same
       custom controls bar as the project hero film */
    if (projectShowMobile) return video;
    return window.SaffarPlayer.wrap(video, { alwaysVisible: true });
  }

  function renderMobileLightboxMedia() {
    lightboxGrid.replaceChildren(createLightboxMedia(activeLightboxSources[activeLightboxIndex]));
    if (lbMobilePage) lbMobilePage.textContent = `${activeLightboxIndex + 1}-${activeLightboxSources.length}`;
    if (lbPrev) lbPrev.disabled = activeLightboxIndex <= 0;
    if (lbNext) lbNext.disabled = activeLightboxIndex >= activeLightboxSources.length - 1;
  }

  function renderLightboxMedia(sources) {
    activeLightboxSources = sources;
    activeLightboxIndex = 0;
    lightboxGrid.innerHTML = '';
    if (projectShowMobile) renderMobileLightboxMedia();
    else sources.forEach(src => lightboxGrid.appendChild(createLightboxMedia(src)));
    lightboxGrid.scrollLeft = 0;
    lightboxGrid.classList.remove('compact');
    if (lbMenu) lbMenu.setAttribute('aria-pressed', 'true');
    if (lbCompact) lbCompact.setAttribute('aria-pressed', 'false');
  }

  function openProjectLightbox(triggerMedia) {
    const mediaList = triggerMedia.dataset.media || triggerMedia.dataset.images;
    const sources = mediaList
      ? mediaList.split(',').map(src => src.trim()).filter(Boolean)
      : [triggerMedia.currentSrc || triggerMedia.src];

    renderLightboxMedia(sources);
    if (lightboxTitle) lightboxTitle.textContent = triggerMedia.alt || triggerMedia.getAttribute('aria-label') || document.title;

    lastFocused = triggerMedia;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);

  /* The project lightbox is intentionally modal: taps on its empty black
     areas must never dismiss it accidentally. Closing is handled only by
     the explicit close control above. */

  if (lbPrev) lbPrev.addEventListener('click', () => {
    if (projectShowMobile) {
      if (activeLightboxIndex <= 0) return;
      activeLightboxIndex -= 1;
      renderMobileLightboxMedia();
      return;
    }
    lightboxGrid.scrollBy({ left: -lightboxGrid.clientWidth * .8, behavior: 'smooth' });
  });
  if (lbNext) lbNext.addEventListener('click', () => {
    if (projectShowMobile) {
      if (activeLightboxIndex >= activeLightboxSources.length - 1) return;
      activeLightboxIndex += 1;
      renderMobileLightboxMedia();
      return;
    }
    lightboxGrid.scrollBy({ left: lightboxGrid.clientWidth * .8, behavior: 'smooth' });
  });

  /* lb-menu switches to the horizontal carousel view, lb-compact switches
     to the wrapped grid view — neither of them opens the site's nav menu */
  if (lbMenu) lbMenu.addEventListener('click', () => {
    lightboxGrid.classList.remove('compact');
    lbMenu.setAttribute('aria-pressed', 'true');
    if (lbCompact) lbCompact.setAttribute('aria-pressed', 'false');
  });
  if (lbCompact) lbCompact.addEventListener('click', () => {
    lightboxGrid.classList.add('compact');
    lbCompact.setAttribute('aria-pressed', 'true');
    if (lbMenu) lbMenu.setAttribute('aria-pressed', 'false');
  });

  if (lbDownload) {
    /* no PDF asset is authored for this project yet; keep the control
       visible to match the design but inert until one exists */
    lbDownload.setAttribute('aria-disabled', 'true');
    lbDownload.title = 'No PDF available for this project yet';
  }

  const copyShareUrl = async url => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return;
    }
    const helper = document.createElement('textarea');
    helper.value = url;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand('copy');
    helper.remove();
    if (!copied) throw new Error('Copy failed');
  };

  const showShareStatus = (message, state) => {
    const label = lbShare && lbShare.querySelector('span');
    if (!label) return;
    const original = label.dataset.originalLabel || label.textContent;
    label.dataset.originalLabel = original;
    label.textContent = message;
    lbShare.dataset.shareState = state;
    window.setTimeout(() => {
      label.textContent = original;
      delete lbShare.dataset.shareState;
    }, 1600);
  };

  if (lbShare) lbShare.addEventListener('click', async () => {
    const shareData = { title: document.title, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyShareUrl(shareData.url);
        showShareStatus('Copied!', 'copied');
      }
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      try {
        await copyShareUrl(shareData.url);
        showShareStatus('Copied!', 'copied');
      } catch (_) {
        showShareStatus('Copy failed', 'error');
      }
    }
  });

  function makeMobileLightboxSwipeable() {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let horizontalSwipe = false;

    const activeMedia = () => lightboxGrid.querySelector('img, video');

    lightboxGrid.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      deltaX = 0;
      horizontalSwipe = false;
      lightboxGrid.setPointerCapture(pointerId);
      const media = activeMedia();
      if (media) media.style.transition = 'none';
    });

    lightboxGrid.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (!horizontalSwipe && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        horizontalSwipe = true;
      }
      if (!horizontalSwipe) return;

      const atStart = activeLightboxIndex === 0 && deltaX > 0;
      const atEnd = activeLightboxIndex === activeLightboxSources.length - 1 && deltaX < 0;
      const resistance = atStart || atEnd ? 0.12 : 0.45;
      const media = activeMedia();
      if (media) media.style.transform = `translate3d(${deltaX * resistance}px, 0, 0)`;
    });

    const finishSwipe = event => {
      if (event.pointerId !== pointerId) return;
      const media = activeMedia();
      if (media) {
        media.style.transition = 'transform .22s ease';
        media.style.transform = '';
      }

      if (horizontalSwipe && Math.abs(deltaX) >= 45) {
        if (deltaX < 0 && activeLightboxIndex < activeLightboxSources.length - 1) {
          activeLightboxIndex += 1;
          renderMobileLightboxMedia();
        } else if (deltaX > 0 && activeLightboxIndex > 0) {
          activeLightboxIndex -= 1;
          renderMobileLightboxMedia();
        }
      }

      if (lightboxGrid.hasPointerCapture(pointerId)) lightboxGrid.releasePointerCapture(pointerId);
      pointerId = null;
      horizontalSwipe = false;
      deltaX = 0;
    };

    lightboxGrid.addEventListener('pointerup', finishSwipe);
    lightboxGrid.addEventListener('pointercancel', finishSwipe);
  }

  if (projectShowMobile) makeMobileLightboxSwipeable();
  else makeDraggable(lightboxGrid);
})();

/* ---------------------------------------------------------------------------
   Custom video controls (moved here from app.js — only the project pages use
   them: the hero film below and the lightbox videos in the code above)
   --------------------------------------------------------------------------- */
/* ---------------- reusable custom video-player controls ---------------- */
const SaffarPlayer = (() => {
  const ICONS = {
    play: '<svg viewBox="0 0 16 16"><path d="M4 2.5v11l10-5.5-10-5.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 16 16"><rect x="3.3" y="2.5" width="3" height="11" fill="currentColor"/><rect x="9.7" y="2.5" width="3" height="11" fill="currentColor"/></svg>',
    back: '<svg viewBox="0 0 16 16"><path d="M8.3 2.5 2.5 8l5.8 5.5v-11z" fill="currentColor"/><path d="M13.8 2.5 8 8l5.8 5.5v-11z" fill="currentColor"/></svg>',
    fwd: '<svg viewBox="0 0 16 16"><path d="M7.7 2.5 13.5 8l-5.8 5.5v-11z" fill="currentColor"/><path d="M2.2 2.5 8 8l-5.8 5.5v-11z" fill="currentColor"/></svg>',
    volume: '<svg viewBox="0 0 16 16"><path d="M2 6h2.4L8 3.1v9.8L4.4 10H2V6z" fill="currentColor"/><path d="M10.4 5.6a3.3 3.3 0 0 1 0 4.8" stroke="currentColor" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>',
    muted: '<svg viewBox="0 0 16 16"><path d="M2 6h2.4L8 3.1v9.8L4.4 10H2V6z" fill="currentColor"/><path d="M10.6 6.2l3.2 3.6M13.8 6.2l-3.2 3.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
    gear: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.6" stroke="currentColor" stroke-width="1.1" fill="none"/><path d="M8 1.6v1.3M8 13.1v1.3M14.4 8h-1.3M2.9 8H1.6M12.5 3.5l-.9.9M4.4 11.6l-.9.9M12.5 12.5l-.9-.9M4.4 4.4l-.9-.9" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>',
    expand: '<svg viewBox="0 0 16 16"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    collapse: '<svg viewBox="0 0 16 16"><path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  const formatTime = seconds => {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const fillRange = el => {
    const min = Number(el.min) || 0;
    const max = Number(el.max) || 100;
    const pct = max > min ? ((el.value - min) / (max - min)) * 100 : 0;
    el.style.backgroundSize = `${pct}% 100%`;
  };

  function build() {
    const bar = document.createElement('div');
    bar.className = 'vplayer-controls';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Video controls');
    bar.innerHTML = `
      <button type="button" class="vp-btn vp-play" aria-label="Play">${ICONS.play}</button>
      <button type="button" class="vp-btn vp-back" aria-label="Rewind 10 seconds">${ICONS.back}</button>
      <button type="button" class="vp-btn vp-fwd" aria-label="Forward 10 seconds">${ICONS.fwd}</button>
      <div class="vp-volume">
        <button type="button" class="vp-btn vp-mute" aria-label="Mute">${ICONS.volume}</button>
        <input type="range" class="vp-range vp-volume-range" min="0" max="1" step="0.05" value="1" aria-label="Volume">
      </div>
      <span class="vp-time vp-time-current">0:00</span>
      <input type="range" class="vp-range vp-seek" min="0" max="1000" step="1" value="0" aria-label="Seek">
      <span class="vp-time vp-time-duration">0:00</span>
      <div class="vp-settings">
        <button type="button" class="vp-btn vp-gear" aria-label="Playback speed" aria-haspopup="true" aria-expanded="false">${ICONS.gear}</button>
        <div class="vp-speed-menu" role="menu" hidden>
          <button type="button" role="menuitemradio" data-speed="0.5">0.5x</button>
          <button type="button" role="menuitemradio" data-speed="1" aria-checked="true">1x</button>
          <button type="button" role="menuitemradio" data-speed="1.5">1.5x</button>
          <button type="button" role="menuitemradio" data-speed="2">2x</button>
        </div>
      </div>
      <button type="button" class="vp-btn vp-fullscreen" aria-label="Fullscreen">${ICONS.expand}</button>
    `;
    return bar;
  }

  function wire(video, wrapper, controls, opts) {
    const playBtn = controls.querySelector('.vp-play');
    const backBtn = controls.querySelector('.vp-back');
    const fwdBtn = controls.querySelector('.vp-fwd');
    const muteBtn = controls.querySelector('.vp-mute');
    const volumeRange = controls.querySelector('.vp-volume-range');
    const seekRange = controls.querySelector('.vp-seek');
    const currentLabel = controls.querySelector('.vp-time-current');
    const durationLabel = controls.querySelector('.vp-time-duration');
    const gearBtn = controls.querySelector('.vp-gear');
    const speedMenu = controls.querySelector('.vp-speed-menu');
    const fullscreenBtn = controls.querySelector('.vp-fullscreen');

    let seeking = false;

    const syncPlayIcon = () => {
      playBtn.innerHTML = video.paused ? ICONS.play : ICONS.pause;
      playBtn.setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
    };
    const syncMuteIcon = () => {
      const isMuted = video.muted || video.volume === 0;
      muteBtn.innerHTML = isMuted ? ICONS.muted : ICONS.volume;
      muteBtn.setAttribute('aria-label', isMuted ? 'Unmute' : 'Mute');
    };
    const syncVolumeRange = () => {
      volumeRange.value = video.muted ? 0 : video.volume;
      fillRange(volumeRange);
    };
    const syncSeekRange = () => {
      if (seeking || !video.duration) return;
      seekRange.value = (video.currentTime / video.duration) * 1000;
      fillRange(seekRange);
      currentLabel.textContent = formatTime(video.currentTime);
    };
    const syncDuration = () => {
      durationLabel.textContent = formatTime(video.duration);
    };

    playBtn.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
    video.addEventListener('play', syncPlayIcon);
    video.addEventListener('pause', syncPlayIcon);

    backBtn.addEventListener('click', () => {
      video.currentTime = Math.max(0, video.currentTime - 10);
    });
    fwdBtn.addEventListener('click', () => {
      video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
    });

    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) video.volume = 1;
      syncMuteIcon();
      syncVolumeRange();
    });
    volumeRange.addEventListener('input', () => {
      video.volume = Number(volumeRange.value);
      video.muted = video.volume === 0;
      fillRange(volumeRange);
      syncMuteIcon();
    });

    seekRange.addEventListener('pointerdown', () => { seeking = true; });
    seekRange.addEventListener('input', () => {
      fillRange(seekRange);
      if (video.duration) currentLabel.textContent = formatTime((seekRange.value / 1000) * video.duration);
    });
    const commitSeek = () => {
      if (!seeking) return;
      seeking = false;
      if (video.duration) video.currentTime = (seekRange.value / 1000) * video.duration;
    };
    seekRange.addEventListener('change', commitSeek);
    seekRange.addEventListener('pointerup', commitSeek);

    video.addEventListener('loadedmetadata', () => { syncDuration(); syncSeekRange(); syncVolumeRange(); syncMuteIcon(); });
    video.addEventListener('timeupdate', syncSeekRange);
    video.addEventListener('volumechange', () => { syncVolumeRange(); syncMuteIcon(); });

    gearBtn.addEventListener('click', event => {
      event.stopPropagation();
      const open = speedMenu.hasAttribute('hidden');
      speedMenu.toggleAttribute('hidden', !open);
      gearBtn.setAttribute('aria-expanded', String(open));
    });
    speedMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        video.playbackRate = Number(btn.dataset.speed);
        speedMenu.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b === btn)));
        speedMenu.setAttribute('hidden', '');
        gearBtn.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', event => {
      if (!speedMenu.hasAttribute('hidden') && !controls.contains(event.target)) {
        speedMenu.setAttribute('hidden', '');
        gearBtn.setAttribute('aria-expanded', 'false');
      }
    });

    fullscreenBtn.addEventListener('click', () => {
      if (document.fullscreenElement === wrapper) document.exitFullscreen();
      else if (wrapper.requestFullscreen) wrapper.requestFullscreen();
    });
    document.addEventListener('fullscreenchange', () => {
      const active = document.fullscreenElement === wrapper;
      fullscreenBtn.innerHTML = active ? ICONS.collapse : ICONS.expand;
      fullscreenBtn.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Fullscreen');
    });

    controls.addEventListener('click', event => event.stopPropagation());
    controls.addEventListener('pointerdown', event => event.stopPropagation());

    syncPlayIcon();
    syncMuteIcon();
    syncVolumeRange();
    fillRange(seekRange);
    if (video.readyState >= 1) { syncDuration(); syncSeekRange(); }

    if (opts && opts.alwaysVisible) wrapper.classList.add('is-active');
  }

  function wrap(video, opts) {
    const wrapper = document.createElement('div');
    wrapper.className = 'vplayer';
    const parent = video.parentNode;
    if (parent) parent.replaceChild(wrapper, video);
    wrapper.appendChild(video);
    const controls = build();
    wrapper.appendChild(controls);
    wire(video, wrapper, controls, opts);
    return wrapper;
  }

  return { wrap };
})();
window.SaffarPlayer = SaffarPlayer;

/* project.html hero film: custom controls, scroll-scale reveal, description slide-over */
(function () {
  const projectFilmPin = document.querySelector('.project-film-pin');
  const projectFilm = document.getElementById('projectFilm');
  const projectVideo = document.getElementById('projectVideo');

  if (projectFilmPin && projectFilm && projectVideo) {
    SaffarPlayer.wrap(projectVideo, { alwaysVisible: true });

    const projectDescription = document.querySelector('.project-description');

    /* No more pin/fixed/absolute juggling, no runway height to keep in sync
       with the film's size, no letterbox mask — the film is just a normal
       static block in the document now (see style.css). The only remaining
       scroll-driven piece is this: the description panel eases up from
       slightly below its natural spot into a small overlap with the film
       above it as it scrolls into view, purely a translateY driven by the
       panel's OWN position relative to the viewport — like a background-
       attachment:fixed reveal, minus any dead scroll space, and identical
       at every resolution since nothing here depends on the film's height. */
    let revealTicking = false;
    let lastShift = 0;

    const updateReveal = () => {
      revealTicking = false;
      if (!projectDescription) return;

      const rect = projectDescription.getBoundingClientRect();
      const naturalTop = rect.top - lastShift; // undo the transform from the last frame before re-measuring
      const vh = window.innerHeight;
      const paddingTop = parseFloat(getComputedStyle(projectDescription).paddingTop) || 0;

      const pushDown = Math.max(60, Math.min(260, paddingTop));
      const maxOverlap = Math.max(24, Math.min(160, paddingTop * 0.5));
      const revealStart = vh; // panel's top just touching the viewport's bottom edge
      const revealEnd = vh * 0.55; // panel's top has scrolled ~45% of the way up the screen
      const revealProgress = Math.min(1, Math.max(0, (revealStart - naturalTop) / (revealStart - revealEnd)));

      const shift = pushDown - (pushDown + maxOverlap) * revealProgress;
      lastShift = shift;
      projectDescription.style.setProperty('--desc-shift', shift.toFixed(1) + 'px');
    };

    updateReveal();
    window.addEventListener('resize', updateReveal);
    window.addEventListener('scroll', () => {
      if (!revealTicking) {
        revealTicking = true;
        requestAnimationFrame(updateReveal);
      }
    }, { passive: true });

    /* scroll scale: the film opens up from 84% to full size as it scrolls into
       view (via --film-scale, used by the .project-film-mask bars in style.css).
       Purely visual — no layout or pinning involved. */
    const minFilmScale = .84;
    let scaleTicking = false;
    const updateFilmScale = () => {
      scaleTicking = false;
      const rect = projectFilm.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / vh));
      projectFilm.style.setProperty('--film-scale', (minFilmScale + (1 - minFilmScale) * progress).toFixed(3));
    };
    updateFilmScale();
    window.addEventListener('resize', updateFilmScale);
    window.addEventListener('scroll', () => {
      if(scaleTicking) return;
      scaleTicking = true;
      requestAnimationFrame(updateFilmScale);
    }, { passive: true });

    projectVideo.addEventListener('play', () => projectFilm.classList.add('is-playing'));
    projectVideo.addEventListener('pause', () => projectFilm.classList.remove('is-playing'));
    projectVideo.addEventListener('ended', () => projectFilm.classList.remove('is-playing'));
  }
})();
