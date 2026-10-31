/* Shared UX/UI portfolio case-study enhancements.
 * No external libraries; legacy content stays available if JS is disabled.
 */
document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector("main");
  const content = main?.querySelector(".case-study-content");
  if (!document.body.classList.contains("case-page") || !content) return;

  // A common exit action for the original UX/UI and development projects.
  // Value Delivery already contains its own bottom CTA.
  if (!main.querySelector(".ux-bottom-link, .case-project-navigation")) {
    const nav = document.createElement("nav");
    nav.className = "case-project-navigation container d-flex justify-content-center";
    nav.setAttribute("aria-label", "Project navigation");
    const link = document.createElement("a");
    link.className = "case-back-link mb-0";
    link.href = "index.html#works";
    link.setAttribute("aria-label", "Back to all projects");
    const icon = document.createElement("i");
    icon.className = "bi bi-arrow-left";
    icon.setAttribute("aria-hidden", "true");
    link.append(icon, document.createTextNode("Back to all projects"));
    nav.append(link);
    content.insertAdjacentElement("afterend", nav);
  }

  /** Convert *only* the Prototype image grids into an accessible, swipeable gallery.
   * Comparisons (Before / After) keep their labels. UI Kit, research images,
   * persona cards and single-image sections remain unchanged.
   */
  if (!document.body.classList.contains("new-ux-page")) {
    const sections = Array.from(content.children);
    sections.forEach((section) => {
      const prototypeHeading = Array.from(section.querySelectorAll("h1, h2, h3"))
        .find((heading) => /^prototype(?:s)?$/i.test(heading.textContent.trim()));
      if (!prototypeHeading) return;

      // A legacy .container-fluid may accidentally contain several visual sections
      // (Prototype, UI Kit, Thanks). Only the Prototype heading's own content block
      // belongs to this gallery. Never include later headings or their images.
      const prototypeBlock = prototypeHeading.parentElement;
      if (!prototypeBlock || prototypeBlock.querySelector(".case-prototype-gallery")) return;
      const images = Array.from(prototypeBlock.querySelectorAll("img"))
        .filter((img) => !/\.svg(?:\?|$)/i.test(img.getAttribute("src") || ""));
      if (images.length < 2) return;

      // Remember the original media row *before* moving image elements.
      // Place the gallery where the images were, NOT after the parent section:
      // on older pages that section can also contain the UI Kit and thank-you area.
      const firstImageRow = images[0].closest(".row");
      const insertionPoint = firstImageRow && prototypeBlock.contains(firstImageRow)
        ? firstImageRow : images[0].parentElement;

      const gallery = document.createElement("div");
      gallery.className = "container case-prototype-gallery-wrap";
      const region = document.createElement("section");
      region.className = "case-prototype-gallery";
      region.setAttribute("aria-label", "Prototype image gallery");
      region.setAttribute("aria-roledescription", "carousel");
      const top = document.createElement("div");
      top.className = "case-gallery-top";
      const heading = document.createElement("h3");
      heading.className = "case-gallery-heading";
      heading.textContent = "Explore the prototype";
      const hint = document.createElement("p");
      hint.className = "case-gallery-hint";
      hint.textContent = "Swipe or use the arrows to browse screens. Select an image to enlarge.";
      top.append(heading, hint);
      const track = document.createElement("div");
      track.className = "case-gallery-track";
      track.tabIndex = 0;
      track.setAttribute("aria-label", "Prototype screens");
      const bottom = document.createElement("div");
      bottom.className = "case-gallery-controls";
      const previous = document.createElement("button");
      previous.type = "button";
      previous.className = "case-gallery-arrow";
      previous.setAttribute("aria-label", "Previous prototype screen");
      previous.innerHTML = '<i class="bi bi-arrow-left" aria-hidden="true"></i>';
      const progress = document.createElement("span");
      progress.className = "case-gallery-progress";
      progress.setAttribute("aria-live", "polite");
      progress.setAttribute("aria-atomic", "true");
      const next = document.createElement("button");
      next.type = "button";
      next.className = "case-gallery-arrow";
      next.setAttribute("aria-label", "Next prototype screen");
      next.innerHTML = '<i class="bi bi-arrow-right" aria-hidden="true"></i>';
      bottom.append(previous, progress, next);
      region.append(top, track, bottom);
      gallery.append(region);

      const originals = new Set();
      const slides = [];
      images.forEach((img, index) => {
        const column = img.closest('.row > [class*="col-"]');
        const original = column || img.parentElement;
        if (original) originals.add(original);
        const label = column?.querySelector('.featurette-heading.fs-5, .featurette-heading.h5, h3, h4')?.textContent.trim()
          || `Screen ${index + 1}`;
        img.removeAttribute("width");
        img.removeAttribute("height");
        img.loading = index === 0 ? "eager" : "lazy";
        img.decoding = "async";
        if (!img.getAttribute("alt")) img.alt = `Prototype — ${label}`;

        const figure = document.createElement("figure");
        figure.className = "case-gallery-slide";
        figure.setAttribute("role", "group");
        figure.setAttribute("aria-roledescription", "slide");
        figure.setAttribute("aria-label", `${index + 1} of ${images.length}: ${label}`);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "case-gallery-image-button";
        button.setAttribute("aria-label", `Enlarge prototype: ${label}`);
        button.append(img); // move the original node, never duplicate image requests
        const caption = document.createElement("figcaption");
        caption.className = "case-gallery-caption";
        caption.textContent = label;
        figure.append(button, caption);
        track.append(figure);
        slides.push({ img, label, button });
      });
      if (slides.length < 2) return;

      // Remove the now-empty legacy image columns and their spacer rows.
      // The explanatory copy and section heading are never hidden.
      originals.forEach((node) => node.classList.add("case-gallery-original"));
      const rows = new Set(Array.from(originals, (node) => node.closest(".row")).filter(Boolean));
      rows.forEach((row) => {
        const visibleChildren = Array.from(row.children).filter((child) =>
          !child.classList.contains("case-gallery-original") && (child.textContent.trim() || child.querySelector("img"))
        );
        if (visibleChildren.length === 0) row.classList.add("case-gallery-original");
      });
      if (insertionPoint?.parentElement) {
        insertionPoint.insertAdjacentElement("beforebegin", gallery);
      } else {
        prototypeBlock.append(gallery);
      }

      let active = 0;
      const update = () => {
        progress.textContent = `${active + 1} / ${slides.length}`;
        previous.disabled = active === 0;
        next.disabled = active === slides.length - 1;
      };
      const go = (index) => {
        active = Math.max(0, Math.min(slides.length - 1, index));
        track.scrollTo({ left: active * track.clientWidth, behavior: "smooth" });
        update();
      };
      previous.addEventListener("click", () => go(active - 1));
      next.addEventListener("click", () => go(active + 1));
      let scrollFrame;
      track.addEventListener("scroll", () => {
        if (scrollFrame) cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(() => {
          active = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / Math.max(track.clientWidth, 1))));
          update();
        });
      }, { passive: true });
      region.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); go(active + 1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); go(active - 1); }
      });
      update();

      // Native accessible dialog for detailed prototype viewing.
      if (typeof HTMLDialogElement !== "undefined") {
        const modal = document.createElement("dialog");
        modal.className = "case-gallery-lightbox";
        modal.setAttribute("aria-label", "Enlarged prototype image");
        const modalClose = document.createElement("button");
        modalClose.className = "case-gallery-modal-close";
        modalClose.type = "button";
        modalClose.setAttribute("aria-label", "Close enlarged image");
        modalClose.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
        const modalImg = document.createElement("img");
        modalImg.alt = "";
        const modalCaption = document.createElement("p");
        modalCaption.className = "case-gallery-modal-caption";
        modal.append(modalClose, modalImg, modalCaption);
        document.body.append(modal);
        let launchButton = null;
        const close = () => modal.close();
        modalClose.addEventListener("click", close);
        modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
        modal.addEventListener("close", () => launchButton?.focus());
        slides.forEach((slide, index) => {
          slide.button.addEventListener("click", () => {
            launchButton = slide.button;
            modalImg.src = slide.img.currentSrc || slide.img.src;
            modalImg.alt = slide.img.alt;
            modalCaption.textContent = `${index + 1} / ${slides.length} — ${slide.label}`;
            modal.showModal();
          });
        });
      }
    });
  }

  // Keep content visible without animation delays on small screens or reduced motion.
  const reveals = document.querySelectorAll("[data-reveal], .case-study-content .container-fluid");
  const noAnimation = window.matchMedia("(max-width: 767.98px), (prefers-reduced-motion: reduce)").matches;
  if (noAnimation || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.05, rootMargin: "0px 0px 80px 0px" });
  reveals.forEach((el) => {
    el.setAttribute("data-reveal", "");
    observer.observe(el);
  });
});
