/* ─── Friends pages ──────────────────────────────────────── */

async function loadFriends() {
  const container = document.getElementById('friends-content');
  container.innerHTML = LoadingScreen();
  try {
    const [friendsData, requestsData] = await Promise.all([
      API.getFriends(),
      API.getFriendRequests(),
    ]);
    const friends  = friendsData.friends  || [];
    const requests = requestsData.requests || [];

    let html = '';

    // Pending requests badge
    if (requests.length > 0) {
      html += `
        <div class="card mx-4 mt-4">
          <div class="list-item card-pressable" onclick="Router.go('friend-requests')">
            <div class="avatar avatar-md" style="background:var(--surface-3)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </div>
            <div class="list-item-content">
              <div class="list-item-title">Pedidos de amizade</div>
              <div class="list-item-subtitle">${requests.length} pendente${requests.length > 1 ? 's' : ''}</div>
            </div>
            <span class="badge badge-outline">${requests.length}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-4);margin-left:4px"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      `;
    }

    // Add friend input
    html += `
      <div class="mx-4 mt-4">
        <div class="flex gap-2">
          <input type="email" id="add-friend-email" class="input flex-1"
            placeholder="email@amigo.com" inputmode="email" autocomplete="off">
          <button class="btn btn-primary" onclick="addFriendAction()">Adicionar</button>
        </div>
        <div id="add-friend-msg" class="form-error mt-2" style="display:none"></div>
      </div>
    `;

    if (!friends.length) {
      html += `
        <div class="px-4 mt-4">
          ${EmptyState({
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
            title: 'Nenhum amigo ainda',
            body: 'Digite o e-mail de um amigo para começar',
          })}
        </div>
      `;
    } else {
      html += `
        <div class="section-header" style="margin-top:20px">
          <span class="section-title">Amigos (${friends.length})</span>
        </div>
        <div class="card mx-4">
          ${friends.map(f => `
            <div class="list-item">
              ${Avatar(f.name, 'md')}
              <div class="list-item-content">
                <div class="list-item-title">${escHtml(f.name)}</div>
                <div class="list-item-subtitle">${f.email}</div>
              </div>
              <button class="btn btn-ghost btn-icon-sm" onclick="removeFriendAction(${f.id}, '${escHtml(f.name)}')" aria-label="Remover amigo">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          `).join('')}
        </div>
        <div style="height:24px"></div>
      `;
    }

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p class="text-danger">${err.message}</p></div>`;
  }
}

window.addFriendAction = async () => {
  const input = document.getElementById('add-friend-email');
  const msg   = document.getElementById('add-friend-msg');
  const email = input.value.trim();
  if (!email) return;

  msg.style.display = 'none';
  try {
    const data = await API.addFriend(email);
    if (data.auto_accepted) {
      Toast.success(`Agora vocês são amigos!`);
    } else {
      Toast.success(`Pedido enviado para ${email}`);
    }
    input.value = '';
    loadFriends();
  } catch (err) {
    msg.style.display = 'flex';
    msg.textContent = err.message;
  }
};

window.removeFriendAction = async (id, name) => {
  const ok = await Dialog.show(`Remover ${name}?`, 'Você perderá o histórico de despesas compartilhadas.', 'Remover', 'destructive');
  if (!ok) return;
  try {
    await API.removeFriend(id);
    Toast.success('Amigo removido');
    loadFriends();
  } catch (err) {
    Toast.error(err.message);
  }
};

// ── Friend requests ────────────────────────────────────────
async function loadFriendRequests() {
  const container = document.getElementById('friend-requests-content');
  container.innerHTML = LoadingScreen();
  try {
    const { requests } = await API.getFriendRequests();
    if (!requests.length) {
      container.innerHTML = `
        <div class="px-4 pt-4">
          ${EmptyState({
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
            title: 'Nenhum pedido pendente',
            body: 'Você não tem pedidos de amizade esperando',
          })}
        </div>
      `;
      return;
    }
    container.innerHTML = `
      <div class="card mx-4 mt-4">
        ${requests.map(r => `
          <div class="list-item">
            ${Avatar(r.from_name, 'md')}
            <div class="list-item-content">
              <div class="list-item-title">${escHtml(r.from_name)}</div>
              <div class="list-item-subtitle">${r.from_email} · ${formatDate(r.created_at)}</div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-outline" onclick="handleRequest(${r.id}, 'reject')">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <button class="btn btn-sm btn-primary" onclick="handleRequest(${r.id}, 'accept')">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p class="text-danger">${err.message}</p></div>`;
  }
}

window.handleRequest = async (id, action) => {
  try {
    await API.handleFriendRequest(id, action);
    Toast.success(action === 'accept' ? 'Amizade aceita!' : 'Pedido recusado');
    loadFriendRequests();
  } catch (err) {
    Toast.error(err.message);
  }
};
