(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Mobile menu
  const toggle = $("[data-menu-toggle]");
  const mobileNav = $("[data-mobile-nav]");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      mobileNav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", mobileNav.classList.contains("open") ? "true" : "false");
    });
    $$("[data-mobile-nav] a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Tracking helpers
  window.trackEvent = function trackEvent(name, params = {}) {
    try {
      if (window.gtag) window.gtag("event", name, params);
      if (window.fbq) window.fbq("trackCustom", name, params);
    } catch (e) {
      // silencioso
    }
  };

  // Click tracking by data attributes
  $$("[data-track]").forEach((el) => {
    el.addEventListener("click", () => {
      const evt = el.getAttribute("data-track");
      const label = el.getAttribute("data-track-label") || el.textContent.trim();
      window.trackEvent(evt, { label, page: location.pathname });
    });
  });

  // Contact form tracking
  const contactForm = $("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", () => {
      window.trackEvent("lead_submit", { page: location.pathname });
      if (window.fbq) window.fbq("track", "Lead");
    });
  }
})();
