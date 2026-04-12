/* ─── Auth pages (login + register) ─────────────────────── */

function initAuthPages() {
  // Switch between pages
  document.getElementById('go-register').addEventListener('click', () => Router.go('register'));
  document.getElementById('go-login')   .addEventListener('click', () => Router.go('login'));

  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn  = document.getElementById('login-submit');
    const errEl = document.getElementById('login-error');
    errEl.style.display = 'none';

    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    setButtonLoading(btn, true);
    try {
      const data = await API.login(email, password);
      App.setUser(data.user);
      Router.go('dashboard');
    } catch (err) {
      errEl.style.display = 'flex';
      errEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        ${err.message}
      `;
    } finally {
      setButtonLoading(btn, false, 'Entrar');
    }
  });

  // Register form
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn   = document.getElementById('reg-submit');
    const errEl = document.getElementById('reg-error');
    errEl.style.display = 'none';

    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) {
      errEl.style.display = 'flex';
      errEl.textContent = 'Preencha todos os campos';
      return;
    }

    setButtonLoading(btn, true);
    try {
      const data = await API.register(name, email, password);
      App.setUser(data.user);
      Router.go('dashboard');
    } catch (err) {
      errEl.style.display = 'flex';
      errEl.textContent = err.message;
    } finally {
      setButtonLoading(btn, false, 'Criar conta');
    }
  });
}
