(() => {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;

  const track = carousel.querySelector('[data-carousel-track]');
  const dotsContainer = carousel.querySelector('[data-carousel-dots]');
  const prevButton = carousel.querySelector('[data-carousel-prev]');
  const nextButton = carousel.querySelector('[data-carousel-next]');
  const filterButtons = document.querySelectorAll('[data-project-filter]');
  const allSlides = Array.from(track.children);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storageKey = 'uxuimar:last-project-selection';

  // The return URL identifies a project by the exact filename already used by
  // its card. This avoids fragile numeric slide indices and preserves UX/Dev.
  const filenameForSlide = (slide) => {
    const href = slide?.querySelector('.project-link[href]')?.getAttribute('href');
    if (!href) return null;
    try {
      return decodeURIComponent(new URL(href, document.baseURI).pathname.split('/').pop());
    } catch (_) {
      return null;
    }
  };

  const findSlide = (filename) => allSlides.find((slide) => filenameForSlide(slide) === filename);

  // Read the saved state BEFORE the first render, since rendering itself
  // updates the stored selection.
  const urlProject = new URLSearchParams(window.location.search).get('project');
  const isHistoryReturn = window.performance?.getEntriesByType?.('navigation')?.[0]?.type === 'back_forward';
  let historyProject = null;
  if (!urlProject && isHistoryReturn) {
    try {
      historyProject = JSON.parse(sessionStorage.getItem(storageKey) || 'null')?.project || null;
    } catch (_) {
      // file:// environments can restrict storage; URL navigation still works.
    }
  }

  let activeCategory = 'ux';
  let activeIndex = 0;
  let visibleSlides = [];
  let touchStartX = 0;
  let initializing = true;

  const rememberSelection = () => {
    const project = filenameForSlide(visibleSlides[activeIndex]);
    if (!project) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ project, category: activeCategory }));
    } catch (_) {
      // Persistence is only an enhancement for the browser's native Back.
    }
  };

  const setActiveSlide = (index) => {
    if (!visibleSlides.length) return;

    activeIndex = (index + visibleSlides.length) % visibleSlides.length;
    track.style.transitionDuration = (initializing || prefersReducedMotion) ? '0ms' : '520ms';
    track.style.transform = `translateX(-${activeIndex * 100}%)`;

    visibleSlides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === activeIndex);
      slide.setAttribute('aria-hidden', slideIndex === activeIndex ? 'false' : 'true');
    });

    Array.from(dotsContainer.children).forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === activeIndex);
      dot.setAttribute('aria-current', dotIndex === activeIndex ? 'true' : 'false');
    });
    rememberSelection();
  };

  const renderDots = () => {
    dotsContainer.innerHTML = '';

    visibleSlides.forEach((slide, index) => {
      const title = slide.querySelector('h3')?.textContent?.trim() || `Project ${index + 1}`;
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `Go to ${title}`);
      dot.addEventListener('click', () => setActiveSlide(index));
      dotsContainer.appendChild(dot);
    });
  };

  const setCategory = (category, index = 0) => {
    if (category !== 'ux' && category !== 'dev') return;
    activeCategory = category;
    activeIndex = 0;
    visibleSlides = allSlides.filter((slide) => slide.dataset.category === activeCategory);

    allSlides.forEach((slide) => {
      const isVisible = slide.dataset.category === activeCategory;
      slide.hidden = !isVisible;
      slide.style.display = isVisible ? 'grid' : 'none';
      slide.classList.toggle('is-active', false);
      slide.setAttribute('aria-hidden', 'true');
    });

    filterButtons.forEach((button) => {
      const isActive = button.dataset.projectFilter === activeCategory;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });

    renderDots();
    setActiveSlide(index);
  };

  prevButton.addEventListener('click', () => setActiveSlide(activeIndex - 1));
  nextButton.addEventListener('click', () => setActiveSlide(activeIndex + 1));

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => setCategory(button.dataset.projectFilter));
  });

  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') setActiveSlide(activeIndex - 1);
    if (event.key === 'ArrowRight') setActiveSlide(activeIndex + 1);
  });

  carousel.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].screenX;
  }, { passive: true });

  carousel.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(distance) < 45) return;
    setActiveSlide(distance > 0 ? activeIndex - 1 : activeIndex + 1);
  }, { passive: true });

  // Save the actual card the visitor opened. This is also useful when they
  // return with the browser's native Back button rather than the case CTA.
  allSlides.forEach((slide) => {
    slide.querySelector('.project-link')?.addEventListener('click', (event) => {
      const project = filenameForSlide(slide);
      if (!project) return;
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({
          project, category: slide.dataset.category
        }));
      } catch (_) {}
      // Preserve the previous page's selected card in the history entry too.
      // Native browser Back then restores this exact UX or Development project
      // even if sessionStorage is unavailable or the page is reloaded.
      const normalClick = !event.defaultPrevented && event.button === 0 &&
        !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
      if (normalClick) {
        try {
          const previousPage = new URL(window.location.href);
          previousPage.searchParams.set('project', project);
          previousPage.hash = 'works';
          window.history.replaceState(window.history.state, '', previousPage.href);
        } catch (_) {}
      }
    });
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    document.querySelectorAll('.section-reveal').forEach((section) => revealObserver.observe(section));
  } else {
    document.querySelectorAll('.section-reveal').forEach((section) => section.classList.add('is-visible'));
  }

  // Return from a case: restore its category and exact project card.
  // Direct visits without a recognized project retain the original UX default.
  const returnSlide = findSlide(urlProject) || findSlide(historyProject);
  if (returnSlide) {
    const category = returnSlide.dataset.category;
    const index = allSlides.filter((slide) => slide.dataset.category === category).indexOf(returnSlide);
    setCategory(category, index);
  } else {
    setCategory(activeCategory);
  }
  requestAnimationFrame(() => { initializing = false; });
})();
