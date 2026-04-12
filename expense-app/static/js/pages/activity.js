/* ─── Activity feed ──────────────────────────────────────── */

async function loadActivity() {
  const container = document.getElementById('activity-content');
  container.innerHTML = LoadingScreen();
  try {
    const { activity } = await API.getActivity('?limit=30');
    if (!activity.length) {
      container.innerHTML = `
        <div class="px-4 pt-4">
          ${EmptyState({
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
            title: 'Nenhuma atividade',
            body: 'Suas atividades aparecerão aqui conforme você usa o app',
          })}
        </div>
      `;
      return;
    }
    container.innerHTML = `
      <div class="card mx-4 mt-4">
        ${activity.map(a => `
          <div class="list-item">
            <div class="activity-icon">${activityIcon(a.type)}</div>
            <div class="list-item-content">
              <div style="font-size:.9375rem;line-height:1.4">${activityLabel(a)}</div>
              <div class="list-item-subtitle">${formatDate(a.created_at)}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="height:24px"></div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p class="text-danger">${err.message}</p></div>`;
  }
}
