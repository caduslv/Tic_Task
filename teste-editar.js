import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution'; // Controla os usuários para o log do locking

// Contador local para não inundar o terminal de logs
let logsExibidos = 0; 

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  stages: [
    { duration: '10s', target: 10 }, // Sobe para 10 usuários em 10 segundos
    { duration: '40s', target: 55 }, // Sobe até 55 usuários e segura o estresse
    { duration: '10s', target: 0 },  // Desce a rampa limpando as conexões
  ],
};

export default function () {
  // ATENÇÃO: Altere o final (/3) para um ID válido que exista no seu banco
  const url = 'http://localhost:3000/tarefas/3'; 
  
  const payload = JSON.stringify({
    titulo: 'Tarefa Atualizada k6',
    status: 'concluida',
    versao: 1 
  });

  const params = { 
    headers: { 
      'Content-Type': 'application/json',
    } 
  };
  
  const res = http.patch(url, payload, params);

  // Exibe no console quando a concorrência for barrada com sucesso (Status 409)
  if (exec.vu.idInTest === 1 && res.status === 409 && logsExibidos < 5) {
    console.log(`[LOCKING OTIMISTA] Concorrência barrada! | Status retornado: 409`);
    logsExibidos++; 
  }

  // exibe no terminal o tipo de rota.
  check(res, {
    'EDITAR (PATCH) - status e 200 ou 409': (r) => r.status === 200 || r.status === 409,
    'EDITAR (PATCH) - tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}