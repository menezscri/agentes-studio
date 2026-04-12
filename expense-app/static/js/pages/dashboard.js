/* ─── Dashboard page ─────────────────────────────────────── */

async function loadDashboard() {
  const container = document.getElementById('dashboard-content');
  container.innerHTML = LoadingScreen();

  try {
    const [meData, groupsData, activityData] = await Promise.all([
      API.getMe(),
      API.getGroups(),
      API.getActivity('?limit=10'),
    ]);

    const me     = meData.user;
    const groups = groupsData.groups || [];
    const acts   = activityData.activity || [];

    // Compute net balance across all groups
    let netCents = 0;
    // We use a simplified per-group approach: sum of per_person balances
    // For the hero we just show totals from activity/expenses
    // Full balance computed per group
    const balanceResults = await Promise.allSettled(
      groups.map(g => API.getGroupBalances(g.id))
    );
    balanceResults.forEach(r => {
      if (r.status === 'fulfilled') {
        const pp = r.value.per_person || [];
        const mine = pp.find(p => p.user_id === me.id);
        if (mine) netCents += mine.net_amount;
      }
    });

    const heroClass  = balanceClass(netCents);
    const heroText   = netCents === 0
      ? 'Você está em dia'
      : netCents > 0
        ? `Você tem a receber`
        : `Você deve`;

    container.innerHTML = `
      <!-- Net balance hero -->
      <div class="balance-hero">
        <div class="balance-hero-amount ${heroClass}">
          ${formatCurrency(Math.abs(netCents))}
        </div>
        <div class="balance-hero-label">${heroText}</div>
        <div class="mt-3">
          ${Avatar(me.name, 'md')}
        </div>
        <div class="text-sm text-secondary mt-2">${me.name}</div>
      </div>

      <!-- Quick stats row -->
      <div class="flex gap-3 px-4 mb-2">
        <div class="card flex-1" style="text-align:center;padding:12px 8px">
          <div class="text-xl font-bold">${groups.length}</div>
          <div class="text-xs text-muted mt-1">Grupos</div>
        </div>
        <div class="card flex-1" style="text-align:center;padding:12px 8px">
          <div class="text-xl font-bold ${netCents >= 0 ? 'balance-positive' : 'balance-negative'}">
            ${netCents >= 0 ? '+' : ''}${formatCurrencyShort(netCents)}
          </div>
          <div class="text-xs text-muted mt-1">Saldo</div>
        </div>
      </div>

      <!-- Recent groups -->
      ${groups.length > 0 ? `
        <div class="section">
          <div class="section-header">
            <span class="section-title">Grupos</span>
            <button class="btn btn-ghost btn-sm" onclick="Router.go('groups')">Ver todos</button>
          </div>
          <div class="card mx-4">
            ${groups.slice(0, 3).map(g => `
              <div class="list-item card-pressable" onclick="Router.go('group-detail', { id: ${g.id} })">
                <div class="avatar avatar-md" style="background:var(--surface-3)">
                  ${g.name[0].toUpperCase()}
                </div>
                <div class="list-item-content">
                  <div class="list-item-title">${escHtml(g.name)}</div>
                  <div class="list-item-subtitle">${g.member_count} membro${g.member_count !== 1 ? 's' : ''}</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-4)"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="section px-4">
          ${EmptyState({
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
            title: 'Nenhum grupo ainda',
            body: 'Crie um grupo para começar a dividir despesas',
            action: { label: 'Criar grupo', handler: "Router.go('new-group')" },
          })}
        </div>
      `}

      <!-- Recent activity -->
      ${acts.length > 0 ? `
        <div class="section">
          <div class="section-header">
            <span class="section-title">Atividade recente</span>
            <button class="btn btn-ghost btn-sm" onclick="Router.go('activity')">Ver tudo</button>
          </div>
          <div class="card mx-4">
            ${acts.slice(0, 5).map(a => `
              <div class="list-item">
                <div class="activity-icon">${activityIcon(a.type)}</div>
                <div class="list-item-content">
                  <div class="list-item-title" style="font-size:.875rem;font-weight:400">
                    ${activityLabel(a)}
                  </div>
                  <div class="list-item-subtitle">${formatDate(a.created_at)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div style="height:24px"></div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="text-danger">${err.message}</p>
        <button class="btn btn-secondary mt-4" onclick="loadDashboard()">Tentar novamente</button>
      </div>
    `;
  }
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
window.escHtml = escHtml;
