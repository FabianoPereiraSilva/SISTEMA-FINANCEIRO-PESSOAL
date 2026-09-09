const express = require('express');
const router = express.Router();
const { runAsync, allAsync, getAsync } = require('../db');
const { requireAuth } = require('../auth');
const dataService = require('../services/dataService');

router.use(requireAuth);

// Listar orçamentos com progresso de gastos no mês especificado
router.get('/', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    // Obter orçamentos e transações para calcular gastos com precisão
    const [budgets, transactions] = await Promise.all([
      dataService.getBudgets(req, month),
      dataService.getTransactions(req, { month, type: 'expense' })
    ]);

    const enrichedBudgets = budgets.map(b => {
      // Somar despesas desta categoria no mês
      const spent = transactions
        .filter(t => String(t.category_id) === String(b.category_id))
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const limit = parseFloat(b.monthly_limit) || 0;
      const percentage = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
      const remaining = limit - spent;
      return {
        ...b,
        spent,
        limit,
        remaining,
        percentage,
        isOverLimit: spent > limit
      };
    });

    return res.json({ month, budgets: enrichedBudgets });
  } catch (err) {
    console.error('Erro ao buscar orçamentos:', err);
    return res.status(500).json({ error: 'Erro ao carregar orçamentos.' });
  }
});

// Criar ou atualizar meta de orçamento
router.post('/', async (req, res) => {
  try {
    const { category_id, monthly_limit, month } = req.body;

    if (!category_id || !monthly_limit || !month) {
      return res.status(400).json({ error: 'Informe a categoria, o limite mensal e o mês (YYYY-MM).' });
    }

    const limitNum = parseFloat(monthly_limit);
    if (isNaN(limitNum) || limitNum <= 0) {
      return res.status(400).json({ error: 'O limite deve ser um valor numérico positivo.' });
    }

    await dataService.upsertBudget(req, {
      category_id,
      monthly_limit: limitNum,
      month
    });

    return res.status(200).json({ message: 'Orçamento definido com sucesso.' });
  } catch (err) {
    console.error('Erro ao salvar orçamento:', err);
    return res.status(500).json({ error: 'Erro ao salvar orçamento.' });
  }
});

// Remover meta de orçamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runAsync('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, req.userId]);
    return res.json({ message: 'Orçamento removido com sucesso.' });
  } catch (err) {
    console.error('Erro ao deletar orçamento:', err);
    return res.status(500).json({ error: 'Erro ao excluir orçamento.' });
  }
});

module.exports = router;
