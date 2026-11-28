/* US Tin website. No framework, no trackers: a few small behaviours, each switched on only where its markup exists. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var base = (function () {
    // Every page loads this file from <site>/assets/site.js, so the site's root is two steps up from here.
    var src = document.currentScript && document.currentScript.src;
    return src ? src.replace(/assets\/site\.js(\?.*)?$/, '') : './';
  })();

  /* Storage that never throws (private windows, blocked storage) and respects the cookie choice. */
  var store = {
    get: function (key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } },
    set: function (key, value) { try { window.localStorage.setItem(key, value); } catch (e) { /* not available */ } },
    remove: function (key) { try { window.localStorage.removeItem(key); } catch (e) { /* not available */ } },
  };
  var CONSENT_KEY = 'ustin-site-consent';
  function consent() {
    try { return JSON.parse(store.get(CONSENT_KEY) || 'null'); } catch (e) { return null; }
  }
  function prefsAllowed() { var c = consent(); return !!(c && c.preferences); }

  /* If the home page opens from a home-screen icon added before the app had its own address, go to the app. */
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone && document.body.classList.contains('home')) {
    window.location.replace(base + 'app/');
    return;
  }

  /* ---------------------------------------------------------------- nav: gets a paper backing once you scroll */
  var nav = document.querySelector('[data-nav]');
  if (nav) {
    var onScrollNav = function () { nav.classList.toggle('is-stuck', window.scrollY > 24); };
    onScrollNav();
    window.addEventListener('scroll', onScrollNav, { passive: true });
  }

  /* ---------------------------------------------------------------- Tin: blinks, waves hello, and hops when poked */
  var tin = document.querySelector('[data-poke]');
  if (tin) {
    var wave = function (ms) {
      tin.classList.add('is-waving');
      var swings = 0;
      var arm = setInterval(function () {
        swings += 1;
        tin.classList.toggle('is-waving');
        if (swings >= 6) { clearInterval(arm); tin.classList.remove('is-waving'); }
      }, ms || 260);
    };
    if (!reduceMotion) {
      setTimeout(function () { wave(); }, 900);
      // Blink now and then, at a slightly uneven rhythm, sometimes twice.
      var blink = function () {
        var times = Math.random() < 0.2 ? 2 : 1;
        var once = function () {
          tin.classList.add('is-blinking');
          setTimeout(function () {
            tin.classList.remove('is-blinking');
            times -= 1;
            if (times > 0) setTimeout(once, 140); else setTimeout(blink, 2800 + Math.random() * 3600);
          }, 130);
        };
        once();
      };
      setTimeout(blink, 3200);
    }
    tin.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tin.dispatchEvent(new Event('click')); }
    });
    tin.addEventListener('click', function () {
      tin.classList.remove('is-hopping');
      void tin.getBoundingClientRect(); // restart the hop
      tin.classList.add('is-hopping', 'is-grinning');
      wave(200);
      setTimeout(function () { tin.classList.remove('is-grinning'); }, 1300);
    });
  }

  /* ---------------------------------------------------------------- the course road, and your place on it */
  var route = document.querySelector('[data-route]');
  if (route && window.fetch) {
    fetch(base + 'assets/course.json').then(function (r) { return r.json(); }).then(function (course) {
      var units = route.querySelector('[data-road-units]');
      var total = 0;
      var done = {};
      try {
        // The app stores progress in this same browser storage (same site), so the road can show the real thing.
        var saved = JSON.parse(store.get('ustin-progress') || 'null');
        var lessons = saved && saved.state && saved.state.lessons;
        if (lessons && typeof lessons === 'object') Object.keys(lessons).forEach(function (id) { done[id] = true; });
      } catch (e) { /* nothing saved */ }
      var finished = 0;
      var nextUnit = null;
      course.forEach(function (unit) {
        var li = document.createElement('li');
        var count = unit.stops.filter(function (id) { return done[id]; }).length;
        li.title = unit.title + ': ' + unit.stops.length + ' stops';
        if (count === unit.stops.length) li.className = 'done';
        else if (!nextUnit) nextUnit = unit;
        units.appendChild(li);
        total += unit.stops.length;
        finished += count;
      });
      if (finished > 0) {
        route.querySelector('[data-route-label]').textContent = 'Your route';
        route.querySelector('[data-route-big]').textContent = finished + ' of ' + total + ' stops';
        route.querySelector('[data-route-text]').textContent = nextUnit
          ? 'Next up: ' + nextUnit.title + '. Tin is waiting with the truck.'
          : 'You finished the whole course. Tin is very proud.';
        route.querySelector('[data-route-cta]').textContent = nextUnit ? 'Keep going' : 'Open the app';
        route.querySelector('[data-road]').setAttribute('aria-label', 'The route, with Tin’s truck ' + finished + ' of ' + total + ' stops along');
      }
      var truck = route.querySelector('[data-truck]');
      var place = function () { truck.style.left = (finished / total * 100) + '%'; };
      if (reduceMotion || !('IntersectionObserver' in window)) place();
      else {
        // The truck pulls away from the start once the card is on screen.
        var io = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { place(); io.disconnect(); }
        }, { threshold: 0.6 });
        io.observe(route);
      }
    }).catch(function () { /* the road just stays empty */ });
  }

  /* ---------------------------------------------------------------- how it works: the cup comes apart as you scroll */
  var how = document.querySelector('[data-how]');
  if (how) {
    var section = how.closest('.how');
    var parts = {};
    ['lid', 'sleeve', 'body', 'steam'].forEach(function (k) { parts[k] = how.querySelector('[data-part="' + k + '"]'); });
    var labels = {};
    ['lid', 'sleeve', 'body'].forEach(function (k) { labels[k] = how.querySelector('[data-label="' + k + '"]'); });
    var caption = section.querySelector('[data-how-caption]');
    var lastStep = -1;
    var note = how.querySelector('[data-cup-note]');
    var steps = section.querySelectorAll('[data-how-steps] li');
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var seg = function (p, a, b) { return ease(clamp((p - a) / (b - a))); };
    var lerp = function (a, b, t) { return a + (b - a) * t; };

    // Where each part goes. Exploded: pulled apart, in the air. Binned: dropped into its bin, small.
    // Bin mouths (view-box units): trash x=128, recycling x=472, both at y≈640. The cup is drawn centred on x=300.
    var POSE = {
      lid: { ex: [120, -70, 10], bin: [172, 420, 0], binScale: 0.36 },
      sleeve: { ex: [150, 70, -6], bin: [172, 230, 0], binScale: 0.4 },
      body: { ex: [-120, 30, -4], bin: [-172, 260, 0], binScale: 0.4 },
    };

    var render = function (p) {
      var explode = seg(p, 0.06, 0.36);
      var drop = seg(p, 0.5, 0.84);
      Object.keys(POSE).forEach(function (k) {
        var pose = POSE[k];
        var x = lerp(0, pose.ex[0], explode), y = lerp(0, pose.ex[1], explode), r = lerp(0, pose.ex[2], explode), s = 1;
        if (drop > 0) {
          x = lerp(x, pose.bin[0], drop);
          // An arc: up a little first, then down into the bin.
          y = lerp(y, pose.bin[1], drop) - Math.sin(drop * Math.PI) * 60;
          r = lerp(r, pose.bin[2] + (k === 'lid' ? 24 : -18), drop);
          s = lerp(1, pose.binScale, drop);
        }
        // Scale about the part's own middle: the cup's middle sits at (300, 330) in view-box units.
        parts[k].setAttribute('transform', 'translate(' + (x + 300).toFixed(1) + ' ' + (y + 330).toFixed(1) + ') rotate(' + r.toFixed(2) + ') scale(' + s.toFixed(3) + ') translate(-300 -330)');
        parts[k].style.opacity = drop > 0.97 ? '0' : '1';
      });
      parts.steam.style.opacity = String(0.55 * (1 - seg(p, 0.0, 0.12)));
      var labelsOn = explode > 0.9 && drop < 0.15;
      Object.keys(labels).forEach(function (k) { labels[k].classList.toggle('is-on', labelsOn); });
      note.classList.toggle('is-on', p > 0.86);
      var step = p < 0.2 ? 0 : p < 0.55 ? 1 : 2;
      if (step !== lastStep) {
        lastStep = step;
        steps.forEach(function (li, i) { li.classList.toggle('is-on', i === step); });
        caption.innerHTML = steps[step].innerHTML; // our own markup, copied from the list above
      }
    };

    if (reduceMotion) {
      section.classList.add('is-static');
      render(0.4); // apart and labelled, as a still diagram
      note.classList.add('is-on');
      steps.forEach(function (li) { li.classList.add('is-on'); });
    } else {
      var ticking = false;
      var update = function () {
        ticking = false;
        var r = how.getBoundingClientRect();
        var span = r.height - window.innerHeight * 0.75;
        render(clamp((window.innerHeight * 0.15 - r.top) / span));
      };
      var request = function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } };
      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request);
      update();
    }
  }

  /* ---------------------------------------------------------------- Tin's wardrobe */
  var wall = document.querySelector('[data-wall]');
  if (wall && window.fetch) {
    var PRICES = { 'Recycling cap': 20, 'Cozy beanie': 30, 'Hard hat': 40, 'Party hat': 50, "Chef's hat": 60, 'Cowboy hat': 75,
      'Flower crown': 80, 'Top hat': 100, 'Propeller cap': 120, 'Golden crown': 250, Sunglasses: 25, 'Round specs': 35,
      'Heart shades': 60, 'Star shades': 80, Monocle: 90, 'Bow tie': 20, Bandana: 30, 'Striped scarf': 35, 'Gold medal': 150,
      'Classic green': 0, 'Ocean blue': 15, 'Traffic orange': 15, Grape: 15, 'Fire red': 15, 'Compost brown': 15, Sunshine: 25, Stealth: 25 };
    fetch(base + 'assets/wardrobe.json').then(function (r) { return r.json(); }).then(function (items) {
      var parser = new DOMParser();
      items.forEach(function (item) {
        var li = document.createElement('li');
        li.dataset.slot = item.slot;
        var face = document.createElement('div');
        face.className = 'wall-face';
        // Drawings come from our own build (scripts/capture-site-art.cjs). Parsed as SVG, never as HTML.
        var doc = parser.parseFromString(item.svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '), 'image/svg+xml');
        var svg = doc.documentElement;
        if (svg && svg.nodeName === 'svg' && !doc.querySelector('script, foreignObject')) {
          svg.setAttribute('aria-hidden', 'true');
          face.appendChild(document.importNode(svg, true));
        }
        var name = document.createElement('span');
        name.className = 'wall-name';
        name.textContent = item.name;
        var price = document.createElement('span');
        price.className = 'wall-price';
        var cost = PRICES[item.name];
        price.textContent = cost === 0 ? 'Free' : cost ? cost + ' coins' : '';
        li.append(face, name, price);
        wall.appendChild(li);
      });
      var count = document.querySelector('[data-wardrobe-count]');
      document.querySelectorAll('[data-chips] .chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          var f = chip.dataset.filter;
          document.querySelectorAll('[data-chips] .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
          var shown = 0;
          wall.querySelectorAll('li').forEach(function (li) {
            var on = f === 'all' || li.dataset.slot === f;
            li.hidden = !on;
            if (on) shown += 1;
          });
          var word = { all: 'things to wear', Hats: 'hats', Glasses: 'pairs of glasses', Neckwear: 'things for Tin’s neck', Paint: 'paint jobs' }[f];
          count.textContent = shown + ' ' + word + '. Nothing here costs real money.';
        });
      });
    }).catch(function () { wall.insertAdjacentHTML('beforebegin', '<p>The wardrobe didn’t load. The app’s Shop has all of it.</p>'); });
  }

  /* ---------------------------------------------------------------- install guide: picks your device */
  var install = document.querySelector('[data-install]');
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    // Chrome and Edge can install directly: offer a real button instead of the steps alone.
    e.preventDefault();
    deferredPrompt = e;
    document.querySelectorAll('[data-install-now]').forEach(function (el) { el.hidden = false; });
  });
  document.querySelectorAll('[data-install-button]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () {
        deferredPrompt = null;
        document.querySelectorAll('[data-install-now]').forEach(function (el) { el.hidden = true; });
      });
    });
  });
  window.addEventListener('appinstalled', function () {
    var done = document.querySelector('[data-install-done]');
    if (done) { done.textContent = 'Installed. Look for Tin on your home screen.'; done.hidden = false; }
  });
  if (install) {
    var tabs = Array.prototype.slice.call(install.querySelectorAll('[role="tab"]'));
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        select(tab);
        if (prefsAllowed()) store.set('ustin-site-install-tab', tab.dataset.tab);
      });
      tab.addEventListener('keydown', function (e) {
        var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
        if (next === null) return;
        e.preventDefault();
        select(tabs[(next + tabs.length) % tabs.length], true);
      });
    });
    var ua = navigator.userAgent;
    var device = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ipad'
      : /iPhone|iPod/.test(ua) ? 'iphone'
      : /Android/.test(ua) ? 'android'
      : 'computer';
    var remembered = prefsAllowed() ? store.get('ustin-site-install-tab') : null;
    var pick = remembered || device;
    var tab = tabs.filter(function (t) { return t.dataset.tab === pick; })[0];
    if (tab) select(tab);
    var guess = install.querySelector('[data-install-guess]');
    if (!remembered && device !== 'computer') {
      guess.textContent = 'Looks like you’re on ' + (device === 'iphone' ? 'an iPhone' : device === 'ipad' ? 'an iPad' : 'Android') + ', so that’s open. Pick another if not.';
      guess.hidden = false;
    }
    if (standalone) install.querySelector('[data-install-done]').hidden = false;
  }

  /* ---------------------------------------------------------------- cookie notice and settings */
  var banner = document.querySelector('[data-consent]');
  var dialog = document.querySelector('[data-cookie-dialog]');
  var save = function (preferences) {
    store.set(CONSENT_KEY, JSON.stringify({ v: 1, preferences: !!preferences, at: new Date().toISOString().slice(0, 10) }));
    if (!preferences) store.remove('ustin-site-install-tab');
    if (banner) banner.hidden = true;
  };
  if (banner && !consent()) {
    // Let the first screen be seen whole: the notice rises once you start scrolling, or after a few seconds.
    // Nothing that needs consent is stored before you answer.
    var shown = false;
    var show = function () {
      if (shown) return;
      shown = true;
      banner.hidden = false;
      window.removeEventListener('scroll', onFirstScroll);
    };
    var onFirstScroll = function () { if (window.scrollY > 120) show(); };
    window.addEventListener('scroll', onFirstScroll, { passive: true });
    setTimeout(show, document.body.classList.contains('home') ? 6000 : 1500);
  }
  var on = function (sel, fn) { document.querySelectorAll(sel).forEach(function (el) { el.addEventListener('click', fn); }); };
  on('[data-consent-accept]', function () { save(true); });
  on('[data-consent-essential]', function () { save(false); });
  on('[data-cookie-settings]', function () {
    if (!dialog || typeof dialog.showModal !== 'function') { window.location.href = base + 'cookies/'; return; }
    dialog.querySelector('[data-pref="preferences"]').checked = prefsAllowed();
    dialog.showModal();
  });
  if (dialog) {
    dialog.addEventListener('close', function () {
      if (dialog.returnValue === 'save') save(dialog.querySelector('[data-pref="preferences"]').checked);
    });
  }

  root.classList.add('js');
})();
