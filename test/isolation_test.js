// Teste Automatizado de Isolamento e Segurança entre Usuários
const http = require('http');

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n--- INICIANDO SUÍTE DE TESTES DE ISOLAMENTO RIGOROSO ---\n');
  const port = 3000;
  const timestamp = Date.now();

  const userAData = {
    name: 'Alice Investidora',
    email: `alice_${timestamp}@teste.com`,
    password: 'senha_segura_alice_123'
  };

  const userBData = {
    name: 'Bob Consultor',
    email: `bob_${timestamp}@teste.com`,
    password: 'senha_segura_bob_456'
  };

  // 1. Cadastrar Usuário A
  console.log('1. Registrando Usuário A (Alice)...');
  const regA = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, userAData);

  if (regA.status !== 201) throw new Error(`Falha no registro da Alice: ${JSON.stringify(regA)}`);
  const tokenA = regA.data.token;
  console.log('   ✓ Alice registrada com sucesso.');

  // 2. Cadastrar Usuário B
  console.log('2. Registrando Usuário B (Bob)...');
  const regB = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, userBData);

  if (regB.status !== 201) throw new Error(`Falha no registro do Bob: ${JSON.stringify(regB)}`);
  const tokenB = regB.data.token;
  console.log('   ✓ Bob registrado com sucesso.');

  // 3. Alice cria transações privadas
  console.log('3. Alice adiciona transação de Salário (R$ 8.500) e Despesa Aluguel (R$ 2.400)...');
  const transA1 = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/transactions',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` }
  }, {
    description: 'Salário Mensal Alice',
    amount: 8500.00,
    type: 'income',
    date: '2026-09-01',
    payment_method: 'pix',
    status: 'paid'
  });

  const transA2 = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/transactions',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` }
  }, {
    description: 'Aluguel Apartamento Alice',
    amount: 2400.00,
    type: 'expense',
    date: '2026-09-05',
    payment_method: 'transfer',
    status: 'paid'
  });

  const aliceTransId = transA1.data.transaction.id;
  console.log(`   ✓ Transações da Alice criadas com IDs [${aliceTransId}, ${transA2.data.transaction.id}].`);

  // 4. Bob lista suas transações: deve ser estritamente vazio
  console.log('4. Bob solicita extrato de transações...');
  const bobTrans = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/transactions',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });

  if (bobTrans.data.transactions.length !== 0) {
    throw new Error(`VIOLAÇÃO CRÍTICA: Bob conseguiu ver ${bobTrans.data.transactions.length} transações!`);
  }
  console.log('   ✓ ISOLAMENTO CONFIRMADO: Bob possui exatamente 0 transações visíveis.');

  // 5. Bob solicita resumo do dashboard: saldo deve ser zero
  console.log('5. Bob consulta seu dashboard...');
  const bobDash = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/dashboard/summary?month=2026-09',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });

  if (bobDash.data.allTimeBalance !== 0 || bobDash.data.paidIncome !== 0) {
    throw new Error(`VIOLAÇÃO: Saldo do Bob não está isolado! Dados: ${JSON.stringify(bobDash.data)}`);
  }
  console.log('   ✓ ISOLAMENTO CONFIRMADO: Saldo do Bob é R$ 0,00 e receitas são R$ 0,00.');

  // 6. Bob tenta acessar diretamente o ID da transação da Alice
  console.log(`6. Bob tenta acessar a transação ID ${aliceTransId} pertencente à Alice...`);
  const hackAttempt = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/api/transactions/${aliceTransId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });

  if (hackAttempt.status !== 404) {
    throw new Error(`VIOLAÇÃO DE SEGURANÇA: Bob obteve status ${hackAttempt.status} tentando ver transação da Alice!`);
  }
  console.log('   ✓ BLOQUEIO CONFIRMADO: Resposta HTTP 404 - Acesso negado e transação invisível para Bob.');

  // 7. Bob tenta deletar a transação da Alice
  console.log(`7. Bob tenta deletar a transação ID ${aliceTransId} da Alice...`);
  const deleteAttempt = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/api/transactions/${aliceTransId}`,
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });

  if (deleteAttempt.status !== 404) {
    throw new Error(`VIOLAÇÃO: Bob conseguiu interagir com a transação da Alice! Status ${deleteAttempt.status}`);
  }
  console.log('   ✓ PROTEÇÃO CONFIRMADA: Bob não pôde deletar o registro da Alice.');

  // 8. Alice verifica seu saldo: deve ter R$ 8.500 - R$ 2.400 = R$ 6.100
  console.log('8. Alice consulta seu saldo...');
  const aliceDash = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/dashboard/summary?month=2026-09',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });

  if (aliceDash.data.allTimeBalance !== 6100) {
    throw new Error(`Erro de cálculo da Alice: esperado 6100, obteve ${aliceDash.data.allTimeBalance}`);
  }
  console.log(`   ✓ Alice conferiu seu saldo com sucesso: R$ ${aliceDash.data.allTimeBalance},00 intactos.`);

  console.log('\n=============================================================');
  console.log(' TODOS OS TESTES DE ISOLAMENTO E SEGURANÇA PASSARAM COM 100%! ');
  console.log('=============================================================\n');
}

module.exports = { runTests };

if (require.main === module) {
  runTests().catch(err => {
    console.error('Falha nos testes:', err);
    process.exit(1);
  });
}
