/* ─── Expense pages ──────────────────────────────────────── */

// ── Add / edit expense form ────────────────────────────────
async function loadAddExpense(params = {}) {
  const container = document.getElementById('add-expense-content');
  const groupId   = params.groupId ? Number(params.groupId) : null;

  container.innerHTML = LoadingScreen();

  try {
    let members = [];
    if (groupId) {
      const { members: m } = await API.getGroup(groupId);
      members = m || [];
    } else {
      const { friends } = await API.getFriends();
      const me = App.currentUser();
      members = [{ id: me.id, name: me.name }, ...friends];
    }

    const me = App.currentUser();
    let splitType    = 'equal';
    let selectedUsers= new Set(members.map(m => m.id));

    container.innerHTML = `
      <form id="expense-form">
        <div class="form-group">
          <label for="exp-title">Descrição</label>
          <input type="text" id="exp-title" class="input" placeholder="Ex: Jantar, Uber, Hotel…" required autofocus>
        </div>
        <div class="form-group">
          <label for="exp-amount">Valor total</label>
          <div class="input-currency-wrapper">
            <span class="input-currency-prefix">R$</span>
            <input type="number" id="exp-amount" class="input" placeholder="0,00"
              min="0.01" step="0.01" inputmode="decimal" required>
          </div>
        </div>
        <div class="form-group">
          <label for="exp-date">Data</label>
          <input type="date" id="exp-date" class="input" value="${today()}" required>
        </div>
        <div class="form-group">
          <label for="exp-payer">Quem pagou</label>
          <select id="exp-payer" class="select">
            ${members.map(m => `<option value="${m.id}" ${m.id === me.id ? 'selected' : ''}>${escHtml(m.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Dividir entre</label>
          <div class="card mt-2" id="split-members">
            ${members.map(m => `
              <div class="checkbox-item" onclick="toggleExpenseMember(${m.id}, this)">
                <div class="checkbox checked" id="expcheck-${m.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                ${Avatar(m.name, 'sm')}
                <div class="flex-1 min-w-0 text-sm font-medium truncate">${escHtml(m.name)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>Como dividir</label>
          <div class="split-selector mt-2">
            <button type="button" class="split-btn active" onclick="setSplitType('equal', this)">Igualmente</button>
            <button type="button" class="split-btn" onclick="setSplitType('exact', this)">Valor exato</button>
            <button type="button" class="split-btn" onclick="setSplitType('percent', this)">Porcentagem</button>
          </div>
        </div>
        <div id="splits-detail"></div>
        <div id="exp-error" class="form-error mt-2" style="display:none"></div>
        <button type="submit" class="btn btn-primary btn-full btn-lg mt-4">Adicionar despesa</button>
        <div style="height:12px"></div>
      </form>
    `;

    window.toggleExpenseMember = (id, row) => {
      const box  = document.getElementById(`expcheck-${id}`);
      const icon = box.querySelector('svg');
      if (selectedUsers.has(id)) {
        selectedUsers.delete(id);
        box.classList.remove('checked');
        icon.style.display = 'none';
      } else {
        selectedUsers.add(id);
        box.classList.add('checked');
        icon.style.display = 'block';
      }
      updateSplitsDetail();
    };

    window.setSplitType = (type, btn) => {
      splitType = type;
      document.querySelectorAll('.split-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateSplitsDetail();
    };

    function updateSplitsDetail() {
      const detail    = document.getElementById('splits-detail');
      const totalStr  = document.getElementById('exp-amount').value;
      const totalCents= parseCents(totalStr);
      const uids      = [...selectedUsers];

      if (splitType === 'equal') {
        const splits = computeEqualSplits(totalCents, uids);
        detail.innerHTML = `
          <div class="card mt-2" style="padding:0">
            ${splits.map(s => {
              const member = members.find(m => m.id === s.user_id);
              return `
                <div class="split-row">
                  ${Avatar(member?.name || '?', 'sm')}
                  <div class="flex-1 min-w-0 text-sm font-medium truncate">${escHtml(member?.name || '')}</div>
                  <div class="amount-small text-secondary">${formatCurrency(s.amount)}</div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else if (splitType === 'exact') {
        detail.innerHTML = `
          <div class="card mt-2" style="padding:8px 16px">
            ${uids.map(uid => {
              const member = members.find(m => m.id === uid);
              const share  = totalCents > 0 ? Math.floor(totalCents / uids.length) : 0;
              return `
                <div class="split-row">
                  ${Avatar(member?.name || '?', 'sm')}
                  <div class="flex-1 min-w-0 text-sm font-medium truncate">${escHtml(member?.name || '')}</div>
                  <div class="input-currency-wrapper" style="width:120px">
                    <span class="input-currency-prefix" style="font-size:.875rem">R$</span>
                    <input type="number" class="split-row-input" id="exact-${uid}"
                      value="${(share/100).toFixed(2)}"
                      step="0.01" min="0" style="padding-left:28px"
                      oninput="validateExactSplits()">
                  </div>
                </div>
              `;
            }).join('')}
            <div id="exact-total" class="text-xs text-muted mt-2 mb-1" style="text-align:right"></div>
          </div>
        `;
        validateExactSplits();
      } else {
        detail.innerHTML = `
          <div class="card mt-2" style="padding:8px 16px">
            ${uids.map((uid, i) => {
              const member  = members.find(m => m.id === uid);
              const pct     = Math.floor(100 / uids.length) + (i === 0 ? 100 - Math.floor(100 / uids.length) * uids.length : 0);
              return `
                <div class="split-row">
                  ${Avatar(member?.name || '?', 'sm')}
                  <div class="flex-1 min-w-0 text-sm font-medium truncate">${escHtml(member?.name || '')}</div>
                  <div style="display:flex;align-items:center;gap:4px">
                    <input type="number" class="split-row-input" id="pct-${uid}"
                      value="${pct}" min="0" max="100" step="1" style="width:80px;text-align:right"
                      oninput="validatePercentSplits()">
                    <span class="text-secondary" style="font-size:.875rem">%</span>
                  </div>
                </div>
              `;
            }).join('')}
            <div id="pct-total" class="text-xs mt-2 mb-1" style="text-align:right"></div>
          </div>
        `;
        validatePercentSplits();
      }
    }

    window.validateExactSplits = () => {
      const uids    = [...selectedUsers];
      const totalStr= document.getElementById('exp-amount').value;
      const total   = parseCents(totalStr);
      const sum     = uids.reduce((acc, uid) => {
        const v = parseCents(document.getElementById(`exact-${uid}`)?.value || '0');
        return acc + v;
      }, 0);
      const el = document.getElementById('exact-total');
      if (!el) return;
      const diff = total - sum;
      el.className = `text-xs mt-2 mb-1 ${Math.abs(diff) <= 1 ? 'text-success' : 'text-danger'}`;
      el.textContent = `Total: ${formatCurrency(sum)} / ${formatCurrency(total)} (${diff > 0 ? '-' : diff < 0 ? '+' : ''}${formatCurrency(Math.abs(diff))})`;
    };

    window.validatePercentSplits = () => {
      const uids = [...selectedUsers];
      const sum  = uids.reduce((acc, uid) => {
        return acc + Number(document.getElementById(`pct-${uid}`)?.value || 0);
      }, 0);
      const el = document.getElementById('pct-total');
      if (!el) return;
      el.className = `text-xs mt-2 mb-1 ${Math.abs(sum - 100) < 0.01 ? 'text-success' : 'text-danger'}`;
      el.textContent = `Total: ${sum.toFixed(1)}% / 100%`;
    };

    // Listen to amount changes to update equal splits
    document.getElementById('exp-amount').addEventListener('input', updateSplitsDetail);

    // Initial render
    updateSplitsDetail();

    // Submit
    document.getElementById('expense-form').onsubmit = async (e) => {
      e.preventDefault();
      const btn     = e.target.querySelector('[type=submit]');
      const errEl   = document.getElementById('exp-error');
      errEl.style.display = 'none';

      const title  = document.getElementById('exp-title').value.trim();
      const amtStr = document.getElementById('exp-amount').value;
      const amount = parseCents(amtStr);
      const paidBy = Number(document.getElementById('exp-payer').value);
      const dateStr= document.getElementById('exp-date').value;
      const date   = new Date(dateStr).getTime();
      const uids   = [...selectedUsers];

      if (!title || !amount) {
        errEl.style.display = 'flex';
        errEl.textContent = 'Preencha título e valor';
        return;
      }
      if (!uids.length) {
        errEl.style.display = 'flex';
        errEl.textContent = 'Selecione pelo menos uma pessoa';
        return;
      }

      let splits = [];
      if (splitType === 'equal') {
        splits = computeEqualSplits(amount, uids);
      } else if (splitType === 'exact') {
        splits = uids.map(uid => ({
          user_id: uid,
          amount: parseCents(document.getElementById(`exact-${uid}`)?.value || '0'),
        }));
        const sum = splits.reduce((a, s) => a + s.amount, 0);
        if (Math.abs(sum - amount) > 1) {
          errEl.style.display = 'flex';
          errEl.textContent = `A soma (${formatCurrency(sum)}) deve ser igual ao total (${formatCurrency(amount)})`;
          return;
        }
      } else {
        const totalPct = uids.reduce((a, uid) => a + Number(document.getElementById(`pct-${uid}`)?.value || 0), 0);
        if (Math.abs(totalPct - 100) > 0.1) {
          errEl.style.display = 'flex';
          errEl.textContent = `A soma das porcentagens deve ser 100% (atual: ${totalPct.toFixed(1)}%)`;
          return;
        }
        splits = uids.map((uid, i) => {
          const pct = Number(document.getElementById(`pct-${uid}`)?.value || 0);
          const amt = Math.round(amount * pct / 100);
          return { user_id: uid, amount: amt, percent: pct };
        });
        // Fix rounding
        const diff = amount - splits.reduce((a, s) => a + s.amount, 0);
        if (diff !== 0) splits[0].amount += diff;
      }

      setButtonLoading(btn, true);
      try {
        await API.createExpense({
          title, amount, paidBy, splitType, date,
          splits, groupId,
        });
        Toast.success('Despesa adicionada!');
        if (groupId) {
          Router.go('group-detail', { id: groupId });
        } else {
          Router.go('dashboard');
        }
      } catch (err) {
        errEl.style.display = 'flex';
        errEl.textContent   = err.message;
      } finally {
        setButtonLoading(btn, false, 'Adicionar despesa');
      }
    };

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p class="text-danger">${err.message}</p></div>`;
  }
}

// ── Expense detail ─────────────────────────────────────────
async function loadExpenseDetail(expenseId) {
  const container = document.getElementById('expense-detail-content');
  container.innerHTML = LoadingScreen();
  try {
    const { expense, splits } = await API.getExpense(expenseId);
    const me = App.currentUser();
    const mySplit = splits.find(s => s.user_id === me.id);

    container.innerHTML = `
      <div class="card mb-4">
        <div class="card-body" style="text-align:center;padding:24px 16px">
          <div class="amount-large mb-2">${formatCurrency(expense.amount)}</div>
          <h2 class="mb-1">${escHtml(expense.title)}</h2>
          <p class="text-sm text-muted">Pago por ${escHtml(expense.paid_by_name)} · ${formatDateFull(expense.expense_date)}</p>
          <span class="badge badge-outline mt-3">${
            expense.split_type === 'equal'   ? 'Divisão igualitária' :
            expense.split_type === 'exact'   ? 'Valores exatos' :
            'Por porcentagem'
          }</span>
        </div>
        ${expense.description ? `<div class="card-footer"><p class="text-sm">${escHtml(expense.description)}</p></div>` : ''}
      </div>

      <h3 class="px-0 mb-3" style="font-size:.875rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3)">Divisão</h3>
      <div class="card mb-4">
        ${splits.map(s => `
          <div class="list-item">
            ${Avatar(s.user_name, 'sm')}
            <div class="list-item-content">
              <div class="list-item-title text-sm">${escHtml(s.user_name)}</div>
              ${s.percent != null ? `<div class="list-item-subtitle">${s.percent.toFixed(1)}%</div>` : ''}
            </div>
            <div class="amount-small ${s.user_id === expense.paid_by ? 'balance-positive' : 'balance-negative'}">
              ${s.user_id === expense.paid_by ? '+' : '-'}${formatCurrency(s.amount)}
            </div>
          </div>
        `).join('')}
      </div>

      ${expense.created_by === me.id ? `
        <button class="btn btn-destructive btn-full"
          onclick="deleteExpenseAction(${expense.id}, ${expense.group_id || 'null'})">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Excluir despesa
        </button>
      ` : ''}
      <div style="height:24px"></div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p class="text-danger">${err.message}</p></div>`;
  }
}

window.deleteExpenseAction = async (id, groupId) => {
  const ok = await Dialog.show('Excluir despesa', 'Esta ação não pode ser desfeita. Deseja continuar?', 'Excluir');
  if (!ok) return;
  try {
    await API.deleteExpense(id);
    Toast.success('Despesa excluída');
    if (groupId) {
      Router.go('group-detail', { id: groupId });
    } else {
      Router.go('dashboard');
    }
  } catch (err) {
    Toast.error(err.message);
  }
};

// ── Settle form ────────────────────────────────────────────
async function loadSettle(params = {}) {
  const container  = document.getElementById('settle-content');
  const groupId    = Number(params.groupId);
  const toUserId   = Number(params.toUserId);
  const toName     = params.toName || 'usuário';
  const suggestedCents = Number(params.amount || 0);

  container.innerHTML = `
    <p class="text-secondary mb-4">Registre um pagamento para <strong>${escHtml(toName)}</strong>.</p>
    <form id="settle-form">
      <div class="form-group">
        <label for="settle-amount">Valor</label>
        <div class="input-currency-wrapper">
          <span class="input-currency-prefix">R$</span>
          <input type="number" id="settle-amount" class="input" step="0.01" min="0.01"
            value="${suggestedCents > 0 ? (suggestedCents/100).toFixed(2) : ''}"
            placeholder="0,00" inputmode="decimal" required>
        </div>
      </div>
      <div class="form-group">
        <label for="settle-note">Observação (opcional)</label>
        <input type="text" id="settle-note" class="input" placeholder="Pix, dinheiro…">
      </div>
      <div id="settle-error" class="form-error mt-2" style="display:none"></div>
      <button type="submit" class="btn btn-primary btn-full btn-lg mt-4">Registrar pagamento</button>
    </form>
  `;

  document.getElementById('settle-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn    = e.target.querySelector('[type=submit]');
    const errEl  = document.getElementById('settle-error');
    const amount = parseCents(document.getElementById('settle-amount').value);
    const note   = document.getElementById('settle-note').value;
    if (!amount) {
      errEl.style.display = 'flex';
      errEl.textContent = 'Informe o valor';
      return;
    }
    setButtonLoading(btn, true);
    try {
      await API.settleGroup(groupId, { toUserId, amount, note });
      Toast.success('Pagamento registrado!');
      Router.go('group-detail', { id: groupId });
    } catch (err) {
      errEl.style.display = 'flex';
      errEl.textContent = err.message;
    } finally {
      setButtonLoading(btn, false, 'Registrar pagamento');
    }
  };
}
