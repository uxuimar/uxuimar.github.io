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

  let activeCategory = 'ux';
  let activeIndex = 0;
  let visibleSlides = [];
  let touchStartX = 0;

  const setActiveSlide = (index) => {
    if (!visibleSlides.length) return;

    activeIndex = (index + visibleSlides.length) % visibleSlides.length;
    track.style.transitionDuration = prefersReducedMotion ? '0ms' : '520ms';
    track.style.transform = `translateX(-${activeIndex * 100}%)`;

    visibleSlides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === activeIndex);
      slide.setAttribute('aria-hidden', slideIndex === activeIndex ? 'false' : 'true');
    });

    Array.from(dotsContainer.children).forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === activeIndex);
      dot.setAttribute('aria-current', dotIndex === activeIndex ? 'true' : 'false');
    });
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

  const setCategory = (category) => {
    activeCategory = category;
    activeIndex = 0;
    visibleSlides = allSlides.filter((slide) => slide.dataset.category === activeCategory);

    allSlides.forEach((slide) => {
      const isVisible = slide.dataset.category === activeCategory;
      slide.hidden = !isVisible;
      slide.style.display = isVisible ? 'grid' : 'none';
    });

    filterButtons.forEach((button) => {
      const isActive = button.dataset.projectFilter === activeCategory;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });

    renderDots();
    setActiveSlide(0);
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

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  document.querySelectorAll('.section-reveal').forEach((section) => revealObserver.observe(section));

  setCategory(activeCategory);
})();
