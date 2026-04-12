/* ─── SplitZ SPA — App Entry Point ──────────────────────── */

// ── App state ──────────────────────────────────────────────
const App = (() => {
  let _user = null;

  function setUser(u) {
    _user = u;
    if (u) localStorage.setItem('splitz_user', JSON.stringify(u));
    else   localStorage.removeItem('splitz_user');
  }

  function currentUser() { return _user; }

  function init() {
    const stored = localStorage.getItem('splitz_user');
    if (stored) {
      try { _user = JSON.parse(stored); } catch { _user = null; }
    }
  }

  return { setUser, currentUser, init };
})();

// ── Router ─────────────────────────────────────────────────
const Router = (() => {
  // Stack for back navigation
  let _stack = [];

  // Page configuration
  const pages = {
    'login':            { pageId: 'page-login',          auth: false, topbar: false, nav: false, title: '' },
    'register':         { pageId: 'page-register',       auth: false, topbar: false, nav: false, title: '' },
    'dashboard':        { pageId: 'page-dashboard',      auth: true,  topbar: true,  nav: true,  title: 'Início',    back: false },
    'groups':           { pageId: 'page-groups',         auth: true,  topbar: true,  nav: true,  title: 'Grupos',    back: false, action: 'new-group', actionIcon: 'plus' },
    'new-group':        { pageId: 'page-new-group',      auth: true,  topbar: true,  nav: false, title: 'Novo Grupo', back: true },
    'group-detail':     { pageId: 'page-group-detail',   auth: true,  topbar: true,  nav: false, title: '',          back: true,  action: 'add-expense-in-group', actionIcon: 'plus' },
    'add-expense':      { pageId: 'page-add-expense',    auth: true,  topbar: true,  nav: false, title: 'Nova Despesa', back: true },
    'expense-detail':   { pageId: 'page-expense-detail', auth: true,  topbar: true,  nav: false, title: 'Despesa', back: true },
    'friends':          { pageId: 'page-friends',        auth: true,  topbar: true,  nav: true,  title: 'Amigos',    back: false },
    'friend-requests':  { pageId: 'page-friend-requests',auth: true,  topbar: true,  nav: false, title: 'Pedidos',   back: true },
    'activity':         { pageId: 'page-activity',       auth: true,  topbar: true,  nav: true,  title: 'Atividade', back: false },
    'settle':           { pageId: 'page-settle',         auth: true,  topbar: true,  nav: false, title: 'Registrar Pagamento', back: true },
  };

  const NAV_PAGES = ['dashboard', 'groups', 'friends', 'activity'];

  function go(route, params = {}) {
    const cfg = pages[route];
    if (!cfg) { console.warn('Unknown route:', route); return; }

    // Auth guard
    if (cfg.auth && !App.currentUser()) {
      go('login');
      return;
    }

    // Push to stack (for back button)
    if (_stack[_stack.length - 1]?.route !== route) {
      _stack.push({ route, params });
    }

    // Show/hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(cfg.pageId);
    if (pageEl) {
      pageEl.classList.add('active');
      pageEl.classList.add('page-enter');
      pageEl.addEventListener('animationend', () => pageEl.classList.remove('page-enter'), { once: true });
    }

    // Topbar
    const topbar = document.getElementById('topbar');
    const backBtn= document.getElementById('topbar-back');
    const title  = document.getElementById('topbar-title');
    const actions= document.getElementById('topbar-actions');

    if (cfg.topbar) {
      topbar.classList.remove('hidden');
      title.textContent = cfg.title;
      backBtn.classList.toggle('hidden', !cfg.back);
      actions.innerHTML = '';

      // Action button
      if (cfg.action === 'new-group') {
        actions.innerHTML = `
          <button class="btn btn-ghost btn-icon" onclick="Router.go('new-group')" aria-label="Novo grupo">
            ${plusIcon()}
          </button>
        `;
      } else if (cfg.action === 'add-expense-in-group') {
        const gid = params.id;
        if (gid) {
          actions.innerHTML = `
            <button class="btn btn-primary btn-sm" onclick="Router.go('add-expense', { groupId: ${gid} })">
              + Despesa
            </button>
          `;
        }
      }
    } else {
      topbar.classList.add('hidden');
    }

    // Bottom nav
    const bottomnav = document.getElementById('bottomnav');
    if (cfg.nav) {
      bottomnav.classList.remove('hidden');
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.nav === route);
      });
    } else {
      bottomnav.classList.add('hidden');
    }

    // FAB
    removeFAB();
    if (route === 'dashboard') {
      addFAB(() => Router.go('add-expense'));
    }

    // Load page content
    loadPage(route, params);
  }

  function back() {
    if (_stack.length > 1) {
      _stack.pop();
      const prev = _stack[_stack.length - 1];
      // Replace top without pushing again
      _stack.pop();
      go(prev.route, prev.params);
    } else {
      go('dashboard');
    }
  }

  function loadPage(route, params) {
    switch (route) {
      case 'dashboard':        loadDashboard();                   break;
      case 'groups':           loadGroups();                      break;
      case 'new-group':        initNewGroup();                    break;
      case 'group-detail':     loadGroupDetail(params.id);       break;
      case 'add-expense':      loadAddExpense(params);            break;
      case 'expense-detail':   loadExpenseDetail(params.id);     break;
      case 'friends':          loadFriends();                     break;
      case 'friend-requests':  loadFriendRequests();              break;
      case 'activity':         loadActivity();                    break;
      case 'settle':           loadSettle(params);                break;
    }
  }

  return { go, back };
})();

// ── FAB helpers ────────────────────────────────────────────
function addFAB(handler) {
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.id = 'global-fab';
  fab.setAttribute('aria-label', 'Adicionar despesa');
  fab.innerHTML = plusIcon(24);
  fab.onclick = handler;
  document.getElementById('app').appendChild(fab);
}
function removeFAB() {
  document.getElementById('global-fab')?.remove();
}
function plusIcon(size = 20) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
}

// ── Bottom nav ─────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const route = item.dataset.nav;
    if (route) Router.go(route);
  });
});

// ── Back button ────────────────────────────────────────────
document.getElementById('topbar-back').addEventListener('click', () => Router.back());

// ── Auth pages init ────────────────────────────────────────
initAuthPages();

// ── Startup ────────────────────────────────────────────────
async function startup() {
  App.init();

  if (!API.getToken()) {
    Router.go('login');
    return;
  }

  // Verify token is still valid
  try {
    const { user } = await API.getMe();
    App.setUser(user);
    Router.go('dashboard');
  } catch (err) {
    App.setUser(null);
    API.setToken(null);
    Router.go('login');
  }
}

// Logout helper (accessible from any page)
window.logout = async () => {
  const ok = await Dialog.show('Sair', 'Deseja realmente sair da sua conta?', 'Sair', 'secondary');
  if (!ok) return;
  try { await API.logout(); } catch {}
  App.setUser(null);
  Router.go('login');
};

startup();
