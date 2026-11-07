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

const themeToggle = document.getElementById('themeToggle') || document.getElementById('galTheme');
const themeLabel = document.getElementById('themeLabel') || document.getElementById('galThemeLabel');

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
    /* The selected theme still applies for the current page. */
  }
};

const savedTheme = getSavedTheme();
if (savedTheme) document.body.classList.toggle('light', savedTheme === 'light');

if (themeToggle) {
  const updateThemeLabel = () => {
    if (themeLabel) themeLabel.textContent = document.body.classList.contains('light') ? 'Dark' : 'Light';
  };

  updateThemeLabel();
  themeToggle.onclick = () => {
    document.body.classList.toggle('light');
    saveTheme(document.body.classList.contains('light') ? 'light' : 'dark');
    updateThemeLabel();
  };
}

document.querySelectorAll('.attachment-input').forEach(attachmentInput => {
  const form = attachmentInput.closest('form');
  const attachmentStatus = form && form.querySelector('.attachment-status');
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

/* Filter panel: dual-handle year range (noUiSlider); the numbers under it
   update live while a handle is dragged. */
document.querySelectorAll('.year-range').forEach(box => {
  const target = box.querySelector('.year-range-slider');
  if(!target || typeof window.noUiSlider === 'undefined' || target.noUiSlider) return;
  const fromLabel = box.querySelector('[data-year-from]');
  const toLabel = box.querySelector('[data-year-to]');
  window.noUiSlider.create(target, {
    start: [Number(box.dataset.from), Number(box.dataset.to)],
    connect: true,
    step: 1,
    margin: 1,
    range: { min: Number(box.dataset.min), max: Number(box.dataset.max) },
    format: { to: value => String(Math.round(value)), from: value => Number(value) }
  });
  target.noUiSlider.on('update', values => {
    if(fromLabel) fromLabel.textContent = values[0];
    if(toLabel) toLabel.textContent = values[1];
  });
});

/* Circular "×" that replaces the mouse cursor over an opened project carousel;
   clicking it closes the project (studiofables-style). Desktop pointers only. */
window.SaffarCloseCursor = (() => {
  if(!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return null;
  const el = document.createElement('div');
  el.className = 'close-cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M1.5 1.5l13 13M14.5 1.5l-13 13" stroke="currentColor" stroke-width="1.8"/></svg>';
  document.body.appendChild(el);
  let active = null;
  const hide = () => {
    el.classList.remove('is-on');
    if(active){ active.classList.remove('cursor-close'); active = null; }
  };
  return {
    hide,
    bind(area, skip){
      area.addEventListener('mousemove', event => {
        const skipped = skip && skip(event.target);
        el.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
        area.classList.toggle('cursor-close', !skipped);
        el.classList.toggle('is-on', !skipped);
        active = skipped ? null : area;
      });
      area.addEventListener('mouseleave', hide);
    }
  };
})();

(function(){
  const gallery = document.getElementById('gallery');
  const galleryWrap = document.getElementById('galleryWrap');
  const galleryList = document.getElementById('galleryList');

  if(!gallery || !galleryWrap || !galleryList) return;

  /* All content and structure are authored directly in gallery.html. */
  const items = Array.from(gallery.querySelectorAll('.item'));
  const listRows = Array.from(galleryList.querySelectorAll('.list-row'));
  const columnOffsets = [0, 52, 0, 52, 0, 52];
  const columnPhases = [0, Math.PI, 0, Math.PI, 0, Math.PI];

  /* Gallery clips stay paused until their card is hovered/focused. */
  const galleryVideos = Array.from(document.querySelectorAll(
    'body.gallery-page .gallery .item video, body.gallery-page .gallery-list .detail-gallery video'
  ));
  galleryVideos.forEach(video => {
    const hoverTarget = video.closest('.item') || video;
    const playVideo = () => {
      const playRequest = video.play();
      if (playRequest && typeof playRequest.catch === 'function') {
        playRequest.catch(() => {});
      }
    };
    const pauseVideo = () => video.pause();

    video.pause();
    hoverTarget.addEventListener('mouseenter', playVideo);
    hoverTarget.addEventListener('mouseleave', pauseVideo);
    hoverTarget.addEventListener('focusin', playVideo);
    hoverTarget.addEventListener('focusout', pauseVideo);
  });

  items.forEach(item => {
    const projectLink = item.dataset.projectLink || 'project.html';
    item.dataset.projectLink = projectLink;
    item.setAttribute('role', 'link');
    item.setAttribute('tabindex', '0');

    const openProject = () => { window.location.href = projectLink; };
    item.addEventListener('click', openProject);
    item.addEventListener('keydown', event => {
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        openProject();
      }
    });
  });

  let activeFilter = 'all';

  /* Like studiofables/archives: while a project is open the page is locked and
     the mouse wheel / trackpad drives that project's carousel instead. */
  function setDetailLock(locked){
    const root = document.documentElement;
    if(locked){
      root.style.setProperty('--sbw', (window.innerWidth - root.clientWidth) + 'px');
    }
    document.body.classList.toggle('detail-locked', locked);
    root.classList.toggle('detail-locked', locked);
    detailSwipers.forEach(instance => {
      if(instance && instance.mousewheel) instance.mousewheel[locked ? 'enable' : 'disable']();
    });
  }

  function closeListRows(){
    listRows.forEach(row => {
      row.classList.remove('open');
      row.setAttribute('aria-expanded', 'false');
    });
    if(document.body.classList.contains('detail-locked')) setDetailLock(false);
  }

  function toggleListRow(selectedRow){
    const willOpen = !selectedRow.classList.contains('open');

    listRows.forEach(row => {
      row.classList.remove('open');
      row.setAttribute('aria-expanded', 'false');
    });

    if(!willOpen) setDetailLock(false);

    if(willOpen){
      selectedRow.classList.add('open');
      selectedRow.setAttribute('aria-expanded', 'true');
      const swiperDetail = selectedRow.querySelector('.list-detail');
      if(swiperDetail && detailSwipers.has(swiperDetail)){
        /* the list is display:none until opened, so Swiper can only measure
           the slides once the row is actually visible: build it on first open */
        requestAnimationFrame(() => {
          let instance = detailSwipers.get(swiperDetail);
          if(!instance){
            instance = new Swiper(swiperDetail, {
              slidesPerView: 'auto',
              spaceBetween: 20,
              watchOverflow: false,
              freeMode: { enabled: true, momentumRatio: 0.9, momentumVelocityRatio: 0.8 },
              grabCursor: true,
              resistanceRatio: 0.6,
              mousewheel: { enabled: false, eventsTarget: 'body', forceToAxis: false, sensitivity: 1, releaseOnEdges: false },
              speed: 600,
              on: {
                /* while the strip is moving, slides slide under a still cursor and
                   would re-trigger hover (grayscale filter transition) every frame */
                setTranslate(swiper){
                  swiper.el.classList.add('is-moving');
                  clearTimeout(swiper._movingTimer);
                  swiper._movingTimer = setTimeout(() => swiper.el.classList.remove('is-moving'), 140);
                }
              }
            });
            detailSwipers.set(swiperDetail, instance);
          }
           instance.slideTo(0, 0);
          instance.update();
          const top = selectedRow.getBoundingClientRect().top + window.scrollY - 110;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          setTimeout(() => instance.update(), 700);
        });
      }
    }
  }

  document.addEventListener('keydown', event => {
    if(event.key === 'Escape') closeListRows();
  });

  /* Mobile list view: a project row does not expand under its title — its info
     opens in a popup (like the mobile service details on services.html), and a
     tap on one of its images opens the black PRE/NEXT gallery on top of that. */
  const mobileList = window.matchMedia('(max-width: 767.99px)');
  const projectModal = document.querySelector('.landing-project-modal');
  const projectLightbox = document.querySelector('.landing-project-lightbox');
  let projectSources = [];
  let projectIndex = 0;

  const syncOverlayLock = () => {
    const anyOpen = (projectModal && projectModal.classList.contains('is-open')) ||
      (projectLightbox && projectLightbox.classList.contains('is-open'));
    document.body.classList.toggle('service-modal-open', !!anyOpen);
  };
  const setOverlayOpen = (el, open) => {
    el.classList.toggle('is-open', open);
    el.setAttribute('aria-hidden', String(!open));
    syncOverlayLock();
  };
  const createProjectMedia = src => {
    const isVideo = /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(src);
    const media = document.createElement(isVideo ? 'video' : 'img');
    media.src = src;
    if(isVideo){
      media.muted = true; media.loop = true; media.autoplay = true;
      media.playsInline = true; media.preload = 'metadata';
    } else {
      media.alt = '';
      media.draggable = false;
    }
    return media;
  };
  const renderProjectLightbox = () => {
    const stage = projectLightbox.querySelector('.service-lightbox-stage');
    const prev = projectLightbox.querySelector('.service-lightbox-prev');
    const next = projectLightbox.querySelector('.service-lightbox-next');
    stage.replaceChildren(createProjectMedia(projectSources[projectIndex]));
    projectLightbox.querySelector('.service-lightbox-page').textContent = (projectIndex + 1) + '-' + projectSources.length;
    prev.disabled = projectIndex <= 0;
    next.disabled = projectIndex >= projectSources.length - 1;
  };
  const openMobileProject = row => {
    const rowTitle = row.querySelector(':scope > span');
    const title = ((rowTitle && rowTitle.textContent) || (row.querySelector('h3') || {}).textContent || '').trim();
    projectModal.querySelector('#landingProjectTitle').textContent = title.toUpperCase();
    /* the whole detail-copy block (title, text, Client/Deliverables list…) goes under the images */
    const copyHost = projectModal.querySelector('.landing-project-copy');
    copyHost.replaceChildren();
    const copy = row.querySelector('.detail-copy');
    if(copy){
      const clone = copy.cloneNode(true);
      clone.classList.remove('swiper-slide');
      clone.removeAttribute('style');
      clone.removeAttribute('role');
      clone.removeAttribute('aria-label');
      copyHost.appendChild(clone);
    }
    const box = projectModal.querySelector('.service-mobile-media');
    box.replaceChildren();
    projectSources = [];
    row.querySelectorAll('.detail-gallery img, .detail-gallery video').forEach(source => {
      const src = source.tagName === 'VIDEO'
        ? ((source.querySelector('source') || source).getAttribute('src'))
        : source.getAttribute('src');
      if(!src) return;
      const media = createProjectMedia(src);
      if(source.tagName === 'VIDEO' && source.getAttribute('poster')) media.poster = source.getAttribute('poster');
      media.dataset.mediaIndex = String(projectSources.length);
      projectSources.push(src);
      box.appendChild(media);
    });
    setOverlayOpen(projectModal, true);
    projectModal.scrollTop = 0;
  };

  if(projectModal && projectLightbox){
    projectModal.querySelector('.service-mobile-close').addEventListener('click', () => setOverlayOpen(projectModal, false));
    projectModal.addEventListener('click', event => {
      if(event.target.closest('a[href="#"]')) event.preventDefault();
      if(event.target === projectModal) setOverlayOpen(projectModal, false);
    });
    projectModal.querySelector('.service-mobile-media').addEventListener('click', event => {
      const media = event.target.closest('img, video');
      if(!media) return;
      projectIndex = Number(media.dataset.mediaIndex) || 0;
      renderProjectLightbox();
      setOverlayOpen(projectLightbox, true);
    });
    projectLightbox.querySelector('.service-lightbox-close').addEventListener('click', () => setOverlayOpen(projectLightbox, false));
    projectLightbox.querySelector('.service-lightbox-prev').addEventListener('click', () => {
      if(projectIndex <= 0) return;
      projectIndex -= 1;
      renderProjectLightbox();
    });
    projectLightbox.querySelector('.service-lightbox-next').addEventListener('click', () => {
      if(projectIndex >= projectSources.length - 1) return;
      projectIndex += 1;
      renderProjectLightbox();
    });
    document.addEventListener('keydown', event => {
      if(event.key !== 'Escape') return;
      if(projectLightbox.classList.contains('is-open')) setOverlayOpen(projectLightbox, false);
      else if(projectModal.classList.contains('is-open')) setOverlayOpen(projectModal, false);
    });
  }

  const activateRow = row => {
    if(projectModal && mobileList.matches) openMobileProject(row);
    else toggleListRow(row);
  };

  listRows.forEach(row => {
    row.addEventListener('click', event => {
      if(event.target.closest('.list-detail')) return;
      activateRow(row);
    });
    row.addEventListener('keydown', event => {
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        activateRow(row);
      }
    });
  });

  /* Desktop: the expanded row's gallery + copy is a Swiper free-mode strip
     (inertia, grab cursor, wheel/trackpad, touch). Mobile keeps the stacked
     CSS layout. Falls back to the hand-rolled drag below if Swiper is absent. */
  const useSwiper = typeof window.Swiper === 'function' && window.matchMedia('(min-width: 768px)').matches;
  const detailSwipers = new Map();

  if(useSwiper){
    galleryList.querySelectorAll('.list-detail').forEach(detail => {
      const wrapper = document.createElement('div');
      wrapper.className = 'swiper-wrapper';
      const slides = [];
      detail.querySelectorAll('.detail-gallery > *').forEach(el => slides.push(el));
      const copy = detail.querySelector('.detail-copy');
      if(copy) slides.push(copy);
      slides.forEach(el => {
        el.classList.add('swiper-slide');
        wrapper.appendChild(el);
      });
      detail.querySelectorAll('.detail-gallery').forEach(g => g.remove());
      detail.appendChild(wrapper);
      detail.classList.add('swiper');

      detailSwipers.set(detail, null);

      if(window.SaffarCloseCursor){
        window.SaffarCloseCursor.bind(detail, target => target.closest('a'));
        detail.addEventListener('click', event => {
          if(event.target.closest('a[href="#"]')) event.preventDefault();
          if(event.target.closest('a')) return;
          if(detail.swiper && !detail.swiper.allowClick) return;
          window.SaffarCloseCursor.hide();
          toggleListRow(detail.closest('.list-row'));
        });
      }
    });
  }

  if(!useSwiper && window.matchMedia('(min-width: 768px)').matches){
    galleryList.querySelectorAll('.list-detail').forEach(detail => {
      let dragStartX = 0;
      let dragStartScroll = 0;
      let isDragging = false;

      detail.addEventListener('pointerdown', event => {
        if(event.pointerType === 'mouse' && event.button !== 0) return;
        isDragging = true;
        dragStartX = event.clientX;
        dragStartScroll = detail.scrollLeft;
        detail.classList.add('dragging');
        detail.setPointerCapture(event.pointerId);
      });

      detail.addEventListener('pointermove', event => {
        if(!isDragging) return;
        detail.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
      });

      const stopDragging = event => {
        isDragging = false;
        detail.classList.remove('dragging');
        if(event.pointerId !== undefined && detail.hasPointerCapture(event.pointerId)) {
          detail.releasePointerCapture(event.pointerId);
        }
      };

      detail.addEventListener('pointerup', stopDragging);
      detail.addEventListener('pointercancel', stopDragging);
      detail.addEventListener('lostpointercapture', () => {
        isDragging = false;
        detail.classList.remove('dragging');
      });

      detail.closest('.list-row').addEventListener('wheel', event => {
        if(!detail.closest('.list-row').classList.contains('open')) return;
        const maxScrollLeft = detail.scrollWidth - detail.clientWidth;
        if(maxScrollLeft <= 0) return;

        const wheelDistance = Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
        const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, detail.scrollLeft + wheelDistance));
        if(nextScrollLeft === detail.scrollLeft) return;

        event.preventDefault();
        detail.scrollLeft = nextScrollLeft;
      }, { passive: false });
    });
  }

  function matchesFilter(el){
    return activeFilter === 'all' || el.dataset.category === activeFilter;
  }
  function visibleItems(){
    return items.filter(el => !el.classList.contains('hidden') && matchesFilter(el));
  }

  function buildColumns(n){
    gallery.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    onScroll();
  }

  function renderAll(){
    items.forEach(item => {
      item.style.display = visibleItems().includes(item) ? '' : 'none';
    });
  }

  /* ---------------- layout / view switching ---------------- */
  const isLanding = document.body.classList.contains("landing-page");
  const defaultCols = isLanding ? 4 : 3;
  let currentCols = defaultCols;
  const mobileGallery = window.matchMedia('(max-width: 700px)');

  function applyLayout(colsOrList){
    if(mobileGallery.matches && colsOrList !== 'list') colsOrList = 2;

    document.querySelectorAll('.view-icons span').forEach(el=>{
      el.classList.toggle('active', el.dataset.cols === String(colsOrList));
    });

    if(colsOrList === 'list'){
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
    const val = el.dataset.cols === 'list' ? 'list' : parseInt(el.dataset.cols, 10);
    el.addEventListener('click', () => applyLayout(val));
  });

  /* ---------------- filter popover ---------------- */
  const filterBtn = document.getElementById('filterBtn');
  const filterPlus = document.getElementById('filterPlus');
  const filterPop = document.getElementById('filterPop');

  const setFiltersOpen = open => {
    filterBtn.classList.toggle('open', open);
    filterBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('filters-modal-open', open && window.matchMedia('(max-width: 700px)').matches);
    if(!open){
      filterPop.querySelectorAll('.desktop-filter-group.open').forEach(group => group.classList.remove('open'));
    }
    if(filterPlus){
      filterPlus.classList.toggle('open', open);
      filterPlus.setAttribute('aria-expanded', String(open));
    }
  };

  const toggleFilters = event => {
    event.stopPropagation();
    setFiltersOpen(!filterBtn.classList.contains('open'));
  };

  filterBtn.setAttribute('aria-expanded', 'false');
  filterBtn.addEventListener('click', function(e){
    e.stopPropagation();
    if(e.target.closest('.filter-pop')) return;
    toggleFilters(e);
  });
  if(filterPlus){
    filterPlus.addEventListener('click', toggleFilters);
    filterPlus.addEventListener('keydown', event => {
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        toggleFilters(event);
      }
    });
  }
  document.addEventListener('click', function(){
    setFiltersOpen(false);
  });

  filterPop.addEventListener('click', event => event.stopPropagation());

  filterPop.querySelectorAll('.desktop-filter-trigger').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.stopPropagation();
      const group = trigger.closest('.desktop-filter-group');
      filterPop.querySelectorAll('.desktop-filter-group').forEach(other => {
        if(other !== group) other.classList.remove('open');
      });
      group.classList.toggle('open');
    });
  });

  filterPop.querySelectorAll('.desktop-filter-menu button').forEach(option => {
    option.addEventListener('click', event => {
      event.stopPropagation();
      const group = option.closest('.desktop-filter-group');
      group.querySelector('.desktop-filter-trigger span').textContent = option.textContent;
      group.querySelectorAll('.desktop-filter-menu button').forEach(item => item.classList.toggle('selected', item === option));
      group.classList.remove('open');
    });
  });

  filterPop.querySelectorAll('.mobile-filter-content .filter-options button').forEach(option => {
    option.addEventListener('click', function(e){
      e.stopPropagation();
      option.classList.toggle('selected');
    });
  });

  filterPop.querySelector('.mobile-filter-close').addEventListener('click', () => setFiltersOpen(false));
  filterPop.querySelector('.mobile-filter-submit').addEventListener('click', () => setFiltersOpen(false));

  /* ---------------- load more (reveals items already in the HTML) ---------------- */
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  loadMoreBtn.addEventListener('click', function(){
    items.forEach(el => el.classList.remove('hidden'));
    listRows.forEach(el => el.classList.remove('hidden'));
    loadMoreBtn.parentElement.style.display = 'none';
    applyLayout(currentCols);
  });

  /* ---------------- scroll wave ---------------- */
  const waveFrequency = 0.01;
  const waveAmplitude = 70;
  const rampDistance = 500;

  let scrollTicking = false;

  function onScroll(){
    /* landing: no scroll-driven column motion on phones */
    if(isLanding && mobileGallery.matches){
      items.forEach(item => { item.style.transform = ''; });
      return;
    }
    if(scrollTicking || galleryWrap.classList.contains('view-list')) return;

    scrollTicking = true;
    requestAnimationFrame(() => {
      const scrollPosition = window.scrollY;
      const isMobile = mobileGallery.matches;
      const activeRampDistance = isMobile ? 320 : rampDistance;
      const activeAmplitude = isMobile ? 28 : waveAmplitude;
      const activeFrequency = isMobile ? .014 : waveFrequency;
      const baseScale = isMobile ? .45 : 1;
      const ramp = Math.max(0, Math.min(1, scrollPosition / activeRampDistance));

      visibleItems().forEach((item, index) => {
        const columnIndex = index % currentCols;
        const baseOffset = columnOffsets[columnIndex % columnOffsets.length];
        const phase = columnPhases[columnIndex % columnPhases.length];
        const wave = Math.sin(scrollPosition * activeFrequency + phase) * activeAmplitude * ramp;

        item.style.transform = `translateY(${baseOffset * baseScale * ramp + wave}px)`;
      });

      scrollTicking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  const handleGalleryBreakpoint = event => {
    if(galleryWrap.classList.contains('view-list')) return;
    applyLayout(event.matches ? 2 : defaultCols);
  };

  if(mobileGallery.addEventListener){
    mobileGallery.addEventListener('change', handleGalleryBreakpoint);
  } else {
    mobileGallery.addListener(handleGalleryBreakpoint);
  }

  /* ---------------- initial render ---------------- */
  applyLayout(mobileGallery.matches ? 2 : defaultCols);
})();
