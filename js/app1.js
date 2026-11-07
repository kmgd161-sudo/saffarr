const overlay = document.getElementById('overlay');
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('close');

if (overlay && menuBtn && closeBtn) {
  const setMenuOpen = open => {
    overlay.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    overlay.setAttribute('aria-hidden', String(!open));
  };

  menuBtn.setAttribute('aria-expanded', 'false');
  overlay.setAttribute('aria-hidden', 'true');
  menuBtn.onclick = () => setMenuOpen(true);
  closeBtn.onclick = () => setMenuOpen(false);

  overlay.onclick = event => {
    if (event.target === overlay) setMenuOpen(false);
  };

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenuOpen(false);
  });
}

/* ---------------- Theme ---------------- */

const themeToggle =
  document.getElementById('themeToggle') ||
  document.getElementById('galTheme');

const themeLabel =
  document.getElementById('themeLabel') ||
  document.getElementById('galThemeLabel');

const getSavedTheme = () => {
  try {
    const value = localStorage.getItem('saffar-theme');
    return value === 'light' || value === 'dark' ? value : null;
  } catch (error) {
    return null;
  }
};

const saveTheme = value => {
  try {
    localStorage.setItem('saffar-theme', value);
  } catch (error) {
    // Theme still applies to the current page.
  }
};

const savedTheme = getSavedTheme();

if (savedTheme) {
  document.body.classList.toggle('light', savedTheme === 'light');
}

if (themeToggle) {
  const updateThemeLabel = () => {
    if (themeLabel) {
      themeLabel.textContent =
        document.body.classList.contains('light') ? 'Dark' : 'Light';
    }
  };

  updateThemeLabel();

  themeToggle.onclick = () => {
    document.body.classList.toggle('light');

    saveTheme(
      document.body.classList.contains('light') ? 'light' : 'dark'
    );

    updateThemeLabel();
  };
}

/* ---------------- File attachments ---------------- */

document.querySelectorAll('.attachment-input').forEach(attachmentInput => {
  const form = attachmentInput.closest('form');
  const attachmentStatus =
    form && form.querySelector('.attachment-status');

  const attachmentLabel = attachmentInput.id
    ? document.querySelector(`label[for="${attachmentInput.id}"]`)
    : null;

  if (attachmentLabel) {
    attachmentLabel.addEventListener('click', event => {
      event.preventDefault();
      attachmentInput.click();
    });
  }

  attachmentInput.addEventListener('change', () => {
    if (!attachmentStatus) return;

    const selectedFile = attachmentInput.files[0];

    attachmentStatus.textContent = selectedFile
      ? `${selectedFile.name} has been attached`
      : (attachmentStatus.dataset.emptyText ?? 'No file has been attached');
  });
});

/* ---------------- Year range slider ---------------- */

document.querySelectorAll('.year-range').forEach(box => {
  const target = box.querySelector('.year-range-slider');

  if (
    !target ||
    typeof window.noUiSlider === 'undefined' ||
    target.noUiSlider
  ) {
    return;
  }

  const fromLabel = box.querySelector('[data-year-from]');
  const toLabel = box.querySelector('[data-year-to]');

  window.noUiSlider.create(target, {
    start: [Number(box.dataset.from), Number(box.dataset.to)],
    connect: true,
    step: 1,
    margin: 1,
    range: {
      min: Number(box.dataset.min),
      max: Number(box.dataset.max)
    },
    format: {
      to: value => String(Math.round(value)),
      from: value => Number(value)
    }
  });

  target.noUiSlider.on('update', values => {
    if (fromLabel) fromLabel.textContent = values[0];
    if (toLabel) toLabel.textContent = values[1];
  });
});

/* ---------------- Close cursor ---------------- */

