import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution'; // Controla os logs para não inundar o terminal

// Contador local para limitar as mensagens no terminal
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
  const url = 'http://localhost:3000/tarefas/3'; 
  
  const params = { 
    headers: { 
      'Content-Type': 'application/json',
    } 
  };
  
  // Executa o DELETE sem passar payload corpo
  const res = http.del(url, null, params);

  // Exibe no console quando a tarefa já tiver sido apagada por outro VU
  if (exec.vu.idInTest === 1 && res.status === 404 && logsExibidos < 5) {
    console.log(`[EXCLUSÃO CONCORRENTE] Tarefa já havia sido deletada! | Status: 404`);
    logsExibidos++; 
  }

  // exibe no terminal o tipo de rota.
  check(res, {
    'DELETAR (DELETE) - status e 200 ou 404': (r) => r.status === 200 || r.status === 404,
    'DELETAR (DELETE) - tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}