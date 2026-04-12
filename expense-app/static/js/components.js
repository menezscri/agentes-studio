/* ─── Shared UI Components ────────────────────────────────── */

// ── Toast notifications ────────────────────────────────────
const Toast = {
  show(message, type = 'default', duration = 3000) {
    const container = document.getElementById('toast-container');
    const icons = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      error:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type !== 'default' ? type : ''}`;
    toast.innerHTML = `${icons[type] || ''}${message}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'none';
      toast.style.opacity = '0';
      toast.style.transition = 'opacity .2s';
      setTimeout(() => toast.remove(), 220);
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error'),
};

// ── Confirm Dialog ─────────────────────────────────────────
const Dialog = {
  _resolve: null,
  show(title, body, confirmLabel = 'Confirmar', variant = 'destructive') {
    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-body').textContent  = body;
    const btn = document.getElementById('dialog-confirm');
    btn.textContent = confirmLabel;
    btn.className   = `btn btn-${variant}`;
    document.getElementById('dialog-backdrop').classList.add('open');
    return new Promise(resolve => {
      this._resolve = resolve;
    });
  },
  _close(val) {
    document.getElementById('dialog-backdrop').classList.remove('open');
    if (this._resolve) { this._resolve(val); this._resolve = null; }
  }
};
document.getElementById('dialog-cancel') .addEventListener('click', () => Dialog._close(false));
document.getElementById('dialog-confirm').addEventListener('click', () => Dialog._close(true));
document.getElementById('dialog-backdrop').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) Dialog._close(false);
});

// ── Sheet (bottom drawer) ──────────────────────────────────
const Sheet = {
  _current: null,
  open(sheetEl) {
    const backdrop = document.getElementById('sheet-backdrop');
    backdrop.classList.add('open');
    sheetEl.classList.add('open');
    this._current = sheetEl;
    backdrop.onclick = () => this.close();
  },
  close() {
    const backdrop = document.getElementById('sheet-backdrop');
    backdrop.classList.remove('open');
    if (this._current) {
      this._current.classList.remove('open');
      this._current = null;
    }
  }
};

// ── Avatar initials ────────────────────────────────────────
function Avatar(name = '?', size = 'md') {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `<div class="avatar avatar-${size}" aria-hidden="true">${initials}</div>`;
}

// ── Format currency ────────────────────────────────────────
function formatCurrency(cents, currency = 'BRL') {
  const amount = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatCurrencyShort(cents) {
  const amount = cents / 100;
  if (Math.abs(amount) >= 1000) {
    return `R$${(amount / 1000).toFixed(1)}k`;
  }
  return formatCurrency(cents);
}

// ── Format date ────────────────────────────────────────────
function formatDate(ts) {
  const d = new Date(typeof ts === 'number' ? ts : Number(ts));
  const now = new Date();
  const diff = now - d;
  const day  = 86400000;

  if (diff < 60000) return 'agora';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
  if (diff < day)     return `${Math.floor(diff / 3600000)}h atrás`;
  if (diff < 2 * day) return 'ontem';
  if (diff < 7 * day) return d.toLocaleDateString('pt-BR', { weekday: 'short' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatDateFull(ts) {
  const d = new Date(typeof ts === 'number' ? ts : Number(ts));
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ── Balance color class ────────────────────────────────────
function balanceClass(cents) {
  if (cents > 0) return 'balance-positive';
  if (cents < 0) return 'balance-negative';
  return 'balance-zero';
}

// ── Balance label ──────────────────────────────────────────
function balanceLabel(cents) {
  if (cents > 0) return `tem a receber ${formatCurrency(cents)}`;
  if (cents < 0) return `deve ${formatCurrency(-cents)}`;
  return 'está em dia';
}

// ── Skeleton helpers ───────────────────────────────────────
function skeletonList(n = 4) {
  return Array.from({ length: n }, () => `
    <div class="list-item">
      <div class="skeleton skeleton-circle avatar-md" style="width:40px;height:40px"></div>
      <div class="flex-1" style="display:flex;flex-direction:column;gap:8px">
        <div class="skeleton skeleton-title" style="width:60%"></div>
        <div class="skeleton skeleton-text"  style="width:40%"></div>
      </div>
    </div>
  `).join('');
}

// ── Empty state ────────────────────────────────────────────
function EmptyState({ icon, title, body, action }) {
  const btnHtml = action
    ? `<button class="btn btn-secondary mt-4" onclick="${action.handler}">${action.label}</button>`
    : '';
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${body}</p>
      ${btnHtml}
    </div>
  `;
}

// ── Loading screen ─────────────────────────────────────────
function LoadingScreen() {
  return `<div class="loading-screen"><div class="spinner"></div></div>`;
}

// ── Set button loading ─────────────────────────────────────
function setButtonLoading(btn, loading, originalText) {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner"></div>`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ── Parse cents from input ─────────────────────────────────
function parseCents(val) {
  if (!val) return 0;
  // handles "10,50" or "10.50"
  const clean = String(val).replace(/[^\d,\.]/g, '').replace(',', '.');
  return Math.round(parseFloat(clean || '0') * 100);
}

// ── Format cents for input display ────────────────────────
function centsToInput(cents) {
  return (cents / 100).toFixed(2).replace('.', ',');
}

// ── Compute equal splits ───────────────────────────────────
function computeEqualSplits(totalCents, userIds) {
  if (!userIds.length) return [];
  const share = Math.floor(totalCents / userIds.length);
  let remainder = totalCents - share * userIds.length;
  return userIds.map((uid, i) => ({
    user_id: uid,
    amount: share + (i < remainder ? 1 : 0),
  }));
}

// ── Activity icon by type ──────────────────────────────────
function activityIcon(type) {
  const icons = {
    expense_added:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    expense_deleted: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    settlement:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    friend_added:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
    group_created:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    member_added:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
  };
  return icons[type] || icons['expense_added'];
}

function activityLabel(item) {
  const meta = item.metadata || {};
  const actor = item.actor_name || 'Alguém';
  switch (item.type) {
    case 'expense_added':   return `<strong>${actor}</strong> adicionou "<em>${meta.title || 'despesa'}</em>"`;
    case 'expense_deleted': return `<strong>${actor}</strong> removeu uma despesa`;
    case 'settlement':      return `<strong>${actor}</strong> fez um pagamento de ${formatCurrency(meta.amount || 0)}`;
    case 'friend_added':    return `<strong>${actor}</strong> adicionou ${meta.name || 'um amigo'}`;
    case 'group_created':   return `<strong>${actor}</strong> criou o grupo "<em>${meta.name || ''}</em>"`;
    case 'member_added':    return `<strong>${actor}</strong> adicionou um membro ao grupo`;
    default:                return `<strong>${actor}</strong> realizou uma ação`;
  }
}
