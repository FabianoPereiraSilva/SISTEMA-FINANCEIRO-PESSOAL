const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const dataService = require('../services/dataService');

router.use(requireAuth);

// Listar categorias do usuário logado
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const categories = await dataService.getCategories(req, type);
    return res.json({ categories });
  } catch (err) {
    console.error('Erro ao buscar categorias:', err);
    return res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
});

// Criar categoria personalizada
router.post('/', async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
    }

    const newCategory = await dataService.createCategory(req, { name, type, color, icon });
    return res.status(201).json({ category: newCategory });
  } catch (err) {
    console.error('Erro ao criar categoria:', err);
    return res.status(500).json({ error: 'Erro ao criar categoria.' });
  }
});

module.exports = router;
