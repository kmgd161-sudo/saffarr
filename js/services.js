(function () {
  const storageKey = 'saffar-selected-services';
  const readSelected = () => { try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { return []; } };
  const writeSelected = items => { try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch (_) {} };

  const servicesPage = document.querySelector('.services-page');
  if (servicesPage) {
    const items = Array.from(document.querySelectorAll('.service-item'));
    const count = document.querySelector('.service-selected-count');
    const planBar = document.querySelector('.service-plan-bar');
    const showcase = document.querySelector('.service-showcase');
    const track = document.querySelector('.service-showcase-track');
    const title = document.querySelector('.service-showcase-title');
    const category = document.querySelector('.service-showcase-category');
    const page = document.querySelector('.service-page');
    const prevButton = document.querySelector('.service-prev');
    const nextButton = document.querySelector('.service-next');
    const mobileQuery = window.matchMedia('(max-width: 767.99px)');
    const mobileModal = document.querySelector('.service-mobile-modal');
    const mobileTitle = document.getElementById('serviceMobileTitle');
    const mobileDescription = document.querySelector('.service-mobile-description');
    const mobileMedia = document.querySelector('.service-mobile-media');
    const mobileSelect = document.querySelector('.service-mobile-select');
    const mobilePlanBar = document.querySelector('.service-mobile-plan-bar');
    const mobilePlanCount = document.querySelector('.service-mobile-plan-count');
    const mobileLightbox = document.querySelector('.service-mobile-lightbox');
    const lightboxStage = document.querySelector('.service-lightbox-stage');
    const lightboxPage = document.querySelector('.service-lightbox-page');
    const lightboxPrev = document.querySelector('.service-lightbox-prev');
    const lightboxNext = document.querySelector('.service-lightbox-next');
    /* desktop: an opened service's gallery + copy is a Swiper free-mode strip; while
       one is open the page's Y scroll is locked so the wheel drives that carousel,
       and the cursor becomes a "×" that closes it. Falls back to scrollLeft drag. */
    const useSwiper = typeof window.Swiper === 'function' && window.matchMedia('(min-width: 768px)').matches;
    let selected = readSelected();
    let galleryImages = [];
    let galleryTitles = [];
    let galleryName = '';
    let galleryIndex = 0;
    let showcaseAnimating = false;
    let activeMobileItem = null;
    let mobileLightboxImages = [];
    let mobileLightboxIndex = 0;

    const servicesSheet = document.querySelector('.services-sheet');
    const servicesHeader = document.querySelector('body.services-page > header');
    let headerTicking = false;
    const syncServicesHeader = () => {
      headerTicking = false;
      if (!servicesSheet || !servicesHeader) return;
      document.body.classList.toggle('services-header-on-sheet', servicesSheet.getBoundingClientRect().top <= servicesHeader.offsetHeight);
    };
    syncServicesHeader();
    window.addEventListener('resize', syncServicesHeader);
    window.addEventListener('scroll', () => {
      if (headerTicking) return;
      headerTicking = true;
      requestAnimationFrame(syncServicesHeader);
    }, { passive: true });

    const syncSelection = () => {
      items.forEach(item => {
        const active = selected.includes(item.dataset.service);
        item.classList.toggle('is-selected', active);
        const button = item.querySelector('.service-select');
        button.innerHTML = active ? 'APPROVED <b>✓</b>' : 'ADD TO PLAN <b>+</b>';
        button.setAttribute('aria-pressed', String(active));
      });
      count.textContent = String(selected.length).padStart(2, '0');
      planBar.classList.toggle('is-visible', selected.length > 0);
      if (activeMobileItem) {
        const active = selected.includes(activeMobileItem.dataset.service);
        mobileSelect.innerHTML = active ? '<b>✓</b>' : 'ADD TO PLAN <b>+</b>';
        mobileSelect.setAttribute('aria-pressed', String(active));
      }
      mobilePlanCount.textContent = String(selected.length).padStart(2, '0');
      mobilePlanBar.classList.toggle('is-visible', selected.length > 0);
      writeSelected(selected);
    };

    const setModalOpen = (element, open) => {
      element.classList.toggle('is-open', open);
      element.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('service-modal-open', mobileModal.classList.contains('is-open') || mobileLightbox.classList.contains('is-open'));
    };

    const openMobileModal = item => {
      activeMobileItem = item;
      mobileTitle.textContent = item.dataset.service.toUpperCase();
      mobileDescription.textContent = item.querySelector('.detail-copy p')?.textContent || '';
      mobileMedia.replaceChildren();
      const sourceMedia = Array.from(item.querySelectorAll('.service-drag img, .service-drag video'));
      sourceMedia.forEach((source, index) => {
        const clone = source.cloneNode(true);
        clone.removeAttribute('controls');
        clone.dataset.mediaIndex = String(index);
        if (clone.tagName === 'VIDEO') {
          clone.muted = true; clone.loop = true; clone.autoplay = true; clone.playsInline = true;
        }
        mobileMedia.appendChild(clone);
      });
      syncSelection();
      setModalOpen(mobileModal, true);
      mobileModal.scrollTop = 0;
      requestAnimationFrame(() => {
        const firstMedia = mobileMedia.firstElementChild;
        if (firstMedia) mobilePlanBar.style.top = Math.round(firstMedia.offsetTop + (firstMedia.offsetHeight * .38)) + 'px';
      });
    };

    const renderMobileLightbox = () => {
      const path = mobileLightboxImages[mobileLightboxIndex];
      if (!path) return;
      galleryName = activeMobileItem?.dataset.service?.toUpperCase() || 'SERVICE';
      lightboxStage.replaceChildren(createShowcaseMedia(path));
      lightboxPage.textContent = (mobileLightboxIndex + 1) + '-' + mobileLightboxImages.length;
      lightboxPrev.disabled = mobileLightboxIndex <= 0;
      lightboxNext.disabled = mobileLightboxIndex >= mobileLightboxImages.length - 1;
    };

    const createShowcaseMedia = (path) => {
      const isVideo = /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(path);
      const media = document.createElement(isVideo ? 'video' : 'img');
      media.src = path;
      if (isVideo) {
        media.muted = true; media.loop = true; media.autoplay = true;
        media.playsInline = true; media.preload = 'metadata';
        media.setAttribute('aria-label', galleryName + ' project video');
      } else {
        media.alt = galleryName + ' project';
      }
      return media;
    };

    const createShowcaseLayer = () => {
      const layer = document.createElement('div');
      layer.className = 'service-showcase-layer';
      const offsets = mobileQuery.matches ? [-1, 0, 1] : [0, 1, 2];
      offsets.forEach(offset => {
        const index = galleryIndex + offset;
        const cell = document.createElement('div');
        cell.className = 'service-showcase-cell';
        if (index >= 0 && index < galleryImages.length) {
          cell.appendChild(createShowcaseMedia(galleryImages[index]));
        } else {
          cell.classList.add('is-empty');
        }
        layer.appendChild(cell);
      });
      return layer;
    };

    const maxShowcaseIndex = () => mobileQuery.matches
      ? Math.max(0, galleryImages.length - 1)
      : Math.max(0, galleryImages.length - 3);

    const renderShowcase = (animate = false, direction = 'next') => {
      if (!galleryImages.length) return;
      const leftIndex = mobileQuery.matches ? galleryIndex - 1 : galleryIndex;
      const rightIndex = mobileQuery.matches ? galleryIndex + 1 : galleryIndex + 2;
      title.textContent = leftIndex >= 0 && leftIndex < galleryImages.length ? (galleryTitles[leftIndex] || galleryName) : '';
      category.textContent = rightIndex >= 0 && rightIndex < galleryImages.length ? (galleryTitles[rightIndex] || galleryName) : '';
      page.textContent = (galleryIndex + 1) + '–' + galleryImages.length;
      prevButton.disabled = galleryIndex <= 0;
      nextButton.disabled = galleryIndex >= maxShowcaseIndex();
      const nextLayer = createShowcaseLayer();
      if (!animate || !track.firstElementChild) {
        track.replaceChildren(nextLayer);
        return;
      }
      showcaseAnimating = true;
      nextLayer.classList.add('is-entering', 'from-' + direction);
      track.appendChild(nextLayer);
      requestAnimationFrame(() => requestAnimationFrame(() => nextLayer.classList.add('is-active')));
      window.setTimeout(() => {
        Array.from(track.children).forEach(layer => { if (layer !== nextLayer) layer.remove(); });
        nextLayer.classList.remove('is-entering', 'is-active', 'from-' + direction);
        showcaseAnimating = false;
      }, 920);
    };

    items.forEach(item => {
      item.querySelector('.service-toggle').addEventListener('click', event => {
        event.preventDefault();
        if (mobileQuery.matches) {
          items.forEach(other => other.classList.remove('is-open'));
          openMobileModal(item);
          return;
        }
        const open = !item.classList.contains('is-open');
        items.forEach(other => {
          other.classList.remove('is-open');
          other.querySelectorAll('video').forEach(video => video.pause());
        });
        item.classList.toggle('is-open', open);
        if (open) item.querySelectorAll('.service-drag video').forEach(video => video.play().catch(() => {}));
      });
      item.querySelector('.service-select').addEventListener('click', () => {
        if (mobileQuery.matches) {
          items.forEach(other => other.classList.remove('is-open'));
          openMobileModal(item);
          return;
        }
        const name = item.dataset.service;
        selected = selected.includes(name) ? selected.filter(value => value !== name) : selected.concat(name);
        syncSelection();
      });
      const drag = item.querySelector('.service-detail');
      if (useSwiper) {
        const rail = drag.querySelector('.service-drag');
        const copy = drag.querySelector('.detail-copy');
        if (copy) rail.appendChild(copy);
        rail.classList.add('swiper-wrapper');
        Array.from(rail.children).forEach(el => el.classList.add('swiper-slide'));
        drag.classList.add('swiper');
        if (window.SaffarCloseCursor) {
          const isMedia = target => target.closest('.service-drag img, .service-drag video');
          const skipClose = target => isMedia(target) || target.closest('a');
          window.SaffarCloseCursor.bind(drag, skipClose);
          drag.addEventListener('click', event => {
            if (skipClose(event.target) || (drag.swiper && !drag.swiper.allowClick)) return;
            window.SaffarCloseCursor.hide();
            item.classList.remove('is-open');
          });
        }
      }
      /* the title inside the carousel is a "#" link — don't jump to the top */
      drag.addEventListener('click', event => { if (event.target.closest('a[href="#"]')) event.preventDefault(); });
      let down = false, captured = false, startX = 0, startScroll = 0;
      if (!useSwiper) {
      drag.addEventListener('pointerdown', event => { down = true; captured = false; startX = event.clientX; startScroll = drag.scrollLeft; item.dataset.wasDragged = 'false'; });
      drag.addEventListener('pointermove', event => {
        if (!down) return;
        const delta = event.clientX - startX;
        if (Math.abs(delta) > 6) {
          item.dataset.wasDragged = 'true';
          if (!captured) { drag.setPointerCapture(event.pointerId); captured = true; }
        }
        drag.scrollLeft = startScroll - delta;
      });
      drag.addEventListener('pointerup', event => {
        down = false;
        if (captured && drag.hasPointerCapture(event.pointerId)) drag.releasePointerCapture(event.pointerId);
        captured = false;
        setTimeout(() => { item.dataset.wasDragged = 'false'; }, 0);
      });
      drag.addEventListener('pointercancel', () => { down = false; captured = false; item.dataset.wasDragged = 'false'; });
      }
      let wheelTimer;
      if (!useSwiper) item.addEventListener('wheel', event => {
        if (!item.classList.contains('is-open') || drag.scrollWidth <= drag.clientWidth) return;
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        const next = drag.scrollLeft + delta;
        const canMove = (delta < 0 && drag.scrollLeft > 0) || (delta > 0 && drag.scrollLeft < drag.scrollWidth - drag.clientWidth - 1);
        if (canMove) {
          event.preventDefault();
          drag.classList.add('wheel-scrolling');
          drag.scrollLeft = next;
          window.clearTimeout(wheelTimer);
          wheelTimer = window.setTimeout(() => drag.classList.remove('wheel-scrolling'), 140);
        }
      }, { passive: false });
    });
    /* Desktop: the 3-up gallery (with the animated image change) sits permanently
       below the list, independent of the accordions (clicking the carousel boxes
       in a service row does not touch it); it starts on the first service. */
    if (items[0] && !mobileQuery.matches) {
      const first = items[0];
      galleryImages = first.dataset.gallery.split(',').map(path => path.trim()).filter(Boolean);
      galleryIndex = 0;
      galleryName = first.dataset.service.toUpperCase();
      galleryTitles = Array.from(first.querySelectorAll('.service-drag img, .service-drag video')).map((entry, index) =>
        (entry.dataset.title || entry.getAttribute('alt') || entry.getAttribute('aria-label') || (galleryName + ' ' + String(index + 1))).toUpperCase()
      );
      showcase.classList.add('is-visible');
      renderShowcase();
    }

    if (useSwiper) {
      const root = document.documentElement;
      let lastOpen = null;
      const detailOf = item => item.querySelector('.service-detail');
      const syncDetailLock = () => {
        const openItem = items.find(item => item.classList.contains('is-open')) || null;
        if (openItem === lastOpen) return;
        lastOpen = openItem;
        if (!openItem) {
          root.classList.remove('detail-locked');
          document.body.classList.remove('detail-locked');
          items.forEach(item => { const sw = detailOf(item).swiper; if (sw) sw.mousewheel.disable(); });
          return;
        }
        if (!root.classList.contains('detail-locked')) {
          root.style.setProperty('--sbw', (window.innerWidth - root.clientWidth) + 'px');
          root.classList.add('detail-locked');
          document.body.classList.add('detail-locked');
        }
        const detail = detailOf(openItem);
        const sw = detail.swiper || new Swiper(detail, {
          slidesPerView: 'auto',
          spaceBetween: 20,
          watchOverflow: false,
          freeMode: { enabled: true, momentumRatio: 0.9, momentumVelocityRatio: 0.8 },
          grabCursor: true,
          resistanceRatio: 0.6,
          mousewheel: { enabled: false, eventsTarget: 'body', forceToAxis: false, sensitivity: 1, releaseOnEdges: false },
          speed: 600,
          on: {
            /* slides moving under a still cursor would re-trigger hover every frame */
            setTranslate(swiper) {
              swiper.el.classList.add('is-moving');
              clearTimeout(swiper._movingTimer);
              swiper._movingTimer = setTimeout(() => swiper.el.classList.remove('is-moving'), 140);
            }
          }
        });
        // items.forEach(item => { const other = detailOf(item).swiper; if (other && other !== sw) other.mousewheel.disable(); });
        sw.slideTo(0, 0);
        sw.update();
        // sw.mousewheel.enable();
        window.scrollTo({ top: Math.max(0, openItem.getBoundingClientRect().top + window.scrollY - 110), behavior: 'smooth' });
        window.setTimeout(() => sw.update(), 600);


           
      };
      const observer = new MutationObserver(syncDetailLock);
      items.forEach(item => observer.observe(item, { attributes: true, attributeFilter: ['class'] }));
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') items.forEach(item => item.classList.remove('is-open'));
      });
    }
    document.querySelector('.service-mobile-close').addEventListener('click', () => setModalOpen(mobileModal, false));
    mobileModal.addEventListener('click', event => { if (event.target === mobileModal) setModalOpen(mobileModal, false); });
    mobileSelect.addEventListener('click', () => {
      if (!activeMobileItem) return;
      const name = activeMobileItem.dataset.service;
      const willAdd = !selected.includes(name);
      selected = willAdd ? selected.concat(name) : selected.filter(value => value !== name);
      syncSelection();
    });
    mobileMedia.addEventListener('click', event => {
      const media = event.target.closest('img, video');
      if (!media || !activeMobileItem) return;
      mobileLightboxImages = activeMobileItem.dataset.gallery.split(',').map(path => path.trim()).filter(Boolean);
      mobileLightboxIndex = Number(media.dataset.mediaIndex) || 0;
      renderMobileLightbox();
      setModalOpen(mobileLightbox, true);
    });
    document.querySelector('.service-lightbox-close').addEventListener('click', () => setModalOpen(mobileLightbox, false));
    lightboxPrev.addEventListener('click', () => { if (mobileLightboxIndex <= 0) return; mobileLightboxIndex -= 1; renderMobileLightbox(); });
    lightboxNext.addEventListener('click', () => { if (mobileLightboxIndex >= mobileLightboxImages.length - 1) return; mobileLightboxIndex += 1; renderMobileLightbox(); });
    prevButton.addEventListener('click', () => { if (showcaseAnimating || galleryIndex <= 0) return; galleryIndex -= 1; renderShowcase(true, 'prev'); });
    nextButton.addEventListener('click', () => { if (showcaseAnimating || galleryIndex >= maxShowcaseIndex()) return; galleryIndex += 1; renderShowcase(true, 'next'); });
    syncSelection();
  }

  const orderServices = document.querySelector('.order-services');
  if (orderServices) {
    let selected = readSelected();
    const render = () => {
      orderServices.innerHTML = '';
      selected.forEach(name => {
        const button = document.createElement('button'); button.type = 'button'; button.innerHTML = '<span>' + name + '</span><b>×</b>';
        button.addEventListener('click', () => { selected = selected.filter(value => value !== name); writeSelected(selected); render(); });
        orderServices.appendChild(button);
      });
      if (!selected.length) orderServices.innerHTML = '<a href="/Service">Choose services' + '<span class="plus">+</span>' + '</a>';
    };
    render();
  }
}());
