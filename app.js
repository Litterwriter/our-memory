(function () {
  "use strict";

  const cfg = window.LOVE_CONFIG || {};
  const photos = Array.isArray(cfg.photos) ? cfg.photos : [];
  const milestones = Array.isArray(cfg.milestones) ? cfg.milestones : [];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function parseLocalDate(value) {
    const parts = String(value).split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function dayDiff(from, to) {
    return Math.round((to - from) / 86400000);
  }

  function formatDate(value) {
    return String(value).replace(/-/g, ".");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function tileClass(photo) {
    const ratio = photo.width / photo.height;
    if (ratio > 1.35) return "tile-wide";
    if (ratio < 0.78) return "tile-tall";
    return "tile-square";
  }

  const gateConfig = cfg.gate || {};
  const gate = $("#gate");
  const gateForm = $("#gateForm");
  const gateInput = $("#gateInput");
  const gateError = $("#gateError");
  const UNLOCK_KEY = "love-site-unlocked-v1";

  function hashDjb2(value) {
    let hash = 5381;
    for (let i = 0; i < value.length; i += 1) {
      hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16);
  }

  async function sha256Hex(value) {
    if (!window.crypto || !crypto.subtle) return null;
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function hideGate() {
    if (!gate) return;
    gate.classList.add("hidden");
    gate.setAttribute("aria-hidden", "true");
    document.body.classList.remove("gate-locked");
  }

  function initGate() {
    if (!gate) return;
    if (!gateConfig.enabled) {
      gate.remove();
      return;
    }

    const gateTitle = $("#gateTitle");
    const gateHint = $("#gateHint");
    if (gateTitle && gateConfig.title) gateTitle.textContent = gateConfig.title;
    if (gateHint && gateConfig.hint) gateHint.textContent = gateConfig.hint;

    try {
      if (sessionStorage.getItem(UNLOCK_KEY) === "1") {
        hideGate();
        return;
      }
    } catch (error) {
      // ignore storage errors
    }

    document.body.classList.add("gate-locked");

    if (gateForm && gateInput) {
      gateForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const value = gateInput.value.trim();
        if (!value) return;
        const sha = await sha256Hex(value);
        const matches = (sha && sha === gateConfig.hash) ||
          (!sha && hashDjb2(value) === gateConfig.fallbackHash);
        if (matches) {
          try {
            sessionStorage.setItem(UNLOCK_KEY, "1");
          } catch (error) {
            // ignore storage errors
          }
          hideGate();
        } else {
          if (gateError) gateError.hidden = false;
          gateInput.select();
        }
      });
    }
  }

  initGate();

  if (cfg.siteName) {
    document.title = cfg.siteName;
    const brandName = $("#brandName");
    if (brandName) brandName.textContent = cfg.siteName;
  }
  if (cfg.heroTitle) {
    const heroTitle = $("#heroTitle");
    if (heroTitle) heroTitle.textContent = cfg.heroTitle;
  }
  if (cfg.heroSubtitle) {
    const heroSubtitle = $("#heroSubtitle");
    if (heroSubtitle) heroSubtitle.textContent = cfg.heroSubtitle;
  }

  const today = startOfDay(new Date());
  const anniversary = cfg.anniversary || { month: 8, day: 4 };

  if (cfg.startDate) {
    const start = parseLocalDate(cfg.startDate);
    const days = dayDiff(start, today);
    const daysEl = $("#daysTogether");
    if (daysEl) daysEl.textContent = String(Math.max(0, days));
  }

  let nextAnniversary = new Date(today.getFullYear(), anniversary.month - 1, anniversary.day);
  if (nextAnniversary < today) {
    nextAnniversary = new Date(today.getFullYear() + 1, anniversary.month - 1, anniversary.day);
  }

  const anniversaryDaysEl = $("#anniversaryDays");
  if (anniversaryDaysEl) anniversaryDaysEl.textContent = String(dayDiff(today, nextAnniversary));

  const anniversaryTextEl = $("#anniversaryText");
  if (anniversaryTextEl) anniversaryTextEl.textContent = `${anniversary.month}月${anniversary.day}日`;

  const photoCountEl = $("#photoCount");
  if (photoCountEl) photoCountEl.textContent = String(photos.length);

  if (photos.length) {
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const photo = photos[seed % photos.length];
    const todayPhoto = $("#todayPhoto");
    const todayDate = $("#todayDate");
    const todayText = $("#todayText");
    if (todayPhoto) {
      todayPhoto.src = photo.src;
      todayPhoto.alt = `${photo.label} · ${photo.time}`;
    }
    if (todayDate) todayDate.textContent = photo.time;
    if (todayText) todayText.textContent = cfg.todayIntro || "今天也想让你看看这一张照片。";
  }

  let upcoming = null;
  for (const item of milestones) {
    const date = parseLocalDate(item.date);
    if (date >= today && (!upcoming || date < upcoming.date)) {
      upcoming = { title: item.title, date };
    }
  }
  if (!upcoming) {
    upcoming = { title: `${anniversary.month}月${anniversary.day}日纪念日`, date: nextAnniversary };
  }
  const upcomingDays = dayDiff(today, upcoming.date);
  const todayNextEl = $("#todayNext");
  if (todayNextEl) {
    todayNextEl.textContent = upcomingDays === 0
      ? `今天就是「${upcoming.title}」`
      : `距离「${upcoming.title}」还有 ${upcomingDays} 天`;
  }

  const timeline = $("#timeline");
  if (timeline) {
    timeline.innerHTML = milestones.map((item) => {
      const photo = typeof item.photo === "number" && photos[item.photo] ? photos[item.photo] : null;
      const photoMarkup = photo
        ? `<img class="timeline-photo" src="${photo.src}" alt="${escapeHtml(photo.label)}">`
        : "";
      return `
        <article class="timeline-item reveal">
          <div class="timeline-marker" aria-hidden="true"></div>
          <div class="timeline-card">
            <span class="timeline-date">${escapeHtml(formatDate(item.date))}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.note)}</p>
            ${photoMarkup}
          </div>
        </article>
      `;
    }).join("");
  }

  const galleryGrid = $("#galleryGrid");
  if (galleryGrid && photos.length) {
    galleryGrid.innerHTML = photos.map((photo, index) => `
      <button class="tile ${tileClass(photo)} reveal" type="button" data-index="${index}" aria-label="查看第 ${index + 1} 张照片">
        <img src="${photo.src}" alt="${escapeHtml(photo.label)} · ${escapeHtml(photo.time)}">
        <span class="tile-label">${escapeHtml(photo.label)} · ${escapeHtml(photo.time)}</span>
      </button>
    `).join("");
  }

  const letters = Array.isArray(cfg.letters) ? cfg.letters : [];
  const lettersGrid = $("#lettersGrid");
  if (lettersGrid) {
    lettersGrid.innerHTML = letters.map((letter) => `
      <article class="letter-card reveal">
        <i data-lucide="quote" class="letter-icon" aria-hidden="true"></i>
        <h3>${escapeHtml(letter.title)}</h3>
        <p>${escapeHtml(letter.text)}</p>
        <span class="letter-author">${escapeHtml(letter.author)}</span>
      </article>
    `).join("");
  }

  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  const lightboxCaption = $("#lightboxCaption");
  let currentIndex = 0;

  function renderLightbox() {
    const photo = photos[currentIndex];
    if (!photo) return;
    lightboxImg.src = photo.src;
    lightboxImg.alt = `${photo.label} · ${photo.time}`;
    lightboxCaption.textContent = `${photo.label} · ${photo.time}`;
  }

  function openLightbox(index) {
    currentIndex = (index + photos.length) % photos.length;
    renderLightbox();
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }

  function stepLightbox(delta) {
    openLightbox(currentIndex + delta);
  }

  if (galleryGrid) {
    galleryGrid.addEventListener("click", (event) => {
      const tile = event.target.closest(".tile");
      if (tile) openLightbox(Number(tile.dataset.index));
    });
  }

  const lightboxClose = $("#lightboxClose");
  const lightboxPrev = $("#lightboxPrev");
  const lightboxNext = $("#lightboxNext");
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener("click", () => stepLightbox(-1));
  if (lightboxNext) lightboxNext.addEventListener("click", () => stepLightbox(1));

  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    let touchX = 0;
    lightbox.addEventListener("touchstart", (event) => {
      touchX = event.changedTouches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener("touchend", (event) => {
      const deltaX = event.changedTouches[0].clientX - touchX;
      if (Math.abs(deltaX) > 48) stepLightbox(deltaX > 0 ? -1 : 1);
    }, { passive: true });
  }

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") stepLightbox(-1);
    if (event.key === "ArrowRight") stepLightbox(1);
  });

  const STORAGE_KEY = "love-memory-notes-v1";
  const noteList = $("#noteList");
  const noteInput = $("#noteInput");
  const noteSubmit = $("#noteSubmit");

  function loadNotes() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveNotes(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      return false;
    }
    return true;
  }

  function nowText() {
    const now = new Date();
    return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  function renderNotes() {
    const notes = loadNotes();
    if (!notes.length) {
      noteList.innerHTML = '<li class="note-item note-empty">这里还空着，等一句悄悄话。</li>';
      return;
    }
    noteList.innerHTML = notes.map((note) => `
      <li class="note-item">
        <p>${escapeHtml(note.text)}</p>
        <span>${escapeHtml(note.time)}</span>
      </li>
    `).join("");
  }

  if (noteSubmit && noteInput) {
    noteSubmit.addEventListener("click", () => {
      const text = noteInput.value.trim();
      if (!text) return;
      const notes = loadNotes();
      notes.unshift({ text, time: nowText() });
      if (saveNotes(notes)) {
        noteInput.value = "";
        renderNotes();
      }
    });
  }

  if (noteList) renderNotes();

  const header = $("#siteHeader");
  const onScroll = () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const revealElements = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("in-view"));
  }

  if (window.lucide) {
    lucide.createIcons();
  }
})();
