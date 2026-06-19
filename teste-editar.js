import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution'; // 💡 Nova importação para controlar os usuários

// Contador local (agora só o usuário 1 vai mexer nele)
let logsExibidos = 0; 

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  stages: [
    { duration: '10s', target: 10 }, 
    { duration: '40s', target: 55 }, 
    { duration: '10s', target: 0 },  
  ],
};

export default function () {
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

  // 💡 MÁGICA AQUI: Verifica se é o VU  nº 1, se foi erro 409, e se ainda não passou de 5 logs
  if (exec.vu.idInTest === 1 && res.status === 409 && logsExibidos < 5) {
    console.log(`[LOCKING OTIMISTA] Concorrência barrada! | Status retornado: 409`);
    logsExibidos++; // Aumenta a conta
  }

  check(res, {
    'status e 200 ou 409': (r) => r.status === 200 || r.status === 409,
    'tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}