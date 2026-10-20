/* ============================================================
   UMBRA — Motion Layer (based on ORBE Motion Lab contract)
   - hero slider: time-based crossfade (bidirectional via thumbs);
     the film slide holds for its full length and only plays while visible
   - statement/CTA: word-fill scrub (reversible by nature)
   - capabilities: pinned scrub list, crossfade bgs
   - reveals: reversible fade-rise
   - baseline usable without JS; reduced-motion = final states
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var INK = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#ECEAE5";

  /* ================= Hero slider (works without GSAP) ================= */
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  var thumbs = Array.prototype.slice.call(document.querySelectorAll(".hero-thumb"));
  var counter = document.getElementById("heroCurrent");
  var current = 0;
  var timer = null;
  var IMAGE_HOLD = 4500;
  var VIDEO_HOLD = 6000; // hero.mp4 runs 6 s

  function syncVideos() {
    slides.forEach(function (s, i) {
      var v = s.querySelector("video");
      if (!v) return;
      if (i === current && !REDUCED) {
        v.currentTime = 0;
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        v.pause();
      }
    });
  }
  function goTo(i) {
    if (i === current) return;
    slides[current].classList.remove("is-active");
    thumbs[current].classList.remove("is-active");
    thumbs[current].setAttribute("aria-selected", "false");
    current = (i + slides.length) % slides.length;
    slides[current].classList.add("is-active");
    thumbs[current].classList.add("is-active");
    thumbs[current].setAttribute("aria-selected", "true");
    if (counter) counter.textContent = String(current + 1).padStart(2, "0");
    syncVideos();
  }
  function schedule() {
    if (REDUCED) return;
    clearTimeout(timer);
    var hold = slides[current].querySelector("video") ? VIDEO_HOLD : IMAGE_HOLD;
    timer = setTimeout(function () { goTo(current + 1); schedule(); }, hold);
  }
  if (REDUCED) {
    // no autoplaying film: show the poster frame only
    document.querySelectorAll(".hero-slide video").forEach(function (v) {
      v.removeAttribute("autoplay");
      v.pause();
    });
  }
  thumbs.forEach(function (t) {
    t.addEventListener("click", function () {
      goTo(parseInt(t.getAttribute("data-goto"), 10));
      schedule();
    });
  });
  schedule();

  /* ================= Updates carousel (works without GSAP) ================= */
  var track = document.getElementById("updatesTrack");
  var prev = document.getElementById("carPrev");
  var next = document.getElementById("carNext");
  var shift = 0;

  function maxShift() {
    var vp = track.parentElement;
    return Math.max(0, track.scrollWidth - vp.clientWidth);
  }
  function cardStep() {
    var card = track.querySelector(".update-card");
    if (!card) return 0;
    var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    return card.getBoundingClientRect().width + gap;
  }
  function applyShift() {
    shift = Math.max(0, Math.min(shift, maxShift()));
    track.style.transform = "translateX(" + -shift + "px)";
    if (prev) prev.disabled = shift <= 0;
    if (next) next.disabled = shift >= maxShift() - 1;
  }
  if (prev) prev.addEventListener("click", function () { shift -= cardStep(); applyShift(); });
  if (next) next.addEventListener("click", function () { shift += cardStep(); applyShift(); });
  window.addEventListener("resize", applyShift);
  applyShift();

  /* ================= Motion engine ================= */
  if (REDUCED || typeof gsap === "undefined") {
    // final visible states; word-fill words render dark via CSS fallback
    document.querySelectorAll(".fill-text .fw").forEach(function (w) { w.style.color = INK; });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (typeof SplitText !== "undefined") gsap.registerPlugin(SplitText);

  var ctx = null;
  var currentBand = band();
  function band() {
    var w = window.innerWidth;
    return w < 768 ? "s" : w < 1024 ? "m" : "l";
  }

  function splitWords(el) {
    if (typeof SplitText === "undefined") return null;
    return new SplitText(el, { type: "words", wordsClass: "fw" });
  }

  function init() {
    ctx = gsap.context(function () {

      /* ----- word-fill scrub (statement + CTA) — bidirectional by scrub ----- */
      document.querySelectorAll(".fill-text").forEach(function (el) {
        var split = splitWords(el);
        var words = split ? split.words : [];
        if (!words.length) return;
        words.forEach(function (w) { w.style.transition = "none"; });
        gsap.to(words, {
          color: el.classList.contains("quote") ? getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() : INK,
          ease: "none",
          stagger: 0.6,
          scrollTrigger: {
            trigger: el,
            start: "top 78%",
            end: "bottom 55%",
            scrub: 0.4
          }
        });
      });

      /* ----- reversible fade-rise reveals ----- */
      // hero thumbs sit below the 90% line on load, so they get a load-time intro instead
      var RISE = ["[data-rise]", ".section-head", ".cta-link", ".eyebrow"];
      RISE.forEach(function (sel) {
        gsap.utils.toArray(sel).forEach(function (el) {
          gsap.from(el, {
            opacity: 0,
            y: 46,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" }
          });
        });
      });

      /* ----- work-card inner image settle (reversible mask-scale) ----- */
      gsap.utils.toArray(".work-media").forEach(function (m) {
        var img = m.querySelector("img");
        if (!img) return;
        gsap.from(img, {
          scale: 1.18,
          duration: 1.3,
          ease: "power3.out",
          scrollTrigger: { trigger: m, start: "top 92%", toggleActions: "play none none reverse" }
        });
      });

      /* ----- capabilities pinned scrub (bidirectional by scrub) ----- */
      var bgs = gsap.utils.toArray(".cap-bg");
      var items = gsap.utils.toArray(".cap-list li");
      var lastIdx = 0;
      function setActive(idx) {
        if (idx === lastIdx) return;
        bgs[lastIdx].classList.remove("is-active");
        items[lastIdx].classList.remove("is-active");
        lastIdx = idx;
        bgs[lastIdx].classList.add("is-active");
        items[lastIdx].classList.add("is-active");
      }
      ScrollTrigger.create({
        trigger: ".capabilities",
        start: "top top",
        end: "+=400%",
        pin: ".cap-pin",
        scrub: true,
        onUpdate: function (self) {
          var idx = Math.min(items.length - 1, Math.floor(self.progress * items.length));
          setActive(idx);
        }
      });

      /* ----- hero headline intro per slide (time-based, once on load) ----- */
      var firstHero = document.querySelectorAll(".hero-slide.is-active .hero-eyebrow, .hero-slide.is-active .hero-headline");
      if (firstHero.length) {
        gsap.from(firstHero, { opacity: 0, y: 36, duration: 1.1, ease: "power3.out", delay: 0.25, stagger: 0.12 });
      }
      gsap.from(".hero-thumbs, .hero-counter", { opacity: 0, y: 20, duration: 0.9, ease: "power3.out", delay: 0.7 });
    });

    ScrollTrigger.refresh();
  }

  function boot() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(init);
    } else {
      init();
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });

  /* rebuild at breakpoint-band change */
  var rt = null;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var b = band();
      if (b !== currentBand && ctx) {
        currentBand = b;
        ctx.revert();
        init();
      } else {
        ScrollTrigger.refresh();
      }
    }, 300);
  });
})();
