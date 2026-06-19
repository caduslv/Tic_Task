import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution'; // 💡 Controla os logs para não inundar o terminal

// Contador local para limitar as mensagens no terminal
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
  // Rota apontando para a tarefa que sofrerá a disputa de exclusão
  const url = 'http://localhost:3000/tarefas/3'; 
  
  const params = { 
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer SEU_TOKEN_AQUI'
    } 
  };
  
  // Executa o DELETE sem passar payload corpo
  const res = http.del(url, null, params);

  // 💡 MÁGICA DO LOG: Se for o VU nº 1 e o status for 404 (provando que a exclusão concorrente funcionou)
  if (exec.vu.idInTest === 1 && res.status === 404 && logsExibidos < 5) {
    console.log(`[EXCLUSÃO CONCORRENTE] Tarefa já havia sido deletada! | Status: 404`);
    logsExibidos++; 
  }

  // 💡 CHECAGEM: Aceita 200 (primeiro que deletou) ou 404 (tratamento correto de concorrência)
  check(res, {
    'status e 200 ou 404': (r) => r.status === 200 || r.status === 404,
    'tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}