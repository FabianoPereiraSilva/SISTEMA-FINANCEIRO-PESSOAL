// Transactions Management Module
const transactions = {
  list: [],
  categories: [],
  pendingImport: [],

  async load(month) {
    try {
      const targetMonth = month || app.currentMonth;
      await this.loadCategories();

      const res = await api.request(`/api/transactions?month=${targetMonth}`);
      this.list = res.transactions || [];
      this.renderTable(this.list);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
    }
  },

  async loadCategories() {
    try {
      const res = await api.request('/api/categories');
      this.categories = res.categories || [];
      this.populateCategorySelects();
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  },

  populateCategorySelects() {
    const filterCat = document.getElementById('filterCategory');
    if (filterCat) {
      const currentVal = filterCat.value;
      filterCat.innerHTML = '<option value="">Todas as Categorias</option>' +
        this.categories.map(c => `<option value="${c.id}">${c.name} (${c.type === 'expense' ? 'Despesa' : 'Receita'})</option>`).join('');
      filterCat.value = currentVal;
    }

    const modalType = document.getElementById('transType');
    if (modalType) {
      this.updateModalCategories(modalType.value);
    }
  },

  updateModalCategories(type) {
    const modalCat = document.getElementById('transCategory');
    if (!modalCat) return;

    const filtered = this.categories.filter(c => c.type === type);
    modalCat.innerHTML = '<option value="">Sem categoria definida</option>' +
      filtered.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  },

  onTypeChange(type) {
    this.updateModalCategories(type);
  },

  toggleInstallmentsBox(checked) {
    const box = document.getElementById('installmentOptionsBox');
    if (box) {
      box.style.display = checked ? 'block' : 'none';
    }
  },

  applyFilters() {
    const search = document.getElementById('filterSearch').value.toLowerCase();
    const type = document.getElementById('filterType').value;
    const categoryId = document.getElementById('filterCategory').value;
    const status = document.getElementById('filterStatus').value;

    const filtered = this.list.filter(t => {
      const matchSearch = !search || 
        t.description.toLowerCase().includes(search) || 
        (t.notes && t.notes.toLowerCase().includes(search));
      
      const matchType = !type || t.type === type;
      const matchCategory = !categoryId || String(t.category_id) === String(categoryId);
      const matchStatus = !status || t.status === status;

      return matchSearch && matchType && matchCategory && matchStatus;
    });

    this.renderTable(filtered);
  },

  clearFilters() {
    document.getElementById('filterSearch').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterStatus').value = '';
    this.renderTable(this.list);
  },

  renderTable(items) {
    const tbody = document.getElementById('allTransactionsBody');
    if (!tbody) return;

    if (!items || items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--color-slate-gray); padding: 40px;">
            Nenhuma transação encontrada para este período ou filtro.
          </td>
        </tr>
      `;
      return;
    }

    const methodLabels = {
      pix: 'PIX', credit: 'Cartão Crédito', debit: 'Cartão Débito', cash: 'Dinheiro', transfer: 'TED'
    };

    tbody.innerHTML = items.map(t => {
      const isExpense = t.type === 'expense';
      const valClass = isExpense ? 'val-expense' : 'val-income';
      const prefix = isExpense ? '- ' : '+ ';
      const statusClass = t.status === 'paid' ? 'status-pill paid' : 'status-pill';
      const statusLabel = t.status === 'paid' ? 'Efetivado' : 'Pendente';

      // Badge visual para parcelas ou recorrência
      let metaBadges = '';
      if (t.description.includes('(') && t.description.includes('/')) {
        metaBadges += '<span style="font-size: 11px; padding: 2px 6px; background: var(--surface-card-mist); border-radius: 4px; margin-left: 6px;">Parcelado</span>';
      }
      if (t.notes && t.notes.includes('[Recorrente]')) {
        metaBadges += '<span style="font-size: 11px; padding: 2px 6px; background: var(--surface-card-mist); border-radius: 4px; margin-left: 6px;">🔁 Fixo</span>';
      }

      return `
        <tr>
          <td style="color: var(--color-slate-gray); font-size: 14px;">${api.formatDate(t.date)}</td>
          <td>
            <div style="font-weight: 500; display: flex; align-items: center; gap: 4px;">
              ${t.description} ${metaBadges}
            </div>
            ${t.notes ? `<div style="font-size: 12px; color: var(--color-ash-gray);">${t.notes}</div>` : ''}
          </td>
          <td><span class="type-tag">${t.category_name || 'Geral'}</span></td>
          <td><span style="font-size: 13px; color: var(--color-slate-gray);">${methodLabels[t.payment_method] || t.payment_method}</span></td>
          <td>
            <button onclick="transactions.toggleStatus(${t.id}, '${t.status}')" style="background:none; border:none; cursor:pointer;" title="Clique para alternar status">
              <span class="${statusClass}">${statusLabel}</span>
            </button>
          </td>
          <td style="text-align: right;" class="${valClass} privacy-blur">${prefix}${api.formatCurrency(t.amount)}</td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="text-link-arrow" style="margin-right: 12px;" onclick="transactions.openEdit(${t.id})">Editar</button>
            <button class="text-link-arrow" style="color: var(--color-sienna-brown);" onclick="transactions.delete(${t.id})">Excluir</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  async handleSave(e) {
    e.preventDefault();
    const id = document.getElementById('transId').value;
    const type = document.getElementById('transType').value;
    const amount = document.getElementById('transAmount').value;
    const description = document.getElementById('transDescription').value;
    const date = document.getElementById('transDate').value;
    const category_id = document.getElementById('transCategory').value;
    const payment_method = document.getElementById('transMethod').value;
    const status = document.getElementById('transStatus').value;
    const notes = document.getElementById('transNotes').value;

    const isInstallment = document.getElementById('transIsInstallment')?.checked;
    const installmentCount = isInstallment ? parseInt(document.getElementById('transInstallmentCount')?.value || '1', 10) : 1;
    const isRecurring = document.getElementById('transIsRecurring')?.checked;

    const payload = {
      type,
      amount,
      description,
      date,
      category_id: category_id || null,
      payment_method,
      status,
      notes,
      installments: installmentCount > 1 ? installmentCount : undefined,
      is_recurring: isRecurring
    };

    try {
      if (id) {
        await api.request(`/api/transactions/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        app.showToast('Transação atualizada com sucesso!');
      } else {
        const res = await api.request('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.installmentsCount) {
          app.showToast(`${res.installmentsCount} parcelas registradas com sucesso!`);
        } else {
          app.showToast('Transação registrada com sucesso!');
        }
      }

      app.closeModal('transactionModal');
      document.getElementById('transactionForm').reset();
      this.toggleInstallmentsBox(false);

      await this.load(app.currentMonth);
      if (app.currentTab === 'dashboard') {
        dashboard.load(app.currentMonth);
      }
    } catch (err) {
      app.showToast(err.message || 'Erro ao salvar transação.');
    }
  },

  openEdit(id) {
    const t = this.list.find(item => item.id === id);
    if (!t) return;

    document.getElementById('transId').value = t.id;
    document.getElementById('transactionModalTitle').textContent = 'Editar Transação';
    document.getElementById('transType').value = t.type;
    this.updateModalCategories(t.type);

    document.getElementById('transAmount').value = t.amount;
    document.getElementById('transDescription').value = t.description;
    document.getElementById('transDate').value = t.date;
    document.getElementById('transCategory').value = t.category_id || '';
    document.getElementById('transMethod').value = t.payment_method || 'pix';
    document.getElementById('transStatus').value = t.status || 'paid';
    document.getElementById('transNotes').value = t.notes || '';

    // Esconder opções de parcelamento na edição
    const instToggle = document.getElementById('transIsInstallment');
    if (instToggle) {
      instToggle.checked = false;
      this.toggleInstallmentsBox(false);
    }

    app.openModal('transactionModal');
  },

  async toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    try {
      await api.request(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      app.showToast(`Status alterado para ${newStatus === 'paid' ? 'Efetivado' : 'Pendente'}`);
      await this.load(app.currentMonth);
      if (app.currentTab === 'dashboard') {
        dashboard.load(app.currentMonth);
      }
    } catch (err) {
      app.showToast('Erro ao alterar status.');
    }
  },

  async delete(id) {
    if (!confirm('Deseja realmente excluir esta transação?')) return;
    try {
      await api.request(`/api/transactions/${id}`, { method: 'DELETE' });
      app.showToast('Transação excluída com sucesso.');
      await this.load(app.currentMonth);
      if (app.currentTab === 'dashboard') {
        dashboard.load(app.currentMonth);
      }
    } catch (err) {
      app.showToast('Erro ao excluir transação.');
    }
  },

  exportCsv() {
    const token = api.getToken();
    const url = `/api/transactions/export/csv?month=${app.currentMonth}`;
    window.location.href = url;
  },

  // ────────────── IMPORTAÇÃO DE EXTRATO (OFX / CSV) ──────────────
  openImportModal() {
    this.pendingImport = [];
    document.getElementById('importPreviewArea').style.display = 'none';
    document.getElementById('importSubmitBtn').style.display = 'none';
    document.getElementById('statementFileInput').value = '';
    app.openModal('importModal');
  },

  async handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropzoneBox').classList.remove('dragover');

    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    if (!files || files.length === 0) return;
    await this.processStatementFile(files[0]);
  },

  async handleFileInput(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await this.processStatementFile(files[0]);
  },

  async processStatementFile(file) {
    const fileName = file.name.toLowerCase();
    const isOfx = fileName.endsWith('.ofx');
    const isCsv = fileName.endsWith('.csv') || fileName.endsWith('.txt');

    if (!isOfx && !isCsv) {
      app.showToast('Formato não suportado. Por favor, envie um arquivo .OFX ou .CSV');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target.result;
        let parsed = [];

        if (isOfx) {
          parsed = BankParser.parseOFX(content, this.categories);
        } else {
          parsed = BankParser.parseCSV(content, this.categories);
        }

        if (!parsed || parsed.length === 0) {
          app.showToast('Nenhuma transação encontrada no arquivo.');
          return;
        }

        this.pendingImport = parsed;
        this.renderImportPreview(parsed);
      };
      reader.readAsText(file, 'ISO-8859-1'); // Suporta caracteres acentuados de bancos brasileiros
    } catch (err) {
      console.error('Erro ao ler arquivo:', err);
      app.showToast('Erro ao processar extrato: ' + err.message);
    }
  },

  renderImportPreview(items) {
    const container = document.getElementById('importPreviewArea');
    const tbody = document.getElementById('importPreviewBody');
    const submitBtn = document.getElementById('importSubmitBtn');
    const countSpan = document.getElementById('importCountSpan');

    if (!tbody || !container) return;

    countSpan.textContent = `${items.length} transações identificadas`;

    tbody.innerHTML = items.map((item, index) => {
      const isExpense = item.type === 'expense';
      const valColor = isExpense ? 'var(--color-sienna-brown)' : 'var(--color-ink-black)';
      const prefix = isExpense ? '- ' : '+ ';

      // Options de categorias
      const catOptions = this.categories
        .filter(c => c.type === item.type)
        .map(c => `<option value="${c.id}" ${c.id === item.category_id ? 'selected' : ''}>${c.name}</option>`)
        .join('');

      return `
        <tr>
          <td>
            <input type="checkbox" id="import_check_${index}" checked style="accent-color: var(--color-ink-black); cursor: pointer;">
          </td>
          <td style="font-size: 13px; color: var(--color-slate-gray);">${api.formatDate(item.date)}</td>
          <td style="font-size: 13px; font-weight: 500;">${item.description}</td>
          <td style="text-align: right; font-size: 13px; font-weight: 600; color: ${valColor};">${prefix}${api.formatCurrency(item.amount)}</td>
          <td>
            <select id="import_cat_${index}" class="steep-select" style="padding: 4px 8px; font-size: 12px; height: 30px;">
              <option value="">Sem categoria</option>
              ${catOptions}
            </select>
          </td>
        </tr>
      `;
    }).join('');

    container.style.display = 'block';
    submitBtn.style.display = 'inline-flex';
  },

  async confirmImport() {
    const selected = [];
    for (let i = 0; i < this.pendingImport.length; i++) {
      const check = document.getElementById(`import_check_${i}`);
      if (check && check.checked) {
        const item = { ...this.pendingImport[i] };
        const catSelect = document.getElementById(`import_cat_${i}`);
        if (catSelect && catSelect.value) {
          item.category_id = catSelect.value;
        }
        selected.push(item);
      }
    }

    if (selected.length === 0) {
      app.showToast('Selecione pelo menos uma transação para importar.');
      return;
    }

    try {
      const submitBtn = document.getElementById('importSubmitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Importando...';

      const res = await api.request('/api/transactions/batch', {
        method: 'POST',
        body: JSON.stringify({ transactions: selected })
      });

      app.showToast(res.message || `${selected.length} transações importadas com sucesso!`);
      app.closeModal('importModal');

      await this.load(app.currentMonth);
      if (app.currentTab === 'dashboard') {
        dashboard.load(app.currentMonth);
      }
    } catch (err) {
      console.error('Erro na importação em lote:', err);
      app.showToast(err.message || 'Erro ao importar transações.');
    } finally {
      const submitBtn = document.getElementById('importSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmar Importação';
      }
    }
  }
};
