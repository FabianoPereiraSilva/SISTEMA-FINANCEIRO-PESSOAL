/**
 * FinFlow — Leitor de Extratos Bancários (OFX e CSV)
 * Suporta os principais bancos brasileiros: Nubank, Itaú, Inter, Bradesco, Santander, BB, C6, etc.
 */

const BankParser = {
  // Regras de correspondência automática de categoria por palavras-chave
  CATEGORY_KEYWORDS: [
    {
      keywords: ['ifood', 'mercado', 'supermercado', 'carrefour', 'pao de acucar', 'extra', 'assai', 'atacadao', 'padaria', 'restaurante', 'mcdonald', 'burger', 'subway', 'habib', 'acougue', 'hortifruti', 'bar ', 'cafe '],
      categoryName: 'Alimentação & Mercado',
      type: 'expense'
    },
    {
      keywords: ['uber', '99app', '99 ', 'combustivel', 'posto', 'gasolina', 'etanol', 'ipva', 'estacionamento', 'pedagio', 'sem parar', 'veloe'],
      categoryName: 'Transporte & Combustível',
      type: 'expense'
    },
    {
      keywords: ['aluguel', 'condominio', 'enel', 'sabesp', 'cpfl', 'luz', 'energia', 'gas ', 'internet', 'claro', 'vivo', 'tim', 'copel', 'cemig'],
      categoryName: 'Moradia & Contas',
      type: 'expense'
    },
    {
      keywords: ['farmacia', 'drogaria', 'droga raia', 'drogasil', 'pague menos', 'panvel', 'medico', 'consulta', 'laboratorio', 'hospital', 'dentista'],
      categoryName: 'Saúde & Bem-Estar',
      type: 'expense'
    },
    {
      keywords: ['netflix', 'spotify', 'amazon prime', 'hbo', 'disney', 'youtube', 'cinema', 'ingresso', 'steam', 'playstation', 'game'],
      categoryName: 'Lazer & Entretenimento',
      type: 'expense'
    },
    {
      keywords: ['curso', 'udemy', 'livraria', 'faculdade', 'escola', 'livro', 'hotmart', 'alura'],
      categoryName: 'Educação & Livros',
      type: 'expense'
    },
    {
      keywords: ['mercado livre', 'shopee', 'shein', 'amazon com', 'magalu', 'aliexpress', 'zara', 'renner', 'riachuelo', 'roupa'],
      categoryName: 'Compras Pessoais',
      type: 'expense'
    },
    {
      keywords: ['salario', 'ted recebida', 'pix recebido de', 'proventos', 'remuneracao', 'ted remun'],
      categoryName: 'Salário & Remuneração',
      type: 'income'
    },
    {
      keywords: ['rendimento', 'dividendo', 'cdi', 'tesouro direto', 'fii', 'investimento', 'nu invest'],
      categoryName: 'Rendimentos & Investimentos',
      type: 'income'
    }
  ],

  // Descobre a categoria mais provável para a descrição
  suggestCategory(description, type, categoriesList) {
    const descLower = (description || '').toLowerCase();
    
    // 1. Tenta pelas palavras-chave inteligentes
    for (const rule of this.CATEGORY_KEYWORDS) {
      if (rule.keywords.some(k => descLower.includes(k))) {
        const found = categoriesList.find(c => c.name.toLowerCase() === rule.categoryName.toLowerCase());
        if (found) return found.id;
      }
    }

    // 2. Fallback: primeira categoria do mesmo tipo
    const fallback = categoriesList.find(c => c.type === type);
    return fallback ? fallback.id : null;
  },

  // Parse de arquivo OFX (padrão Open Financial Exchange)
  parseOFX(content, categoriesList = []) {
    const transactions = [];
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = stmtTrnRegex.exec(content)) !== null) {
      const block = match[1];

      // Extrai campos
      const trnTypeMatch = block.match(/<TRNTYPE>(.*?)[\r\n<]/i);
      const dtPostedMatch = block.match(/<DTPOSTED>([0-9]{8})/i);
      const trnAmtMatch = block.match(/<TRNAMT>([\-\+]?[0-9\.,]+)/i);
      const memoMatch = block.match(/<MEMO>(.*?)[\r\n<]/i);
      const nameMatch = block.match(/<NAME>(.*?)[\r\n<]/i);

      let rawDesc = '';
      if (memoMatch && memoMatch[1]) rawDesc = memoMatch[1].trim();
      else if (nameMatch && nameMatch[1]) rawDesc = nameMatch[1].trim();

      // Limpar quebras ou lixo
      rawDesc = rawDesc.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

      // Data (YYYYMMDD -> YYYY-MM-DD)
      let dateStr = new Date().toISOString().slice(0, 10);
      if (dtPostedMatch && dtPostedMatch[1]) {
        const y = dtPostedMatch[1].slice(0, 4);
        const m = dtPostedMatch[1].slice(4, 6);
        const d = dtPostedMatch[1].slice(6, 8);
        dateStr = `${y}-${m}-${d}`;
      }

      // Valor
      let amount = 0;
      let type = 'expense';
      if (trnAmtMatch && trnAmtMatch[1]) {
        const cleanAmt = trnAmtMatch[1].replace(',', '.');
        const num = parseFloat(cleanAmt);
        if (!isNaN(num)) {
          if (num >= 0) {
            type = 'income';
            amount = Math.abs(num);
          } else {
            type = 'expense';
            amount = Math.abs(num);
          }
        }
      }

      if (amount > 0 && rawDesc) {
        const suggestedCatId = this.suggestCategory(rawDesc, type, categoriesList);
        transactions.push({
          date: dateStr,
          description: rawDesc,
          amount: parseFloat(amount.toFixed(2)),
          type,
          category_id: suggestedCatId,
          payment_method: 'transfer',
          status: 'paid',
          notes: 'Importado via Extrato OFX'
        });
      }
    }

    return transactions;
  },

  // Parse de arquivo CSV (Nubank, Itaú, C6, etc.)
  parseCSV(content, categoriesList = []) {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    // Detectar delimitador (, ou ;)
    const firstLine = lines[0];
    const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

    const header = firstLine.split(delimiter).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
    
    // Descobrir índices das colunas
    const dateIdx = header.findIndex(h => h.includes('data') || h.includes('date'));
    const descIdx = header.findIndex(h => h.includes('descri') || h.includes('memo') || h.includes('título') || h.includes('titulo') || h.includes('identificador') || h.includes('estabelecimento'));
    const amountIdx = header.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('quantia'));

    if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
      throw new Error('Não foi possível identificar as colunas (Data, Descrição e Valor) no arquivo CSV.');
    }

    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
      if (row.length <= Math.max(dateIdx, descIdx, amountIdx)) continue;

      const rawDate = row[dateIdx];
      const rawDesc = row[descIdx];
      const rawAmount = row[amountIdx];

      if (!rawDate || !rawDesc || !rawAmount) continue;

      // Normalizar data (DD/MM/YYYY ou YYYY-MM-DD)
      let dateStr = rawDate;
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            // DD/MM/YYYY
            dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else if (parts[0].length === 4) {
            // YYYY/MM/DD
            dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
        }
      }

      // Normalizar valor
      let cleanAmt = rawAmount.replace('R$', '').replace(/\s/g, '');
      if (cleanAmt.includes(',') && cleanAmt.includes('.')) {
        cleanAmt = cleanAmt.replace(/\./g, '').replace(',', '.'); // Formato BR 1.250,50
      } else if (cleanAmt.includes(',')) {
        cleanAmt = cleanAmt.replace(',', '.');
      }

      const num = parseFloat(cleanAmt);
      if (isNaN(num) || num === 0) continue;

      let type = 'expense';
      let amount = Math.abs(num);
      if (num > 0 && !rawAmount.includes('-')) {
        // Se a coluna tiver indicador de entrada/saída
        const typeIdx = header.findIndex(h => h.includes('tipo') || h.includes('type'));
        if (typeIdx !== -1 && row[typeIdx]) {
          const tText = row[typeIdx].toLowerCase();
          if (tText.includes('receita') || tText.includes('credito') || tText.includes('crédito') || tText.includes('entrada')) {
            type = 'income';
          }
        } else {
          // Checa palavras na descrição
          const descLow = rawDesc.toLowerCase();
          if (descLow.includes('recebido') || descLow.includes('salario') || descLow.includes('rendimento')) {
            type = 'income';
          }
        }
      }

      const suggestedCatId = this.suggestCategory(rawDesc, type, categoriesList);

      transactions.push({
        date: dateStr,
        description: rawDesc,
        amount: parseFloat(amount.toFixed(2)),
        type,
        category_id: suggestedCatId,
        payment_method: 'pix',
        status: 'paid',
        notes: 'Importado via Extrato CSV'
      });
    }

    return transactions;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BankParser;
}
