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
    out.addEventListener('click', function () { close(); window.Clerk.signOut(); });
  }

  function render() {
    clear();
    openApp.hidden = true; // the sign-in buttons or the menu take its place
    if (window.Clerk.user) signedIn(); else signedOut();
  }

  function start() {
    render();
    window.Clerk.addListener(render);
    // the app sends signed-out visitors here with ?signin=1
    var q = location.search;
    if (!window.Clerk.user && /[?&](signin|signup)=1/.test(q)) {
      if (/[?&]signup=1/.test(q)) window.Clerk.openSignUp({}); else window.Clerk.openSignIn({});
    }
    if (/[?&](signin|signup)=1/.test(q)) {
      try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* ignore */ }
    }
  }
})();
