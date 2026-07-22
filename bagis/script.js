(() => {
  "use strict";

  /* ---------------------------------------------------------
     Central configuration
     --------------------------------------------------------- */

  const DONATION_URL = "#";
  const SHARE_TEXT =
    "Birlikte İyilik Akademi’nin eğitim ve iyilik çalışmalarının daha fazla çocuğa ulaşmasına destek olabilirsiniz.";
  const SHARE_TITLE = "Bir İyiliğe Davetlisiniz | Birlikte İyilik Akademi";

  const page = document.getElementById("bia-donation-page");
  if (!page) return;

  const assetsRoot = page.dataset.biaDonationAssetsRoot || "assets";
  const ASSET_PATHS = Object.freeze({
    logo: `${assetsRoot}/logo.png`,
    welcome: `${assetsRoot}/welcome-intro.mp4`,
    video: `${assetsRoot}/hero-desktop.mp4`,
    poster: `${assetsRoot}/poster-desktop.jpg`,
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const mobileViewport = window.matchMedia("(max-width: 767px)");

  page.classList.add("bia-donation-js");

  const welcome = page.querySelector("[data-bia-donation-welcome]");
  const welcomeVideo = page.querySelector("[data-bia-donation-welcome-video]");
  const welcomeSkip = page.querySelector("[data-bia-donation-welcome-skip]");
  const siteSkipLink = document.querySelector(".bia-donation-skip-link");
  const welcomeBackgroundState = welcome
    ? Array.from(page.children)
        .filter((element) => element !== welcome)
        .map((element) => ({ element, wasInert: element.hasAttribute("inert") }))
    : [];
  let welcomeIsActive = Boolean(welcome && welcomeVideo && !reducedMotion.matches);
  let welcomeDismissTimer = 0;
  let welcomeSafetyTimer = 0;

  /* ---------------------------------------------------------
     Shared helpers
     --------------------------------------------------------- */

  const toast = page.querySelector("[data-bia-donation-toast]");
  let toastTimer = 0;

  const showToast = (message) => {
    if (!toast || !message) return;

    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("bia-donation-is-visible");

    toastTimer = window.setTimeout(() => {
      toast.classList.remove("bia-donation-is-visible");
    }, 3200);
  };

  const scrollToElement = (element) => {
    if (!element) return;
    element.scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
  };

  const copyText = async (value) => {
    if (!value) return false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (_error) {
        // The local file protocol may not allow the async clipboard API.
      }
    }

    const temporaryField = document.createElement("textarea");
    temporaryField.className = "bia-donation-clipboard-fallback";
    temporaryField.value = value;
    temporaryField.setAttribute("readonly", "");
    temporaryField.style.position = "fixed";
    temporaryField.style.top = "-1000px";
    temporaryField.style.opacity = "0";
    page.appendChild(temporaryField);
    temporaryField.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (_error) {
      copied = false;
    }

    temporaryField.remove();
    return copied;
  };

  /* ---------------------------------------------------------
     Central asset paths and video lifecycle
     --------------------------------------------------------- */

  const hero = page.querySelector("[data-bia-donation-hero]");
  const video = page.querySelector("[data-bia-donation-video]");
  const posterImage = hero?.querySelector(".bia-donation-hero-poster");
  const logoImages = page.querySelectorAll(".bia-donation-logo-image");

  logoImages.forEach((image) => {
    image.src = ASSET_PATHS.logo;
  });

  if (posterImage) posterImage.src = ASSET_PATHS.poster;

  const safelyPlayVideo = () => {
    if (!video || welcomeIsActive || reducedMotion.matches || document.hidden) return;

    try {
      const playRequest = video.play();
      if (playRequest && typeof playRequest.catch === "function") {
        playRequest.catch(() => {
          // Autoplay restrictions are expected in some browsers.
        });
      }
    } catch (_error) {
      // A blocked autoplay must never interrupt the page.
    }
  };

  const setVideoReady = () => {
    if (!hero || reducedMotion.matches) return;
    hero.classList.add("bia-donation-video-ready");
  };

  if (video) {
    const source = video.querySelector("source");
    video.poster = ASSET_PATHS.poster;
    video.muted = true;
    if (source) source.src = ASSET_PATHS.video;

    video.addEventListener("loadeddata", setVideoReady, { once: true });
    video.addEventListener("error", () => {
      hero?.classList.remove("bia-donation-video-ready");
    });

    if (video.readyState >= 2) setVideoReady();

    if (reducedMotion.matches || welcomeIsActive) {
      video.pause();
      if (reducedMotion.matches) hero?.classList.remove("bia-donation-video-ready");
    } else {
      safelyPlayVideo();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        video.pause();
      } else {
        safelyPlayVideo();
      }
    });

    const handleMotionPreference = () => {
      if (reducedMotion.matches) {
        video.pause();
        hero?.classList.remove("bia-donation-video-ready");
      } else {
        if (video.readyState >= 2) setVideoReady();
        safelyPlayVideo();
      }
    };

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", handleMotionPreference);
    } else if (typeof reducedMotion.addListener === "function") {
      reducedMotion.addListener(handleMotionPreference);
    }
  }

  /* ---------------------------------------------------------
     Full-screen welcome video
     --------------------------------------------------------- */

  const finishWelcome = () => {
    if (!welcome) return;
    welcome.hidden = true;
    welcome.classList.remove("bia-donation-is-leaving");
  };

  const setWelcomeBackgroundInert = (isInert) => {
    welcomeBackgroundState.forEach(({ element, wasInert }) => {
      if (isInert || wasInert) element.setAttribute("inert", "");
      else element.removeAttribute("inert");
    });
  };

  const dismissWelcome = (immediate = false) => {
    if (!welcome) return;

    welcomeIsActive = false;
    window.clearTimeout(welcomeDismissTimer);
    window.clearTimeout(welcomeSafetyTimer);
    welcomeVideo?.pause();
    document.body.classList.remove("bia-donation-intro-active");
    welcome.setAttribute("aria-hidden", "true");
    setWelcomeBackgroundInert(false);

    if (immediate || reducedMotion.matches) {
      finishWelcome();
    } else {
      welcome.classList.add("bia-donation-is-leaving");
      welcomeDismissTimer = window.setTimeout(finishWelcome, 900);
    }

    safelyPlayVideo();
  };

  const playWelcome = () => {
    if (!welcomeIsActive || !welcomeVideo || document.hidden) return;

    welcomeVideo.muted = true;
    welcomeVideo.defaultMuted = true;

    try {
      const playRequest = welcomeVideo.play();
      if (playRequest && typeof playRequest.catch === "function") {
        playRequest.catch(() => {
          window.setTimeout(() => dismissWelcome(), 900);
        });
      }
    } catch (_error) {
      window.setTimeout(() => dismissWelcome(), 900);
    }
  };

  if (welcome && welcomeVideo) {
    const source = welcomeVideo.querySelector("source");
    if (source) source.src = ASSET_PATHS.welcome;

    if (reducedMotion.matches) {
      dismissWelcome(true);
    } else {
      document.body.classList.add("bia-donation-intro-active");
      welcome.setAttribute("aria-hidden", "false");
      setWelcomeBackgroundInert(true);

      welcomeVideo.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(welcomeVideo.duration)) {
          welcome.style.setProperty("--bia-donation-welcome-duration", `${welcomeVideo.duration}s`);
        }
      }, { once: true });
      welcomeVideo.addEventListener("ended", () => dismissWelcome(), { once: true });
      welcomeVideo.addEventListener("error", () => dismissWelcome(), { once: true });
      welcomeSkip?.addEventListener("click", () => {
        dismissWelcome();
        window.setTimeout(() => {
          document.getElementById("bia-donation-main")?.focus({ preventScroll: true });
        }, 900);
      });
      siteSkipLink?.addEventListener("click", () => {
        if (welcomeIsActive) dismissWelcome(true);
      });

      welcomeSafetyTimer = window.setTimeout(() => dismissWelcome(), 14000);
      playWelcome();
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && welcomeIsActive) dismissWelcome();
    });

    document.addEventListener("visibilitychange", () => {
      if (!welcomeIsActive) return;
      if (document.hidden) welcomeVideo.pause();
      else playWelcome();
    });

    const handleWelcomeMotionPreference = () => {
      if (reducedMotion.matches && welcomeIsActive) dismissWelcome(true);
    };

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", handleWelcomeMotionPreference);
    } else if (typeof reducedMotion.addListener === "function") {
      reducedMotion.addListener(handleWelcomeMotionPreference);
    }
  } else {
    welcomeIsActive = false;
  }

  /* ---------------------------------------------------------
     Donation, copy and sharing actions
     --------------------------------------------------------- */

  const bankSection = page.querySelector("[data-bia-donation-bank-section]");
  const donationLinks = page.querySelectorAll("[data-bia-donation-link]");

  donationLinks.forEach((link) => {
    link.setAttribute("href", DONATION_URL || "#");
    link.addEventListener("click", (event) => {
      if (DONATION_URL && DONATION_URL !== "#") return;

      event.preventDefault();
      scrollToElement(bankSection);
      showToast("Bağış için banka bilgilerine yönlendirildiniz.");
      closeMobileMenu(false);
    });
  });

  page.querySelectorAll("[data-bia-donation-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.biaDonationCopy || "";
      const copied = await copyText(value);
      showToast(copied ? "IBAN panoya kopyalandı." : "IBAN kopyalanamadı. Lütfen metni seçerek kopyalayın.");
    });
  });

  const shareButton = page.querySelector("[data-bia-donation-share]");
  if (shareButton) {
    shareButton.addEventListener("click", async () => {
      const shareUrl = window.location.href.split("#")[0];

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: SHARE_TITLE,
            text: SHARE_TEXT,
            url: shareUrl,
          });
          showToast("İyilik daveti paylaşım için hazırlandı.");
          return;
        } catch (error) {
          if (error && error.name === "AbortError") return;
        }
      }

      const copied = await copyText(shareUrl);
      showToast(copied ? "Davet bağlantısı panoya kopyalandı." : "Bağlantı kopyalanamadı.");
    });
  }

  page.querySelectorAll("[data-bia-donation-placeholder]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showToast(link.dataset.biaDonationPlaceholder || "Bu bağlantı yakında eklenecek.");
    });
  });

  /* ---------------------------------------------------------
     Accessible mobile menu
     --------------------------------------------------------- */

  const header = page.querySelector("[data-bia-donation-header]");
  const menuToggle = page.querySelector("[data-bia-donation-menu-toggle]");
  const mobileMenu = page.querySelector("[data-bia-donation-mobile-menu]");
  let menuCloseTimer = 0;

  function openMobileMenu() {
    if (!menuToggle || !mobileMenu || !mobileViewport.matches) return;

    window.clearTimeout(menuCloseTimer);
    mobileMenu.hidden = false;
    mobileMenu.removeAttribute("inert");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Menüyü kapat");

    window.setTimeout(() => {
      mobileMenu.classList.add("bia-donation-is-open");
      mobileMenu.querySelector("a")?.focus({ preventScroll: true });
    }, reducedMotion.matches ? 0 : 20);
  }

  function closeMobileMenu(returnFocus = true) {
    if (!menuToggle || !mobileMenu) return;

    window.clearTimeout(menuCloseTimer);
    mobileMenu.classList.remove("bia-donation-is-open");
    mobileMenu.setAttribute("inert", "");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Menüyü aç");

    const finishClose = () => {
      mobileMenu.hidden = true;
      if (returnFocus && mobileViewport.matches) {
        menuToggle.focus({ preventScroll: true });
      }
    };

    if (reducedMotion.matches || mobileMenu.hidden) {
      finishClose();
    } else {
      menuCloseTimer = window.setTimeout(finishClose, 190);
    }
  }

  if (menuToggle && mobileMenu) {
    mobileMenu.setAttribute("inert", "");

    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMobileMenu();
      else openMobileMenu();
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMobileMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
        closeMobileMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        menuToggle.getAttribute("aria-expanded") === "true" &&
        header &&
        !header.contains(event.target)
      ) {
        closeMobileMenu(false);
      }
    });

    const handleViewportChange = () => {
      if (!mobileViewport.matches) closeMobileMenu(false);
    };

    if (typeof mobileViewport.addEventListener === "function") {
      mobileViewport.addEventListener("change", handleViewportChange);
    } else if (typeof mobileViewport.addListener === "function") {
      mobileViewport.addListener(handleViewportChange);
    }
  }

  /* ---------------------------------------------------------
     Smooth in-page navigation
     --------------------------------------------------------- */

  page.querySelectorAll('a[href^="#"]:not([data-bia-donation-link]):not([data-bia-donation-placeholder])').forEach((link) => {
    link.addEventListener("click", (event) => {
      const selector = link.getAttribute("href");
      if (!selector || selector === "#") return;

      const target = page.querySelector(selector);
      if (!target) return;

      event.preventDefault();
      closeMobileMenu(false);
      scrollToElement(target);
    });
  });

  /* ---------------------------------------------------------
     Navbar state, reveal animation and sticky donation bar
     --------------------------------------------------------- */

  const navSentinel = page.querySelector("[data-bia-donation-nav-sentinel]");

  if (header && navSentinel && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(([entry]) => {
      header.classList.toggle("bia-donation-is-scrolled", !entry.isIntersecting);
    });
    navObserver.observe(navSentinel);
  } else if (header) {
    const updateHeader = () => {
      header.classList.toggle("bia-donation-is-scrolled", window.scrollY > 60);
    };
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
  }

  const revealItems = page.querySelectorAll(".bia-donation-reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("bia-donation-is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -9% 0px", threshold: 0.08 },
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("bia-donation-is-visible"));
  }

  const mobileSticky = page.querySelector("[data-bia-donation-mobile-sticky]");
  const finalCta = page.querySelector("[data-bia-donation-final-cta]");
  const footer = page.querySelector("[data-bia-donation-footer]");
  const stickyBlockers = new Set();
  let heroStillVisible = true;

  const updateMobileSticky = () => {
    if (!mobileSticky) return;
    const shouldShow = mobileViewport.matches && !heroStillVisible && stickyBlockers.size === 0;
    mobileSticky.classList.toggle("bia-donation-is-visible", shouldShow);
    mobileSticky.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  };

  if (mobileSticky && hero && "IntersectionObserver" in window) {
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroStillVisible = entry.isIntersecting && entry.intersectionRatio > 0.04;
        updateMobileSticky();
      },
      { threshold: [0, 0.04, 0.1] },
    );
    heroObserver.observe(hero);

    const blockerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) stickyBlockers.add(entry.target);
          else stickyBlockers.delete(entry.target);
        });
        updateMobileSticky();
      },
      { threshold: 0.04 },
    );

    [bankSection, finalCta, footer].filter(Boolean).forEach((section) => blockerObserver.observe(section));
  }

  if (typeof mobileViewport.addEventListener === "function") {
    mobileViewport.addEventListener("change", updateMobileSticky);
  } else if (typeof mobileViewport.addListener === "function") {
    mobileViewport.addListener(updateMobileSticky);
  }

  /* ---------------------------------------------------------
     Fine-pointer parallax (disabled on touch and reduced motion)
     --------------------------------------------------------- */

  const setupParallax = (element, options) => {
    if (!element) return;

    const reset = () => {
      element.style.setProperty(options.xVariable, "0px");
      element.style.setProperty(options.yVariable, "0px");
    };

    element.addEventListener(
      "pointermove",
      (event) => {
        if (!finePointer.matches || reducedMotion.matches) return;

        const bounds = element.getBoundingClientRect();
        const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
        const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;
        const x = Math.max(-options.maxX, Math.min(options.maxX, relativeX * options.maxX * 2));
        const y = Math.max(-options.maxY, Math.min(options.maxY, relativeY * options.maxY * 2));

        element.style.setProperty(options.xVariable, `${x.toFixed(2)}px`);
        element.style.setProperty(options.yVariable, `${y.toFixed(2)}px`);
      },
      { passive: true },
    );

    element.addEventListener("pointerleave", reset, { passive: true });

    const handlePreferenceChange = () => {
      if (!finePointer.matches || reducedMotion.matches) reset();
    };

    if (typeof finePointer.addEventListener === "function") {
      finePointer.addEventListener("change", handlePreferenceChange);
    }
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", handlePreferenceChange);
    }
  };

  setupParallax(page.querySelector("[data-bia-donation-hero-parallax]"), {
    maxX: 5,
    maxY: 4,
    xVariable: "--bia-donation-parallax-x",
    yVariable: "--bia-donation-parallax-y",
  });

  setupParallax(page.querySelector("[data-bia-donation-ecard-parallax]"), {
    maxX: 3,
    maxY: 3,
    xVariable: "--bia-donation-ecard-x",
    yVariable: "--bia-donation-ecard-y",
  });

  /* Page entrance runs only after all critical listeners are attached. */
  window.setTimeout(() => {
    page.classList.add("bia-donation-is-loaded");
  }, reducedMotion.matches ? 0 : 40);
})();