window.SaffarCloseCursor = (() => {
  if (
    !window.matchMedia('(hover: hover) and (pointer: fine)').matches
  ) {
    return null;
  }

  const el = document.createElement('div');
  el.className = 'close-cursor';
  el.setAttribute('aria-hidden', 'true');

  el.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path
        d="M1.5 1.5l13 13M14.5 1.5l-13 13"
        stroke="currentColor"
        stroke-width="1.8"
      />
    </svg>
  `;

  document.body.appendChild(el);

  let active = null;

  const hide = () => {
    el.classList.remove('is-on');

    if (active) {
      active.classList.remove('cursor-close');
      active = null;
    }
  };

  return {
    hide,

    bind(area, skip) {
      if (area.dataset.closeCursorBound === 'true') return;

      area.dataset.closeCursorBound = 'true';

      area.addEventListener('mousemove', event => {
        const skipped = skip && skip(event.target);

        el.style.transform =
          `translate3d(${event.clientX}px, ${event.clientY}px, 0) ` +
          'translate(-50%, -50%)';

        area.classList.toggle('cursor-close', !skipped);
        el.classList.toggle('is-on', !skipped);

        active = skipped ? null : area;
      });

      area.addEventListener('mouseleave', hide);
    }
  };
})();

/* =========================================================
   GALLERY
   Supports rows loaded dynamically through AJAX.
   ========================================================= */

(function () {
  const gallery = document.getElementById('gallery');
  const galleryWrap = document.getElementById('galleryWrap');
  const galleryList = document.getElementById('galleryList');

  if (!gallery || !galleryWrap || !galleryList) return;

  const items = Array.from(gallery.querySelectorAll('.item'));

  const columnOffsets = [0, 52, 0, 52, 0, 52];
  const columnPhases = [0, Math.PI, 0, Math.PI, 0, Math.PI];

  const mobileList = window.matchMedia('(max-width: 767.99px)');
  const mobileGallery = window.matchMedia('(max-width: 700px)');
  const desktopGallery = window.matchMedia('(min-width: 768px)');

  const useSwiper =
    typeof window.Swiper === 'function' &&
    desktopGallery.matches;

  const detailSwipers = new Map();
  const initializedDetails = new WeakSet();
  const initializedRows = new WeakSet();
  const initializedFallbackDetails = new WeakSet();

  let activeFilter = 'all';

  /*
   * IMPORTANT:
   * Never store the AJAX rows in a constant array.
   * Always query the current DOM so newly loaded rows are included.
   */
  function getListRows() {
    return Array.from(galleryList.querySelectorAll('.list-row'));
  }

  /* ---------------- Video hover ---------------- */
  /* ---------------- Video hover ---------------- */

/* ---------------- Video hover ---------------- */

/* ---------------- Video hover ---------------- */

function setupVideo(video) {
  if (video.dataset.galleryVideoBound === 'true') return;

  video.dataset.galleryVideoBound = 'true';

  const hoverTarget = video.closest('.gallery .item') || video;

  const playVideo = () => {
    if (!video.isConnected) return;

    const playRequest = video.play();

    if (playRequest && typeof playRequest.catch === 'function') {
      playRequest.catch(() => {});
    }
  };

  const pauseVideo = () => {
    video.pause();
  };

  hoverTarget.addEventListener('mouseenter', playVideo);
  hoverTarget.addEventListener('mouseleave', pauseVideo);

  hoverTarget.addEventListener('focusin', playVideo);
  hoverTarget.addEventListener('focusout', event => {
    if (!hoverTarget.contains(event.relatedTarget)) {
      pauseVideo();
    }
  });
}

function setupAllVideos(root = document) {
  if (root.matches && root.matches('video')) {
    setupVideo(root);
  }

  if (root.querySelectorAll) {
    root.querySelectorAll(
      '.gallery .item video, ' +
      '#galleryList video, ' +
      '.gallery-list video, ' +
      '.list-row video'
    ).forEach(setupVideo);
  }
}

setupAllVideos();


  /* ---------------- Main gallery item links ---------------- */

  items.forEach(item => {
    const projectLink = item.dataset.projectLink || 'project.html';

    item.dataset.projectLink = projectLink;
    item.setAttribute('role', 'link');
    item.setAttribute('tabindex', '0');

    const openProject = () => {
      window.location.href = projectLink;
    };

    item.addEventListener('click', openProject);

    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProject();
      }
    });
  });

  /* ---------------- Detail lock ---------------- */

  function setDetailLock(locked) {
    const root = document.documentElement;

    if (locked) {
      root.style.setProperty(
        '--sbw',
        `${window.innerWidth - root.clientWidth}px`
      );
    } else {
      root.style.removeProperty('--sbw');
    }

    document.body.classList.toggle('detail-locked', locked);
    root.classList.toggle('detail-locked', locked);

    detailSwipers.forEach(instance => {
      if (!instance || !instance.mousewheel) return;

      if (locked) {
        instance.mousewheel.enable();
      } else {
        instance.mousewheel.disable();
      }
    });
  }

  function closeListRows() {
    getListRows().forEach(row => {
      row.classList.remove('open');
      row.setAttribute('aria-expanded', 'false');
    });

    setDetailLock(false);
  }

  /* ---------------- Mobile modal / lightbox ---------------- */

  const projectModal = document.querySelector('.landing-project-modal');
  const projectLightbox = document.querySelector(
    '.landing-project-lightbox'
  );

  let projectSources = [];
  let projectIndex = 0;

  const syncOverlayLock = () => {
    const anyOpen =
      (projectModal && projectModal.classList.contains('is-open')) ||
      (projectLightbox && projectLightbox.classList.contains('is-open'));

    document.body.classList.toggle('service-modal-open', !!anyOpen);
  };

  const setOverlayOpen = (el, open) => {
    if (!el) return;

    el.classList.toggle('is-open', open);
    el.setAttribute('aria-hidden', String(!open));

    syncOverlayLock();
  };

  const createProjectMedia = src => {
    const isVideo = /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(src);

    const media = document.createElement(isVideo ? 'video' : 'img');

    media.src = src;

    if (isVideo) {
      media.muted = true;
      media.loop = true;
      media.autoplay = true;
      media.playsInline = true;
      media.preload = 'metadata';
    } else {
      media.alt = '';
      media.draggable = false;
    }

    return media;
  };

  const renderProjectLightbox = () => {
    if (!projectLightbox || !projectSources.length) return;

    const stage = projectLightbox.querySelector('.service-lightbox-stage');
    const prev = projectLightbox.querySelector('.service-lightbox-prev');
    const next = projectLightbox.querySelector('.service-lightbox-next');
    const page = projectLightbox.querySelector('.service-lightbox-page');

    if (!stage || !prev || !next || !page) return;

    stage.replaceChildren(createProjectMedia(projectSources[projectIndex]));

    page.textContent = `${projectIndex + 1}-${projectSources.length}`;

    prev.disabled = projectIndex <= 0;
    next.disabled = projectIndex >= projectSources.length - 1;
  };

  const openMobileProject = row => {
    if (!projectModal) return;

    const rowTitle = row.querySelector(':scope > span');

    const title = (
      (rowTitle && rowTitle.textContent) ||
      (row.querySelector('h3') || {}).textContent ||
      ''
    ).trim();

    const titleElement = projectModal.querySelector('#landingProjectTitle');

    if (titleElement) {
      titleElement.textContent = title.toUpperCase();
    }

    const copyHost = projectModal.querySelector('.landing-project-copy');

    if (copyHost) {
      copyHost.replaceChildren();

      const copy = row.querySelector('.detail-copy');

      if (copy) {
        const clone = copy.cloneNode(true);

        clone.classList.remove('swiper-slide');
        clone.removeAttribute('style');
        clone.removeAttribute('role');
        clone.removeAttribute('aria-label');

        copyHost.appendChild(clone);
      }
    }

    const box = projectModal.querySelector('.service-mobile-media');

    if (box) {
      box.replaceChildren();
    }

    projectSources = [];

    /*
     * On mobile the detail gallery remains in its original markup,
     * so the images can be read directly from .detail-gallery.
     */
    row.querySelectorAll(
      '.detail-gallery img, .detail-gallery video'
    ).forEach(source => {
      const src = source.tagName === 'VIDEO'
        ? (
            source.querySelector('source') ||
            source
          ).getAttribute('src')
        : source.getAttribute('src');

      if (!src) return;

      const media = createProjectMedia(src);

      if (
        source.tagName === 'VIDEO' &&
        source.getAttribute('poster')
      ) {
        media.poster = source.getAttribute('poster');
      }

      media.dataset.mediaIndex = String(projectSources.length);

      projectSources.push(src);

      if (box) box.appendChild(media);
    });

    setOverlayOpen(projectModal, true);
    projectModal.scrollTop = 0;
  };

  if (projectModal && projectLightbox) {
    const mobileClose = projectModal.querySelector(
      '.service-mobile-close'
    );

    if (mobileClose) {
      mobileClose.addEventListener('click', () => {
        setOverlayOpen(projectModal, false);
      });
    }

    projectModal.addEventListener('click', event => {
      if (event.target.closest('a[href="#"]')) {
        event.preventDefault();
      }

      if (event.target === projectModal) {
        setOverlayOpen(projectModal, false);
      }
    });

    const mobileMedia = projectModal.querySelector(
      '.service-mobile-media'
    );

    if (mobileMedia) {
      mobileMedia.addEventListener('click', event => {
        const media = event.target.closest('img, video');

        if (!media) return;

        projectIndex = Number(media.dataset.mediaIndex) || 0;

        renderProjectLightbox();
        setOverlayOpen(projectLightbox, true);
      });
    }

    const lightboxClose = projectLightbox.querySelector(
      '.service-lightbox-close'
    );

    if (lightboxClose) {
      lightboxClose.addEventListener('click', () => {
        setOverlayOpen(projectLightbox, false);
      });
    }

    const lightboxPrev = projectLightbox.querySelector(
      '.service-lightbox-prev'
    );

    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', () => {
        if (projectIndex <= 0) return;

        projectIndex -= 1;
        renderProjectLightbox();
      });
    }

    const lightboxNext = projectLightbox.querySelector(
      '.service-lightbox-next'
    );

    if (lightboxNext) {
      lightboxNext.addEventListener('click', () => {
        if (projectIndex >= projectSources.length - 1) return;

        projectIndex += 1;
        renderProjectLightbox();
      });
    }

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;

      if (projectLightbox.classList.contains('is-open')) {
        setOverlayOpen(projectLightbox, false);
      } else if (projectModal.classList.contains('is-open')) {
        setOverlayOpen(projectModal, false);
      }
    });
  }

  /* ---------------- Swiper preparation ---------------- */

  /*
   * Move the detail's gallery elements and copy into a Swiper wrapper.
   * This runs once per detail, including details inserted by AJAX.
   */
  function prepareDetailSwiper(detail) {
    if (!useSwiper || initializedDetails.has(detail)) return;

    initializedDetails.add(detail);

    const wrapper = document.createElement('div');
    wrapper.className = 'swiper-wrapper';

    const slides = [];

    detail.querySelectorAll('.detail-gallery > *').forEach(el => {
      slides.push(el);
    });

    const copy = detail.querySelector('.detail-copy');

    if (copy) {
      slides.push(copy);
    }

    slides.forEach(el => {
      el.classList.add('swiper-slide');
      wrapper.appendChild(el);
    });

    detail.querySelectorAll('.detail-gallery').forEach(galleryElement => {
      galleryElement.remove();
    });

    detail.appendChild(wrapper);
    detail.classList.add('swiper');

    /*
     * null means prepared but not initialized.
     * The actual Swiper instance is created when the row opens.
     */
    detailSwipers.set(detail, null);

    if (window.SaffarCloseCursor) {
      window.SaffarCloseCursor.bind(
        detail,
        target => !!target.closest('a')
      );

      detail.addEventListener('click', event => {
        if (event.target.closest('a[href="#"]')) {
          event.preventDefault();
        }

        if (event.target.closest('a')) return;

        if (detail.swiper && !detail.swiper.allowClick) return;

        window.SaffarCloseCursor.hide();
        toggleListRow(detail.closest('.list-row'));
      });
    }
  }


function initDetailSwiper(detail) {
  if (!useSwiper || !detail) return;

  prepareDetailSwiper(detail);

  let instance = detailSwipers.get(detail);

  if (!instance) {
    instance = new window.Swiper(detail, {
      slidesPerView: 'auto',
      spaceBetween: 20,
      watchOverflow: false,

     freeMode: {
  enabled: true,
  momentum: true,
  momentumRatio: 0.9,
  momentumVelocityRatio: 0.8
},
grabCursor: true,
simulateTouch: true,
touchStartPreventDefault: false,
threshold: 0,
resistanceRatio: 0.6,

      mousewheel: {
        enabled: false,
        eventsTarget: 'body',
        forceToAxis: false,
        sensitivity: 1,
        releaseOnEdges: false
      },

      speed: 400,

      on: {
        setTranslate(swiper) {
          swiper.el.classList.add('is-moving');

          clearTimeout(swiper._movingTimer);

          swiper._movingTimer = setTimeout(() => {
            swiper.el.classList.remove('is-moving');
          }, 140);
        }
      }
    });

    detailSwipers.set(detail, instance);
  }

  // اندازه‌ها را به‌روز کن، اما موقعیت فعلی اسلایدر را ریست نکن.
  requestAnimationFrame(() => {
    if (!detail.isConnected || !instance || instance.destroyed) return;

    instance.update();
  });
}

  /* ---------------- Fallback drag when Swiper is unavailable ---------------- */

  function setupFallbackDetail(detail) {
    if (
      desktopGallery.matches === false ||
      useSwiper ||
      initializedFallbackDetails.has(detail)
    ) {
      return;
    }

    initializedFallbackDetails.add(detail);

    let dragStartX = 0;
    let dragStartScroll = 0;
    let isDragging = false;

    detail.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      isDragging = true;
      dragStartX = event.clientX;
      dragStartScroll = detail.scrollLeft;

      detail.classList.add('dragging');

      detail.setPointerCapture(event.pointerId);
    });

    detail.addEventListener('pointermove', event => {
      if (!isDragging) return;

      detail.scrollLeft =
        dragStartScroll - (event.clientX - dragStartX);
    });

    const stopDragging = event => {
      isDragging = false;
      detail.classList.remove('dragging');

      if (
        event.pointerId !== undefined &&
        detail.hasPointerCapture(event.pointerId)
      ) {
        detail.releasePointerCapture(event.pointerId);
      }
    };

    detail.addEventListener('pointerup', stopDragging);
    detail.addEventListener('pointercancel', stopDragging);

    detail.addEventListener('lostpointercapture', () => {
      isDragging = false;
      detail.classList.remove('dragging');
    });

    const row = detail.closest('.list-row');

    if (row) {
      row.addEventListener('wheel', event => {
        if (!row.classList.contains('open')) return;

        const maxScrollLeft = detail.scrollWidth - detail.clientWidth;

        if (maxScrollLeft <= 0) return;

        const wheelDistance =
          Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : event.deltaY;

        const nextScrollLeft = Math.max(
          0,
          Math.min(
            maxScrollLeft,
            detail.scrollLeft + wheelDistance
          )
        );

        if (nextScrollLeft === detail.scrollLeft) return;

        event.preventDefault();
        detail.scrollLeft = nextScrollLeft;
      }, { passive: false });
    }
  }

  /* ---------------- Dynamic row initialization ---------------- */

  function setupRow(row) {
    if (initializedRows.has(row)) return;

    initializedRows.add(row);

    if (!row.hasAttribute('role')) {
      row.setAttribute('role', 'button');
    }

    if (!row.hasAttribute('tabindex')) {
      row.setAttribute('tabindex', '0');
    }

    if (!row.hasAttribute('aria-expanded')) {
      row.setAttribute('aria-expanded', 'false');
    }

    const detail = row.querySelector('.list-detail');

    if (detail) {
      if (useSwiper) {
        prepareDetailSwiper(detail);
      } else {
        setupFallbackDetail(detail);
      }
    }

    row.querySelectorAll('.detail-gallery video').forEach(setupVideo);
  }

  function setupLoadedList() {
    const rows = getListRows();

    rows.forEach(setupRow);

    /*
     * Also catch videos that were inserted in the AJAX response.
     */
    setupAllVideos(galleryList);
  }

  /*
   * Initialize existing rows and any future AJAX rows.
   */
  setupLoadedList();

  /*
   * jQuery .load() inserts its response asynchronously.
   * MutationObserver detects the new elements without changing HTML.
   */
  const listObserver = new MutationObserver(mutations => {
    const hasNewContent = mutations.some(mutation => {
      return mutation.addedNodes.length > 0;
    });

    if (hasNewContent) {
      setupLoadedList();
    }
  });

  listObserver.observe(galleryList, {
    childList: true,
    subtree: true
  });

  /* ---------------- Row open / close ---------------- */

  function toggleListRow(selectedRow) {
    if (!selectedRow) return;

    const willOpen = !selectedRow.classList.contains('open');

    getListRows().forEach(row => {
      row.classList.remove('open');
      row.setAttribute('aria-expanded', 'false');
    });

    setDetailLock(false);

    if (!willOpen) return;

    selectedRow.classList.add('open');
    selectedRow.setAttribute('aria-expanded', 'true');

    const detail = selectedRow.querySelector('.list-detail');

    if (!detail) return;

    /*
     * Wait for the row's open class to take effect before measuring Swiper.
     */
    requestAnimationFrame(() => {
      if (!selectedRow.isConnected) return;
      if (!selectedRow.classList.contains('open')) return;

  if (useSwiper) {
  initDetailSwiper(detail);
}

      const top =
        selectedRow.getBoundingClientRect().top +
        window.scrollY -
        110;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: 'smooth'
      });

      setTimeout(() => {
        if (!selectedRow.isConnected) return;

        if (useSwiper) {
          const instance = detailSwipers.get(detail);
          if (instance) instance.update();
        }
      }, 700);
    });
  }

  const activateRow = row => {
    if (projectModal && mobileList.matches) {
      openMobileProject(row);
    } else {
      toggleListRow(row);
    }
  };

  /*
   * Delegated events are the key AJAX fix.
   * They work for both current rows and rows inserted later.
   */
  galleryList.addEventListener('click', event => {
    const row = event.target.closest('.list-row');

    if (!row || !galleryList.contains(row)) return;

    if (event.target.closest('.list-detail')) return;

    activateRow(row);
  });

  galleryList.addEventListener('keydown', event => {
    const row = event.target.closest('.list-row');

    if (!row || !galleryList.contains(row)) return;

    if (event.key !== 'Enter' && event.key !== ' ') return;

    /*
     * Avoid handling the same key event twice if the focus is on
     * a child control inside the row.
     */
    if (
      event.target !== row &&
      event.target.closest('a, button, input, textarea, select')
    ) {
      return;
    }

    event.preventDefault();
    activateRow(row);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeListRows();
    }
  });

  /* ---------------- Filters ---------------- */

  function matchesFilter(el) {
    return activeFilter === 'all' ||
      el.dataset.category === activeFilter;
  }

  function visibleItems() {
    return items.filter(el =>
      !el.classList.contains('hidden') &&
      matchesFilter(el)
    );
  }

  function renderAll() {
    const visible = new Set(visibleItems());

    items.forEach(item => {
      item.style.display = visible.has(item) ? '' : 'none';
    });
  }

  /* ---------------- Layout / view switching ---------------- */

  const isLanding = document.body.classList.contains('landing-page');
  const defaultCols = isLanding ? 4 : 3;

  let currentCols = defaultCols;

  function buildColumns(n) {
    gallery.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    onScroll();
  }

  function applyLayout(colsOrList) {
    if (mobileGallery.matches && colsOrList !== 'list') {
      colsOrList = 2;
    }

    document.querySelectorAll('.view-icons span').forEach(el => {
      el.classList.toggle(
        'active',
        el.dataset.cols === String(colsOrList)
      );
    });

    if (colsOrList === 'list') {
      galleryWrap.classList.add('view-list');
      document.body.classList.add('list-view-active');
      return;
    }

    galleryWrap.classList.remove('view-list');
    document.body.classList.remove('list-view-active');

    closeListRows();

    currentCols = colsOrList;
    galleryWrap.dataset.cols = String(colsOrList);

    buildColumns(colsOrList);
    renderAll();
  }

  document.querySelectorAll('.view-icons span').forEach(el => {
    const val = el.dataset.cols === 'list'
      ? 'list'
      : parseInt(el.dataset.cols, 10);

    el.addEventListener('click', () => applyLayout(val));
  });

  /* ---------------- Filter popover ---------------- */

  const filterBtn = document.getElementById('filterBtn');
  const filterPlus = document.getElementById('filterPlus');
  const filterPop = document.getElementById('filterPop');

  if (filterBtn && filterPop) {
    const setFiltersOpen = open => {
      filterBtn.classList.toggle('open', open);
      filterBtn.setAttribute('aria-expanded', String(open));

      document.body.classList.toggle(
        'filters-modal-open',
        open && window.matchMedia('(max-width: 700px)').matches
      );

      if (!open) {
        filterPop.querySelectorAll('.desktop-filter-group.open')
          .forEach(group => group.classList.remove('open'));
      }

      if (filterPlus) {
        filterPlus.classList.toggle('open', open);
        filterPlus.setAttribute('aria-expanded', String(open));
      }
    };

    const toggleFilters = event => {
      event.stopPropagation();
      setFiltersOpen(!filterBtn.classList.contains('open'));
    };

    filterBtn.setAttribute('aria-expanded', 'false');

    filterBtn.addEventListener('click', event => {
      event.stopPropagation();

      if (event.target.closest('.filter-pop')) return;

      toggleFilters(event);
    });

    if (filterPlus) {
      filterPlus.addEventListener('click', toggleFilters);

      filterPlus.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleFilters(event);
        }
      });
    }

    document.addEventListener('click', () => {
      setFiltersOpen(false);
    });

    filterPop.addEventListener('click', event => {
      event.stopPropagation();
    });

    filterPop.querySelectorAll('.desktop-filter-trigger')
      .forEach(trigger => {
        trigger.addEventListener('click', event => {
          event.stopPropagation();

          const group = trigger.closest('.desktop-filter-group');

          filterPop.querySelectorAll('.desktop-filter-group')
            .forEach(other => {
              if (other !== group) other.classList.remove('open');
            });

          group.classList.toggle('open');
        });
      });

    filterPop.querySelectorAll('.desktop-filter-menu button')
      .forEach(option => {
        option.addEventListener('click', event => {
          event.stopPropagation();

          const group = option.closest('.desktop-filter-group');
          const label = group.querySelector('.desktop-filter-trigger span');

          if (label) label.textContent = option.textContent;

          group.querySelectorAll('.desktop-filter-menu button')
            .forEach(item => {
              item.classList.toggle('selected', item === option);
            });

          group.classList.remove('open');
        });
      });

    filterPop.querySelectorAll(
      '.mobile-filter-content .filter-options button'
    ).forEach(option => {
      option.addEventListener('click', event => {
        event.stopPropagation();
        option.classList.toggle('selected');
      });
    });

    const mobileFilterClose = filterPop.querySelector('.mobile-filter-close');
    const mobileFilterSubmit = filterPop.querySelector('.mobile-filter-submit');

    if (mobileFilterClose) {
      mobileFilterClose.addEventListener('click', () => {
        setFiltersOpen(false);
      });
    }

    if (mobileFilterSubmit) {
      mobileFilterSubmit.addEventListener('click', () => {
        setFiltersOpen(false);
      });
    }
  }

  /* ---------------- Load more ---------------- */

  const loadMoreBtn = document.getElementById('loadMoreBtn');

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      items.forEach(el => el.classList.remove('hidden'));

      /*
       * Use the live list, not the rows that existed at page load.
       */
      getListRows().forEach(el => el.classList.remove('hidden'));

      if (loadMoreBtn.parentElement) {
        loadMoreBtn.parentElement.style.display = 'none';
      }

      applyLayout(currentCols);
    });
  }

  /* ---------------- Scroll wave ---------------- */

  const waveFrequency = 0.01;
  const waveAmplitude = 70;
  const rampDistance = 500;

  let scrollTicking = false;

  function onScroll() {
    if (isLanding && mobileGallery.matches) {
      items.forEach(item => {
        item.style.transform = '';
      });

      return;
    }

    if (scrollTicking || galleryWrap.classList.contains('view-list')) {
      return;
    }

    scrollTicking = true;

    requestAnimationFrame(() => {
      const scrollPosition = window.scrollY;
      const isMobile = mobileGallery.matches;

      const activeRampDistance = isMobile ? 320 : rampDistance;
      const activeAmplitude = isMobile ? 28 : waveAmplitude;
      const activeFrequency = isMobile ? 0.014 : waveFrequency;
      const baseScale = isMobile ? 0.45 : 1;

      const ramp = Math.max(
        0,
        Math.min(1, scrollPosition / activeRampDistance)
      );

      visibleItems().forEach((item, index) => {
        const columnIndex = index % currentCols;

        const baseOffset =
          columnOffsets[columnIndex % columnOffsets.length];

        const phase =
          columnPhases[columnIndex % columnPhases.length];

        const wave =
          Math.sin(scrollPosition * activeFrequency + phase) *
          activeAmplitude *
          ramp;

        item.style.transform =
          `translateY(${baseOffset * baseScale * ramp + wave}px)`;
      });

      scrollTicking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  const handleGalleryBreakpoint = event => {
    if (galleryWrap.classList.contains('view-list')) return;

    applyLayout(event.matches ? 2 : defaultCols);
  };

  if (mobileGallery.addEventListener) {
    mobileGallery.addEventListener('change', handleGalleryBreakpoint);
  } else {
    mobileGallery.addListener(handleGalleryBreakpoint);
  }

  /* ---------------- Initial render ---------------- */

  applyLayout(mobileGallery.matches ? 2 : defaultCols);

})();