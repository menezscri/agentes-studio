/* ─── Groups pages ───────────────────────────────────────── */

// ── Groups list ────────────────────────────────────────────
async function loadGroups() {
  const container = document.getElementById('groups-content');
  container.innerHTML = LoadingScreen();
  try {
    const { groups } = await API.getGroups();
    if (!groups.length) {
      container.innerHTML = `
        <div class="px-4 pt-4">
          ${EmptyState({
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
            title: 'Nenhum grupo',
            body: 'Crie um grupo para começar a dividir despesas com amigos',
          })}
        </div>
      `;
      return;
    }
    container.innerHTML = `
      <div class="card mx-4 mt-4">
        ${groups.map(g => `
          <div class="list-item card-pressable" onclick="Router.go('group-detail', { id: ${g.id} })">
            <div class="avatar avatar-md">${g.name[0].toUpperCase()}</div>
            <div class="list-item-content">
              <div class="list-item-title">${escHtml(g.name)}</div>
              <div class="list-item-subtitle">${g.member_count} membro${g.member_count !== 1 ? 's' : ''}</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-4)"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        `).join('')}
      </div>
      <div style="height:24px"></div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p class="text-danger">${err.message}</p></div>`;
  }
}

// ── New group ──────────────────────────────────────────────
async function initNewGroup() {
  const friendsContainer = document.getElementById('ng-friends-list');
  friendsContainer.innerHTML = `<div class="spinner" style="margin:12px auto"></div>`;

  let selectedFriends = new Set();
  try {
    const { friends } = await API.getFriends();
    if (!friends.length) {
      friendsContainer.innerHTML = `<p class="text-sm text-muted" style="padding:8px 0">Adicione amigos primeiro para incluir no grupo.</p>`;
    } else {
      friendsContainer.innerHTML = `
        <div class="card mt-2">
          ${friends.map(f => `
            <div class="checkbox-item" onclick="toggleFriend(${f.id}, this)">
              <div class="checkbox" id="check-${f.id}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:none"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              ${Avatar(f.name, 'sm')}
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">${escHtml(f.name)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  } catch {
    friendsContainer.innerHTML = `<p class="text-sm text-danger">Erro ao carregar amigos</p>`;
  }

  window.toggleFriend = (id, row) => {
    const box = document.getElementById(`check-${id}`);
    const icon = box.querySelector('svg');
    if (selectedFriends.has(id)) {
      selectedFriends.delete(id);
      box.classList.remove('checked');
      icon.style.display = 'none';
    } else {
      selectedFriends.add(id);
      box.classList.add('checked');
      icon.style.display = 'block';
    }
  };

  document.getElementById('new-group-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn   = e.target.querySelector('[type=submit]');
    const errEl = document.getElementById('ng-error');
    const name  = document.getElementById('ng-name').value.trim();
    const desc  = document.getElementById('ng-desc').value.trim();
    if (!name) return;
    setButtonLoading(btn, true);
    try {
      const { group } = await API.createGroup({
        name, description: desc,
        memberIds: [...selectedFriends],
      });
      Toast.success('Grupo criado!');
      Router.go('group-detail', { id: group.id });
    } catch (err) {
      errEl.style.display = 'flex';
      errEl.textContent   = err.message;
    } finally {
      setButtonLoading(btn, false, 'Criar grupo');
    }
  };
}

// ── Group detail ───────────────────────────────────────────
let _groupDetailId = null;
let _groupDetailTab = 'expenses';

async function loadGroupDetail(groupId) {
  _groupDetailId = groupId;
  const container = document.getElementById('group-detail-content');
  container.innerHTML = LoadingScreen();

  try {
    const [groupData, expData, balData] = await Promise.all([
      API.getGroup(groupId),
      API.getGroupExpenses(groupId),
      API.getGroupBalances(groupId),
    ]);
    const group    = groupData.group;
    const members  = groupData.members || [];
    const expenses = expData.expenses || [];
    const balances = balData;

    // Update topbar title
    document.getElementById('topbar-title').textContent = group.name;

    container.innerHTML = `
      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-item ${_groupDetailTab === 'expenses' ? 'active' : ''}"
          onclick="switchGroupTab('expenses')">Despesas</button>
        <button class="tab-item ${_groupDetailTab === 'balances' ? 'active' : ''}"
          onclick="switchGroupTab('balances')">Saldos</button>
        <button class="tab-item ${_groupDetailTab === 'members' ? 'active' : ''}"
          onclick="switchGroupTab('members')">Membros</button>
      </div>

      <!-- Expenses tab -->
      <div id="tab-expenses" class="tab-panel ${_groupDetailTab === 'expenses' ? 'active' : ''}">
        ${expenses.length === 0 ? `
          <div class="px-4">
            ${EmptyState({
              icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
              title: 'Nenhuma despesa',
              body: 'Adicione a primeira despesa do grupo',
            })}
          </div>
        ` : `
          <div class="card mx-4 mt-4">
            ${expenses.map(exp => renderExpenseItem(exp)).join('')}
          </div>
          <div style="height:24px"></div>
        `}
      </div>

      <!-- Balances tab -->
      <div id="tab-balances" class="tab-panel ${_groupDetailTab === 'balances' ? 'active' : ''}">
        ${renderGroupBalances(balances, members)}
      </div>

      <!-- Members tab -->
      <div id="tab-members" class="tab-panel ${_groupDetailTab === 'members' ? 'active' : ''}">
        <div class="card mx-4 mt-4">
          ${members.map(m => `
            <div class="list-item">
              ${Avatar(m.name, 'md')}
              <div class="list-item-content">
                <div class="list-item-title">${escHtml(m.name)}</div>
                <div class="list-item-subtitle">${m.role === 'admin' ? 'Admin' : 'Membro'}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="height:24px"></div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p class="text-danger">${err.message}</p></div>`;
  }
}

function switchGroupTab(tab) {
  _groupDetailTab = tab;
  document.querySelectorAll('.tab-item').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase().includes(tab.slice(0,5).toLowerCase())));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
}

function renderExpenseItem(exp) {
  const userId = App.currentUser()?.id;
  const isMyExpense = exp.paid_by === userId;
  return `
    <div class="list-item card-pressable" onclick="Router.go('expense-detail', { id: ${exp.id} })">
      <div class="avatar avatar-md" style="font-size:.75rem">
        ${exp.title[0].toUpperCase()}
      </div>
      <div class="list-item-content">
        <div class="list-item-title">${escHtml(exp.title)}</div>
        <div class="list-item-subtitle">${exp.paid_by_name} · ${formatDate(exp.expense_date)}</div>
      </div>
      <div class="list-item-trailing">
        <div class="amount-small">${formatCurrency(exp.amount)}</div>
        <div class="text-xs ${isMyExpense ? 'balance-positive' : 'balance-negative'}">
          ${isMyExpense ? 'paguei' : 'devo parte'}
        </div>
      </div>
    </div>
  `;
}

function renderGroupBalances(bal, members) {
  const settlements = bal.settlements || [];
  const perPerson   = bal.per_person  || [];

  if (!settlements.length && !perPerson.length) {
    return `
      <div class="px-4">
        ${EmptyState({
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
          title: 'Todos em dia',
          body: 'Nenhuma pendência financeira neste grupo',
        })}
      </div>
    `;
  }

  const userId = App.currentUser()?.id;

  return `
    <!-- Per person summary -->
    ${perPerson.length ? `
      <div class="section-header" style="padding-top:16px;padding-bottom:8px">
        <span class="section-title">Resumo por pessoa</span>
      </div>
      <div class="card mx-4">
        ${perPerson.map(p => `
          <div class="list-item">
            ${Avatar(p.name, 'sm')}
            <div class="list-item-content">
              <div class="list-item-title text-sm">${escHtml(p.name)}</div>
            </div>
            <div class="amount-small ${balanceClass(p.net_amount)}">
              ${p.net_amount >= 0 ? '+' : ''}${formatCurrency(p.net_amount)}
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Settlement suggestions -->
    ${settlements.length ? `
      <div class="section-header" style="padding-top:20px;padding-bottom:8px">
        <span class="section-title">Quem paga quem</span>
      </div>
      <div class="card mx-4">
        ${settlements.map(s => `
          <div class="settle-row" style="padding:12px 16px">
            ${Avatar(s.from_name, 'sm')}
            <div class="flex-1 min-w-0">
              <div class="text-sm">
                <strong>${escHtml(s.from_name)}</strong>
                paga
                <strong>${escHtml(s.to_name)}</strong>
              </div>
            </div>
            <div class="amount-small balance-negative">${formatCurrency(s.amount)}</div>
            ${s.from_user_id === userId ? `
              <button class="btn btn-sm btn-outline ml-2"
                onclick="Router.go('settle', { groupId: ${_groupDetailId}, toUserId: ${s.to_user_id}, toName: '${escHtml(s.to_name)}', amount: ${s.amount} })">
                Pagar
              </button>
            ` : ''}
          </div>
        `).join('')}
      </div>
      <div style="height:24px"></div>
    ` : ''}
  `;
}
