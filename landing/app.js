/* =========================================================
   בין לבין · app.js
   הכל נשלט מ-config.js – אין צורך לערוך קובץ זה.
   ========================================================= */
(function () {
  "use strict";

  var C = window.SITE_CONFIG || {};
  var contact = C.contact || {};
  var links = C.links || {};
  var tracking = C.tracking || {};
  var DEBUG = !!tracking.debug || /[?&]debug=1/.test(location.search);

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function get(path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, C);
  }
  function isPlaceholder(v) { return typeof v === "string" && /^\s*\[/.test(v); }
  function waUrl(msg) {
    var n = String(contact.whatsappNumber || "").replace(/\D/g, "");
    return "https://wa.me/" + n + (msg ? "?text=" + encodeURIComponent(msg) : "");
  }
  function telUrl() { return "tel:" + String(contact.phone || "").replace(/[^\d+]/g, ""); }
  function utm() {
    var p = new URLSearchParams(location.search), o = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach(function (k) {
      if (p.get(k)) o[k] = p.get(k);
    });
    return o;
  }

  /* ---------------------------------------------------------
     Tracking – Meta Pixel + GA4 + dataLayer
     אירועים: PageView, ViewContent, Lead, WhatsAppClick,
              BookingClick, PaymentClick, VideoPlay
     --------------------------------------------------------- */
  window.dataLayer = window.dataLayer || [];

  if (tracking.metaPixelId) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq("init", tracking.metaPixelId);
    window.fbq("track", "PageView");
  }

  if (tracking.ga4Id) {
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(tracking.ga4Id);
    document.head.appendChild(g);
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", tracking.ga4Id); // שולח page_view אוטומטית
  }

  // מיפוי לאירועים סטנדרטיים של מטא (לאופטימיזציה של קמפיינים)
  var META_STANDARD = { ViewContent: "ViewContent", Lead: "Lead" };
  var META_ALSO = { WhatsAppClick: "Contact", BookingClick: "Schedule", PaymentClick: "InitiateCheckout" };
  var GA_ALSO = { Lead: "generate_lead" };

  function track(name, params) {
    params = params || {};
    window.dataLayer.push(Object.assign({ event: name }, params));

    if (window.fbq && name !== "PageView") {
      if (META_STANDARD[name]) window.fbq("track", META_STANDARD[name], params);
      else {
        window.fbq("trackCustom", name, params);
        if (META_ALSO[name]) window.fbq("track", META_ALSO[name], params);
      }
    }
    if (window.gtag && name !== "PageView") {
      window.gtag("event", name, params);
      if (GA_ALSO[name]) window.gtag("event", GA_ALSO[name], params);
    }
    if (DEBUG) console.log("%c[track] " + name, "color:#5E6A4C;font-weight:bold", params);
  }
  window.trackEvent = track;
  track("PageView", { page: location.pathname });

  /* ---------------------------------------------------------
     CTA wiring (data-cta)
     --------------------------------------------------------- */
  function wireCtas() {
    var bookingHref = links.bookingUrl || waUrl(contact.whatsappBookingMessage);
    var paymentHref = links.paymentUrl || waUrl(contact.whatsappBookingMessage);

    $$("[data-cta]").forEach(function (el) {
      var type = el.getAttribute("data-cta");
      var where = el.closest("[id]") ? el.closest("[id]").id : "page";
      if (el.closest("[data-dock]")) where = "floating_dock";
      if (el.classList.contains("wa-fab")) where = "floating_button";

      var external = false;
      if (type === "whatsapp") { el.href = waUrl(contact.whatsappMessage); external = true; }
      else if (type === "booking") { el.href = bookingHref; external = true; }
      else if (type === "payment") {
        el.href = paymentHref; external = true;
        if (!links.paymentUrl) el.setAttribute("data-payment-placeholder", "");
      }
      else if (type === "phone") { el.href = telUrl(); }
      else if (type === "instagram") { el.href = contact.instagramUrl || "#"; external = true; }

      if (external) { el.target = "_blank"; el.rel = "noopener"; }

      el.addEventListener("click", function () {
        var p = { location: where };
        if (type === "whatsapp") track("WhatsAppClick", p);
        else if (type === "booking") track("BookingClick", Object.assign({ channel: links.bookingUrl ? "booking_url" : "whatsapp" }, p));
        else if (type === "payment") {
          if (links.paymentUrl) track("PaymentClick", p);
          else track("BookingClick", Object.assign({ channel: "whatsapp", note: "payment_link_missing" }, p));
        }
        else if (type === "phone") track("PhoneClick", p);
      });
    });

    $$("[data-hide-empty]").forEach(function (el) {
      if (!get(el.getAttribute("data-hide-empty"))) el.hidden = true;
    });
    $$("[data-text]").forEach(function (el) {
      var v = get(el.getAttribute("data-text"));
      if (v) el.textContent = v;
    });
    var y = $("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------
     Workshop details from config
     --------------------------------------------------------- */
  function fillDetails() {
    var d = C.details || {};
    $$("[data-detail]").forEach(function (el) {
      var v = d[el.getAttribute("data-detail")];
      if (v == null || v === "") { el.closest("div").hidden = true; return; }
      el.textContent = "";
      if (isPlaceholder(v)) {
        var s = document.createElement("span");
        s.className = "ph"; s.textContent = v;
        el.appendChild(s);
      } else el.textContent = v;
    });
  }

  /* ---------------------------------------------------------
     Hero media
     --------------------------------------------------------- */
  function heroMedia() {
    var h = C.hero || {};
    var box = $("[data-hero-media]");
    if (!box || (!h.video && !h.image)) return;
    var hero = box.closest(".hero");
    hero.classList.add("has-media");

    if (h.video) {
      var v = document.createElement("video");
      v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
      v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
      v.preload = "metadata";
      if (h.image) v.poster = h.image;
      v.src = h.video;
      box.appendChild(v);
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    } else {
      var img = document.createElement("img");
      img.src = h.image; img.alt = ""; img.fetchPriority = "high"; img.decoding = "async";
      box.appendChild(img);
    }
  }

  /* ---------------------------------------------------------
     About image
     --------------------------------------------------------- */
  function aboutImage() {
    var src = C.about && C.about.image;
    var fig = $("[data-about-img]");
    if (!src || !fig) return;
    fig.innerHTML = "";
    var img = document.createElement("img");
    img.src = src; img.alt = "משה פרידמן"; img.loading = "lazy"; img.decoding = "async";
    fig.appendChild(img);
  }

  /* ---------------------------------------------------------
     Video component
     תומך: mp4/webm/mov · YouTube (watch / shorts / youtu.be) ·
           Vimeo · Instagram Reel
     הנגן נטען רק בלחיצה (facade) → הדף נשאר מהיר.
     --------------------------------------------------------- */
  function parseVideo(url) {
    if (!url) return null;
    var m;
    if ((m = url.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/)))
      return { kind: "youtube", id: m[1], thumb: "https://i.ytimg.com/vi/" + m[1] + "/hqdefault.jpg" };
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)))
      return { kind: "vimeo", id: m[1] };
    if ((m = url.match(/instagram\.com\/(?:reel|reels|p)\/([\w-]+)/)))
      return { kind: "instagram", id: m[1] };
    return { kind: "file", src: url };
  }

  function embedSrc(v) {
    if (v.kind === "youtube") return "https://www.youtube-nocookie.com/embed/" + v.id + "?autoplay=1&playsinline=1&rel=0&modestbranding=1";
    if (v.kind === "vimeo") return "https://player.vimeo.com/video/" + v.id + "?autoplay=1&playsinline=1&title=0&byline=0&portrait=0";
    if (v.kind === "instagram") return "https://www.instagram.com/reel/" + v.id + "/embed/";
    return "";
  }

  function renderVideoCard(item, index) {
    var card = document.createElement("div");
    card.className = "reel";
    var v = parseVideo(item.url);
    var played = false;
    function onPlay() {
      if (played) return; played = true;
      track("VideoPlay", { video_index: index + 1, video_kind: v.kind, video_url: item.url });
    }

    if (!v) {
      card.className = "reel reel--ph";
      card.innerHTML = "<div>[כאן ייכנס סרטון " + (index + 1) + "]<small>config.js → videos[" + index + "].url</small></div>";
      return card;
    }

    if (v.kind === "file") {
      var video = document.createElement("video");
      video.src = item.url + (item.poster ? "" : "#t=0.1");
      video.playsInline = true; video.setAttribute("playsinline", "");
      video.controls = false;
      video.preload = item.poster ? "none" : "metadata";
      if (item.poster) video.poster = item.poster;
      video.addEventListener("play", onPlay);
      card.appendChild(video);
    } else {
      var thumb = item.poster || v.thumb;
      if (thumb) {
        var img = document.createElement("img");
        img.src = thumb; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
        card.appendChild(img);
      }
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "reel__btn";
    btn.setAttribute("aria-label", "הפעלת סרטון " + (index + 1));
    btn.innerHTML = '<span class="reel__play" aria-hidden="true"></span>' +
      (item.label ? '<span class="reel__label"></span>' : "");
    if (item.label) btn.querySelector(".reel__label").textContent = item.label;
    card.appendChild(btn);

    btn.addEventListener("click", function () {
      card.classList.add("is-playing");
      if (v.kind === "file") {
        var vid = card.querySelector("video");
        vid.controls = true;
        // עוצר סרטונים אחרים שמתנגנים
        $$(".reel video").forEach(function (o) { if (o !== vid) o.pause(); });
        vid.play();
      } else {
        var f = document.createElement("iframe");
        f.src = embedSrc(v);
        f.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
        f.allowFullscreen = true;
        f.title = "סרטון מהסדנה " + (index + 1);
        card.appendChild(f);
        onPlay();
      }
    });

    return card;
  }

  function renderVideos() {
    var box = $("[data-videos]");
    if (!box) return;
    var list = (C.videos || []).filter(Boolean);
    var hasAny = list.some(function (x) { return x.url; });

    if (!hasAny && !C.showVideoPlaceholders) {
      var sec = $("[data-video-section]"); if (sec) sec.hidden = true;
      return;
    }
    list.forEach(function (item, i) {
      if (!item.url && hasAny) return; // בפרודקשן: מסתירים משבצות ריקות
      box.appendChild(renderVideoCard(item, i));
    });
  }

  /* ---------------------------------------------------------
     Lead form
     --------------------------------------------------------- */
  function leadForm() {
    var form = $("[data-lead-form]");
    if (!form) return;
    var err = $("[data-form-error]");
    var thanks = $("[data-thanks]");
    var cfg = C.leadForm || {};
    var started = false;

    form.addEventListener("input", function () {
      if (!started) { started = true; window.dataLayer.push({ event: "LeadFormStart" }); }
    });

    function fail(msg, field) {
      err.textContent = msg; err.hidden = false;
      if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.hidden = true;
      $$("[aria-invalid]", form).forEach(function (f) { f.removeAttribute("aria-invalid"); });

      if (form.company.value) return; // bot
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var message = form.message.value.trim();
      var digits = phone.replace(/\D/g, "");

      if (!name) return fail("חסר שם – כדי שאדע איך לפנות אליכם.", form.name);
      if (digits.length < 9 || digits.length > 13) return fail("נראה שמספר הטלפון לא שלם.", form.phone);

      var payload = Object.assign({
        name: name, phone: phone, message: message,
        source: "landing-bein-levein", page: location.href, submitted_at: new Date().toISOString()
      }, utm());

      var btn = form.querySelector("button[type=submit]");
      btn.setAttribute("aria-busy", "true");

      function done() {
        track("Lead", { method: cfg.endpoint ? "form" : "form_whatsapp" });
        form.hidden = true;
        thanks.hidden = false;
        thanks.focus();
      }

      if (!cfg.endpoint) {
        // אין endpoint עדיין → הליד נשלח כהודעת וואטסאפ מוכנה, כדי שלא ילך לאיבוד
        var text = "היי משה, השארתי פרטים בדף \"בין לבין\"\nשם: " + name + "\nטלפון: " + phone + (message ? "\nהודעה: " + message : "");
        window.open(waUrl(text), "_blank", "noopener");
        if (DEBUG) console.warn("[lead] leadForm.endpoint is empty – lead sent via WhatsApp", payload);
        done();
        return;
      }

      var body = new FormData();
      Object.keys(payload).forEach(function (k) { body.append(k, payload[k]); });

      fetch(cfg.endpoint, {
        method: "POST",
        body: body,
        mode: cfg.mode === "no-cors" ? "no-cors" : "cors",
        headers: cfg.mode === "no-cors" ? undefined : { Accept: "application/json" }
      }).then(function (r) {
        if (cfg.mode !== "no-cors" && !r.ok) throw new Error("HTTP " + r.status);
        done();
      }).catch(function () {
        btn.removeAttribute("aria-busy");
        fail("משהו לא עבר. אפשר לנסות שוב, או פשוט לכתוב לי בוואטסאפ.");
      });
    });
  }

  /* ---------------------------------------------------------
     Reveal on scroll + ViewContent + floating CTA
     --------------------------------------------------------- */
  function observers() {
    var reveals = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); ro.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { ro.observe(el); });

    // ViewContent – כשהגולש מגיע לתיאור הסדנה
    var inside = $("#inside");
    if (inside) {
      var vo = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { track("ViewContent", { content_name: "workshop_details", section: "inside" }); vo.disconnect(); }
      }, { threshold: 0.25 });
      vo.observe(inside);
    }

    // CTA צף: מופיע אחרי ה-Hero, נעלם באזור ה-CTA הסופי ובטופס
    var dock = $("[data-dock]");
    var fab = $(".wa-fab");
    var heroGone = false, finalIn = false;
    function sync() {
      var on = heroGone && !finalIn;
      [dock, fab].forEach(function (el) {
        if (!el) return;
        el.classList.toggle("is-on", on);
        el.setAttribute("aria-hidden", on ? "false" : "true");
        (el.matches("a") ? [el] : $$("a", el)).forEach(function (a) { a.tabIndex = on ? 0 : -1; });
      });
      document.documentElement.style.setProperty("--dock-h", on ? "76px" : "0px");
    }
    var hero = $(".hero");
    if (hero) new IntersectionObserver(function (e) { heroGone = !e[0].isIntersecting; sync(); }, { threshold: 0.15 }).observe(hero);

    var hideZones = [$("#book"), $("#lead")].filter(Boolean);
    var visible = new Set();
    var zo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.isIntersecting ? visible.add(en.target) : visible.delete(en.target); });
      finalIn = visible.size > 0; sync();
    }, { threshold: 0.2 });
    hideZones.forEach(function (z) { zo.observe(z); });
    sync();
  }

  /* --------------------------------------------------------- */
  function init() {
    wireCtas();
    fillDetails();
    heroMedia();
    aboutImage();
    renderVideos();
    leadForm();
    observers();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
