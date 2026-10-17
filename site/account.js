// Header buttons for accounts: "Sign in" and "Create account" when signed out, "Hi <first name>" with a small menu when signed in.
// Sign-in itself is Clerk's (docs/accounts.md). Nothing here runs unless site/account-config.js has a publishable key.
(function () {
  var cfg = window.WB_ACCOUNTS || {};
  var key = cfg.publishableKey;
  if (!key) return;
  var nav = document.getElementById('top-nav');
  var openApp = document.getElementById('open-app');
  if (!nav || !openApp) return;
  var appUrl = openApp.href;

  // The publishable key holds the address of Clerk's server for this site (base64, ends with "$").
  var host;
  try { host = atob(key.split('_')[2]).replace(/\$$/, ''); } catch (e) { return; }
  if (!/^[a-z0-9.-]+$/i.test(host)) return;

  var script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.setAttribute('data-clerk-publishable-key', key);
  script.src = 'https://' + host + '/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
  script.onload = function () {
    window.Clerk.load().then(start).catch(function () { /* the plain page stays usable */ });
  };
  document.head.appendChild(script);

  var mine = [];
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    mine.push(n);
    return n;
  }
  function clear() {
    mine.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
    mine = [];
  }

  function signedOut() {
    var inn = el('button', 'top-link acct-signin', 'Sign in');
    inn.type = 'button';
    inn.addEventListener('click', function () { window.Clerk.openSignIn({}); });
    var up = el('button', 'btn top-app', 'Create account');
    up.type = 'button';
    up.addEventListener('click', function () { window.Clerk.openSignUp({}); });
    nav.insertBefore(inn, openApp);
    nav.insertBefore(up, openApp);
  }

  function signedIn() {
    var wrap = el('div', 'acct');
    var btn = el('button', 'btn btn-secondary top-app', 'Hi ' + (window.Clerk.user.firstName || 'there'));
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', 'false');
    var menu = el('div', 'acct-menu');
    menu.setAttribute('role', 'menu');
    menu.hidden = true;

    var app = el('a', 'acct-item', 'Open Wodblok');
    app.setAttribute('role', 'menuitem');
    app.href = appUrl;
    app.hidden = true;
    var pending = el('span', 'acct-item', 'On the list');
    pending.setAttribute('aria-disabled', 'true');
    var account = el('button', 'acct-item', 'Account');
    account.type = 'button';
    account.setAttribute('role', 'menuitem');
    var out = el('button', 'acct-item', 'Sign out');
    out.type = 'button';
    out.setAttribute('role', 'menuitem');
    [app, pending, account, out].forEach(function (n) { menu.appendChild(n); });
    wrap.appendChild(btn);
    wrap.appendChild(menu);
    nav.insertBefore(wrap, openApp);

    // approved accounts get the link into the app; everyone else sees that they are on the list
    fetch('/api/me', { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && j.approved) { app.hidden = false; pending.hidden = true; } })
      .catch(function () {});

    function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function () {
      var show = menu.hidden;
      menu.hidden = !show;
      btn.setAttribute('aria-expanded', String(show));
    });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
    wrap.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); btn.focus(); } });
    account.addEventListener('click', function () { close(); window.Clerk.openUserProfile(); });
    out.addEventListener('click', function () {
      close();
      // clear the app's cookie first, then sign out (signing out may leave the page)
      clearGate().then(function () { window.Clerk.signOut(); });
    });
  }

  // Clerk's cookie only exists on this site, so the app host cannot see who is signed in. For approved accounts the
  // server trades the Clerk session for a one-hour cookie that covers the whole domain (functions/api/gate-cookie.js).
  function mintGate() {
    return fetch('/api/gate-cookie', { method: 'POST', credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return !!(j && j.approved); })
      .catch(function () { return false; });
  }
  function clearGate() {
    return fetch('/api/gate-cookie', { method: 'DELETE', credentials: 'same-origin' })
      .then(function () {}, function () {});
  }

  var minted = false;
  function render() {
    clear();
    openApp.hidden = true; // the sign-in buttons or the menu take its place
    if (window.Clerk.user) {
      signedIn();
      if (!minted) { minted = true; mintGate(); }
    } else {
      signedOut();
      if (minted) { minted = false; clearGate(); }
    }
  }

  // sent here by the app: once the cookie is set, go straight back (once a minute at most, so a fault cannot loop)
  function backToApp() {
    try {
      var last = Number(sessionStorage.getItem('wb_bounce')) || 0;
      if (Date.now() - last < 60000) return;
      sessionStorage.setItem('wb_bounce', String(Date.now()));
    } catch (e) { return; }
    location.replace(appUrl);
  }

  function start() {
    render();
    window.Clerk.addListener(render);
    // keep the app's cookie fresh while this page stays open
    setInterval(function () { if (window.Clerk.user) mintGate(); }, 20 * 60 * 1000);
    // the app sends signed-out visitors here with ?signin=1
    var q = location.search;
    if (!window.Clerk.user && /[?&](signin|signup)=1/.test(q)) {
      if (/[?&]signup=1/.test(q)) window.Clerk.openSignUp({}); else window.Clerk.openSignIn({});
    }
    if (window.Clerk.user && /[?&]signin=1/.test(q)) mintGate().then(function (ok) { if (ok) backToApp(); });
    if (/[?&](signin|signup)=1/.test(q)) {
      try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* ignore */ }
    }
  }
})();
