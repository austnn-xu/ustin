/* Loaded first by the site-wide 404 page (mobile/scripts/pages-404.mjs).
   The app lives under <site>/app/. A link from before it moved there (us-tin.org/pin/123456, /lesson/drinks-1)
   lands here: send it to the same path under app/, keeping the query and hash. Under app/ already, do nothing and
   let the app's router show the screen, or its own not-found page. */
(function () {
  var here = document.currentScript && document.currentScript.src;
  if (!here) return;
  var site = new URL('./', here).pathname;            // '/' on us-tin.org
  var path = window.location.pathname;
  if (path.indexOf(site) !== 0) return;
  var rest = path.slice(site.length);                  // e.g. pin/123456
  if (rest === 'app' || rest.indexOf('app/') === 0) return;
  window.location.replace(site + 'app/' + rest + window.location.search + window.location.hash);
})();
