// Dashboard Module (Steep Aesthetic)
const dashboard = {
  flowChartInstance: null,
  pieChartInstance: null,

  async load(month) {
    try {
      const targetMonth = month || app.currentMonth;
      
      // 1. Resumo financeiro
      const summary = await api.request(`/api/dashboard/summary?month=${targetMonth}`);
      this.renderSummary(summary);

      // 2. Gráfico de fluxo dos últimos 6 meses
      const flowData = await api.request(`/api/dashboard/monthly-flow`);
      this.renderFlowChart(flowData.flow);

      // 3. Distribuição por categorias
      const categoriesData = await api.request(`/api/dashboard/categories-breakdown?month=${targetMonth}`);
      this.renderCategories(categoriesData);

      // 4. Transações mais recentes
      const recentData = await api.request(`/api/dashboard/recent?limit=6`);
      this.renderRecentTransactions(recentData.transactions);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    }
  },

  renderSummary(data) {
    // Saldos e valores
    document.getElementById('allTimeBalanceVal').textContent = api.formatCurrency(data.allTimeBalance);
    document.getElementById('monthBalanceSubtext').textContent = `Saldo do mês: ${api.formatCurrency(data.monthBalance)}`;
    
    document.getElementById('paidIncomeVal').textContent = api.formatCurrency(data.paidIncome);
    document.getElementById('pendingIncomeSubtext').textContent = data.pendingIncome > 0 
      ? `+ ${api.formatCurrency(data.pendingIncome)} a receber` 
      : 'Sem pendências a receber';

    document.getElementById('paidExpenseVal').textContent = api.formatCurrency(data.paidExpense);
    document.getElementById('pendingExpenseSubtext').textContent = data.pendingExpense > 0 
      ? `+ ${api.formatCurrency(data.pendingExpense)} a pagar` 
      : 'Sem contas pendentes';

    // Editorial Peach Card (Destaque único do sistema)
    const rate = data.savingsRate;
    document.getElementById('savingsRateVal').textContent = `${rate}%`;

    const insightTitle = document.getElementById('peachInsightTitle');
    const insightBody = document.getElementById('peachInsightBody');

    if (data.paidIncome === 0 && data.paidExpense === 0) {
      insightTitle.textContent = 'Mês sem movimentações';
      insightBody.textContent = 'Cadastre suas receitas e despesas deste mês para gerar seu diagnóstico financeiro editorial.';
    } else if (data.monthBalance < 0) {
      insightTitle.textContent = 'Déficit no fluxo de caixa';
      insightBody.textContent = `Suas despesas superaram as receitas em ${api.formatCurrency(Math.abs(data.monthBalance))}. Recomendamos revisar orçamentos e cortar gastos não essenciais.`;
    } else if (rate >= 30) {
      insightTitle.textContent = 'Excepcional retenção patrimonial';
      insightBody.textContent = `Você está poupando ${rate}% das suas receitas correntes. Esse ritmo acelera a formação de reservas de emergência e investimentos futuros.`;
    } else {
      insightTitle.textContent = 'Balanço financeiro positivo';
      insightBody.textContent = `Você manteve um saldo positivo de ${api.formatCurrency(data.monthBalance)} neste ciclo (${rate}% de poupança).`;
    }
  },

  renderFlowChart(flowList) {
    const ctx = document.getElementById('monthlyFlowChart').getContext('2d');
    const labels = flowList.map(item => {
      const parts = item.month.split('-');
      const monthsBr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${monthsBr[parseInt(parts[1], 10) - 1]}/${parts[0].slice(2)}`;
    });

    const incomeData = flowList.map(item => item.income);
    const expenseData = flowList.map(item => item.expense);

    if (this.flowChartInstance) {
      this.flowChartInstance.destroy();
    }

    // Chart estilo Steep: minimalista, linha pura, tons Ink Black (#17191c) e Sienna Brown (#5d2a1a)
    this.flowChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Receitas',
            data: incomeData,
            borderColor: '#17191c',
            backgroundColor: 'rgba(23, 25, 28, 0.03)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#17191c',
            tension: 0.35,
            fill: true
          },
          {
            label: 'Despesas',
            data: expenseData,
            borderColor: '#5d2a1a',
            backgroundColor: 'rgba(93, 42, 26, 0.04)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#5d2a1a',
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              font: { family: 'Inter', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#17191c',
            titleFont: { family: 'Inter', size: 12 },
            bodyFont: { family: 'Inter', size: 13 },
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${api.formatCurrency(context.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 12 }, color: '#777b86' }
          },
          y: {
            grid: { color: '#f2f2f3' },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#979799',
              callback: (value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
            }
          }
        }
      }
    });
  },

  renderCategories(data) {
    const ctx = document.getElementById('categoriesPieChart').getContext('2d');
    const summaryHeader = document.getElementById('totalExpensesCategorySummary');
    const listContainer = document.getElementById('categoryProgressSummary');

    summaryHeader.textContent = `Total: ${api.formatCurrency(data.total)}`;

    if (this.pieChartInstance) {
      this.pieChartInstance.destroy();
    }

    if (!data.categories || data.categories.length === 0) {
      listContainer.innerHTML = '<p style="color: var(--color-slate-gray); font-size: 14px; text-align: center; margin-top: 20px;">Nenhuma despesa registrada neste mês.</p>';
      this.pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Sem gastos'],
          datasets: [{ data: [1], backgroundColor: ['#f2f2f3'], borderWidth: 0 }]
        },
        options: { cutout: '78%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
      return;
    }

    // Paleta editorial: variações de Sienna Brown, Blush Peach, Ink Black, Slate Gray
    const editorialPalette = [
      '#5d2a1a', '#17191c', '#979799', '#fbe1d1', '#777b86', '#3b4048', '#8c4830', '#c2927d'
    ];

    const labels = data.categories.map(c => c.name);
    const values = data.categories.map(c => c.total);
    const colors = data.categories.map((c, i) => c.color || editorialPalette[i % editorialPalette.length]);

    this.pieChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        cutout: '72%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#17191c',
            callbacks: {
              label: (context) => ` ${context.label}: ${api.formatCurrency(context.raw)} (${data.categories[context.dataIndex].percentage}%)`
            }
          }
        }
      }
    });

    // Top 4 categorias com barra de progresso horizontal
    const topCategories = data.categories.slice(0, 4);
    listContainer.innerHTML = topCategories.map(cat => `
      <div class="cat-item">
        <div class="cat-item-top">
          <span class="cat-item-name">${cat.name}</span>
          <span class="cat-item-val">${cat.percentage}% (${api.formatCurrency(cat.total)})</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${cat.percentage}%; background-color: ${cat.color || '#5d2a1a'};"></div>
        </div>
      </div>
    `).join('');
  },

  renderRecentTransactions(list) {
    const tbody = document.getElementById('recentTransactionsBody');
    if (!list || list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--color-slate-gray); padding: 32px;">
            Nenhuma transação recente neste ciclo. Clique em <strong>+ Nova Transação</strong> para começar.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(t => {
      const isExpense = t.type === 'expense';
      const valClass = isExpense ? 'val-expense' : 'val-income';
      const prefix = isExpense ? '- ' : '+ ';
      const statusClass = t.status === 'paid' ? 'status-pill paid' : 'status-pill';
      const statusLabel = t.status === 'paid' ? 'Efetivado' : 'Pendente';
      const methodLabels = {
        pix: 'PIX', credit: 'Cartão Crédito', debit: 'Cartão Débito', cash: 'Dinheiro', transfer: 'TED'
      };

      return `
        <tr>
          <td style="color: var(--color-slate-gray); font-size: 14px;">${api.formatDate(t.date)}</td>
          <td>
            <div style="font-weight: 500;">${t.description}</div>
            ${t.notes ? `<div style="font-size: 12px; color: var(--color-ash-gray);">${t.notes}</div>` : ''}
          </td>
          <td><span class="type-tag">${t.category_name || 'Geral'}</span></td>
          <td><span style="font-size: 13px; color: var(--color-slate-gray);">${methodLabels[t.payment_method] || t.payment_method}</span></td>
          <td><span class="${statusClass}">${statusLabel}</span></td>
          <td style="text-align: right;" class="${valClass} privacy-blur">${prefix}${api.formatCurrency(t.amount)}</td>
        </tr>
      `;
    }).join('');
  }
};
