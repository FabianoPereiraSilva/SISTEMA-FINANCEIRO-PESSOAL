// Budgets & Spending Limits Module
const budgets = {
  list: [],

  async load(month) {
    try {
      const targetMonth = month || app.currentMonth;
      const res = await api.request(`/api/budgets?month=${targetMonth}`);
      this.list = res.budgets || [];
      this.renderGrid(this.list);
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
    }
  },

  async populateCategories() {
    try {
      const res = await api.request('/api/categories?type=expense');
      const cats = res.categories || [];
      const select = document.getElementById('budgetCategory');
      if (select) {
        select.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      }
    } catch (err) {
      console.error('Erro ao carregar categorias no modal de orçamentos:', err);
    }
  },

  renderGrid(items) {
    const container = document.getElementById('budgetsGrid');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="artifact-card" style="grid-column: 1 / -1; text-align: center; padding: 48px;">
          <h3 class="font-serif" style="font-size: 20px; margin-bottom: 8px;">Nenhum teto de gastos definido para este mês</h3>
          <p style="color: var(--color-slate-gray); margin-bottom: 24px; font-size: 15px;">
            Defina orçamentos para suas categorias de despesas (como Alimentação, Lazer ou Moradia) para monitorar seus limites em tempo real.
          </p>
          <button class="pill-btn pill-btn-filled" onclick="app.openBudgetModal()">
            Definir Primeiro Orçamento
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(b => {
      const isOver = b.isOverLimit;
      const fillColor = isOver ? 'var(--color-sienna-brown)' : (b.percentage > 80 ? '#9a3412' : '#17191c');
      const statusText = isOver 
        ? `<span style="color: var(--color-sienna-brown); font-weight: 500;">Excedido em ${api.formatCurrency(Math.abs(b.remaining))}</span>`
        : `<span style="color: var(--color-slate-gray);">Resta: ${api.formatCurrency(b.remaining)}</span>`;

      return `
        <div class="card-floating" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <span class="type-tag" style="margin-bottom: 4px;">Orçamento Mensal</span>
                <h3 class="font-serif" style="font-size: 20px; margin: 0;">${b.category_name}</h3>
              </div>
              <button class="text-link-arrow" style="color: var(--color-sienna-brown); font-size: 13px;" onclick="budgets.delete(${b.id})">
                Remover
              </button>
            </div>

            <div style="margin: 20px 0 12px 0;">
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                <span style="font-weight: 500;">${api.formatCurrency(b.spent)}</span>
                <span style="color: var(--color-slate-gray);">Teto: ${api.formatCurrency(b.limit)}</span>
              </div>
              <div class="progress-track" style="height: 8px;">
                <div class="progress-fill" style="width: ${b.percentage}%; background-color: ${fillColor};"></div>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; border-top: 1px solid #f2f2f3; padding-top: 12px;">
            <span>${b.percentage}% utilizado</span>
            ${statusText}
          </div>
        </div>
      `;
    }).join('');
  },

  async handleSave(e) {
    e.preventDefault();
    const category_id = document.getElementById('budgetCategory').value;
    const monthly_limit = document.getElementById('budgetLimit').value;
    const month = app.currentMonth;

    try {
      await api.request('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({ category_id, monthly_limit, month })
      });

      app.showToast('Orçamento salvo com sucesso!');
      app.closeModal('budgetModal');
      document.getElementById('budgetForm').reset();
      this.load(app.currentMonth);
    } catch (err) {
      app.showToast(err.message || 'Erro ao salvar orçamento.');
    }
  },

  async delete(id) {
    if (!confirm('Deseja remover este teto de gastos?')) return;

    try {
      await api.request(`/api/budgets/${id}`, { method: 'DELETE' });
      app.showToast('Orçamento removido.');
      this.load(app.currentMonth);
    } catch (err) {
      app.showToast(err.message || 'Erro ao remover.');
    }
  }
};
