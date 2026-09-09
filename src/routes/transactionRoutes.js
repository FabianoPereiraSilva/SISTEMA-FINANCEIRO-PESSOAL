const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const dataService = require('../services/dataService');

router.use(requireAuth);

// Listar transações com filtros
router.get('/', async (req, res) => {
  try {
    const transactions = await dataService.getTransactions(req, req.query);
    return res.json({ transactions });
  } catch (err) {
    console.error('Erro ao buscar transações:', err);
    return res.status(500).json({ error: 'Erro ao listar transações.' });
  }
});

// Criar nova transação (suporta transação simples ou compras parceladas)
router.post('/', async (req, res) => {
  try {
    const {
      category_id,
      description,
      amount,
      type,
      date,
      payment_method,
      status,
      notes,
      installments, // opcional: número de parcelas (ex: 3)
      is_recurring  // opcional: boolean
    } = req.body;

    if (!description || !amount || !type || !date) {
      return res.status(400).json({ error: 'Preencha descrição, valor, tipo e data da transação.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'O valor da transação deve ser um número positivo.' });
    }

    const totalInstallments = parseInt(installments, 10);

    // Se for compra parcelada (> 1 parcela)
    if (totalInstallments && totalInstallments > 1) {
      const installmentAmount = parseFloat((numAmount / totalInstallments).toFixed(2));
      const createdList = [];
      const baseDate = new Date(date + 'T12:00:00');

      for (let i = 1; i <= totalInstallments; i++) {
        const parcelDate = new Date(baseDate);
        parcelDate.setMonth(baseDate.getMonth() + (i - 1));
        const dateStr = parcelDate.toISOString().slice(0, 10);

        const descWithParcel = `${description.trim()} (${i}/${totalInstallments})`;
        const parcelNote = notes ? `${notes} [Parcela ${i}/${totalInstallments}]` : `[Parcela ${i}/${totalInstallments}]`;

        const created = await dataService.createTransaction(req, {
          category_id,
          description: descWithParcel,
          amount: installmentAmount,
          type,
          date: dateStr,
          payment_method,
          status: i === 1 ? (status || 'paid') : 'pending', // primeira pode ser paga, futuras pendentes
          notes: parcelNote
        });
        createdList.push(created);
      }

      return res.status(201).json({
        message: `${totalInstallments} parcelas criadas com sucesso.`,
        transaction: createdList[0],
        installmentsCount: totalInstallments
      });
    }

    // Transação única normal (ou recorrente)
    let finalNotes = notes ? notes.trim() : '';
    if (is_recurring) {
      finalNotes = finalNotes ? `${finalNotes} [Recorrente]` : '[Recorrente]';
    }

    const created = await dataService.createTransaction(req, {
      category_id,
      description: description.trim(),
      amount: numAmount,
      type,
      date,
      payment_method,
      status,
      notes: finalNotes || null
    });

    return res.status(201).json({ transaction: created });
  } catch (err) {
    console.error('Erro ao criar transação:', err);
    return res.status(500).json({ error: 'Erro interno ao salvar transação.' });
  }
});

// Criar múltiplas transações em lote (para importação de extrato OFX e CSV)
router.post('/batch', async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Lista de transações inválida ou vazia.' });
    }

    const created = await dataService.createTransactionsBatch(req, transactions);
    return res.status(201).json({
      message: `${created.length} transações importadas com sucesso.`,
      count: created.length
    });
  } catch (err) {
    console.error('Erro ao importar transações em lote:', err);
    return res.status(500).json({ error: 'Erro ao importar lote de transações.' });
  }
});

// Atualizar transação
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await dataService.updateTransaction(req, id, req.body);
    return res.json({ transaction: updated });
  } catch (err) {
    console.error('Erro ao atualizar transação:', err);
    return res.status(500).json({ error: 'Erro ao atualizar transação.' });
  }
});

// Excluir transação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dataService.deleteTransaction(req, id);
    return res.json({ message: 'Transação excluída com sucesso.' });
  } catch (err) {
    console.error('Erro ao deletar transação:', err);
    return res.status(500).json({ error: 'Erro ao excluir transação.' });
  }
});

// Exportar CSV
router.get('/export/csv', async (req, res) => {
  try {
    const { month } = req.query;
    const rows = await dataService.getTransactions(req, { month });

    const headers = ['Data', 'Descricao', 'Tipo', 'Valor (R$)', 'Categoria', 'Metodo', 'Status', 'Observacoes'];
    const csvLines = [headers.join(';')];

    for (const r of rows) {
      const typeLabel = r.type === 'income' ? 'Receita' : 'Despesa';
      const statusLabel = r.status === 'paid' ? 'Efetivado' : 'Pendente';
      const line = [
        `"${r.date}"`,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        `"${typeLabel}"`,
        `"${parseFloat(r.amount).toFixed(2).replace('.', ',')}"`,
        `"${(r.category_name || 'Geral').replace(/"/g, '""')}"`,
        `"${r.payment_method || ''}"`,
        `"${statusLabel}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
      csvLines.push(line.join(';'));
    }

    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=extrato-finance-plan-${month || 'geral'}.csv`);
    return res.send(csvContent);
  } catch (err) {
    console.error('Erro na exportação CSV:', err);
    return res.status(500).json({ error: 'Erro ao exportar CSV.' });
  }
});

module.exports = router;
