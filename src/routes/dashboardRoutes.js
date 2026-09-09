const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const dataService = require('../services/dataService');

router.use(requireAuth);

// Resumo financeiro do mês
router.get('/summary', async (req, res) => {
  try {
    const currentMonth = req.query.month || new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    // Calcular mês anterior
    const [year, monthNum] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, monthNum - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // Buscar todas as transações para calcular totais
    const allTransactions = await dataService.getTransactions(req, {});

    // Filtrar mês atual
    const currentMonthTx = allTransactions.filter(t => t.date && t.date.startsWith(currentMonth));
    const prevMonthTx = allTransactions.filter(t => t.date && t.date.startsWith(prevMonth));

    let paidIncome = 0;
    let pendingIncome = 0;
    let paidExpense = 0;
    let pendingExpense = 0;

    for (const t of currentMonthTx) {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        if (t.status === 'paid') paidIncome += amt;
        else pendingIncome += amt;
      } else if (t.type === 'expense') {
        if (t.status === 'paid') paidExpense += amt;
        else pendingExpense += amt;
      }
    }

    let prevIncome = 0;
    let prevExpense = 0;
    for (const t of prevMonthTx) {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'income' && t.status === 'paid') prevIncome += amt;
      else if (t.type === 'expense' && t.status === 'paid') prevExpense += amt;
    }

    // Saldo acumulado histórico de todas as transações efetivadas
    let allTimeBalance = 0;
    for (const t of allTransactions) {
      const amt = parseFloat(t.amount) || 0;
      if (t.status === 'paid') {
        if (t.type === 'income') allTimeBalance += amt;
        else if (t.type === 'expense') allTimeBalance -= amt;
      }
    }

    const currentBalance = paidIncome - paidExpense;
    const savingsRate = paidIncome > 0 ? Math.max(0, Math.round(((paidIncome - paidExpense) / paidIncome) * 100)) : 0;

    return res.json({
      month: currentMonth,
      paidIncome,
      pendingIncome,
      totalIncome: paidIncome + pendingIncome,
      paidExpense,
      pendingExpense,
      totalExpense: paidExpense + pendingExpense,
      monthBalance: currentBalance,
      allTimeBalance,
      savingsRate,
      prevMonth: {
        income: prevIncome,
        expense: prevExpense,
        balance: prevIncome - prevExpense
      }
    });
  } catch (err) {
    console.error('Erro no resumo do dashboard:', err);
    return res.status(500).json({ error: 'Erro ao consolidar resumo financeiro.' });
  }
});

// Despesas por categoria no mês (para gráfico Donut / Bar)
router.get('/categories-breakdown', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const transactions = await dataService.getTransactions(req, { month, type: 'expense' });

    const catMap = {};
    let grandTotal = 0;

    for (const t of transactions) {
      const catName = t.category_name || 'Geral';
      const catColor = t.category_color || '#17191c';
      const amt = parseFloat(t.amount) || 0;

      if (!catMap[catName]) {
        catMap[catName] = { name: catName, color: catColor, total: 0, count: 0 };
      }
      catMap[catName].total += amt;
      catMap[catName].count += 1;
      grandTotal += amt;
    }

    const categories = Object.values(catMap).map(c => ({
      ...c,
      percentage: grandTotal > 0 ? ((c.total / grandTotal) * 100).toFixed(1) : 0
    })).sort((a, b) => b.total - a.total);

    return res.json({ month, total: grandTotal, categories });
  } catch (err) {
    console.error('Erro no breakdown de categorias:', err);
    return res.status(500).json({ error: 'Erro ao calcular categorias.' });
  }
});

// Fluxo mensal dos últimos 6 meses
router.get('/monthly-flow', async (req, res) => {
  try {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(mStr);
    }

    const allTransactions = await dataService.getTransactions(req, {});
    const flow = months.map(m => {
      let income = 0;
      let expense = 0;
      for (const t of allTransactions) {
        if (t.date && t.date.startsWith(m) && t.status === 'paid') {
          const amt = parseFloat(t.amount) || 0;
          if (t.type === 'income') income += amt;
          else if (t.type === 'expense') expense += amt;
        }
      }
      return {
        month: m,
        income,
        expense,
        balance: income - expense
      };
    });

    return res.json({ flow });
  } catch (err) {
    console.error('Erro no fluxo mensal:', err);
    return res.status(500).json({ error: 'Erro ao calcular fluxo mensal.' });
  }
});

// Transações mais recentes
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 7;
    const all = await dataService.getTransactions(req, {});
    const transactions = all.slice(0, limit);
    return res.json({ transactions });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar transações recentes.' });
  }
});

module.exports = router;
