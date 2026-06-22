import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  stages: [
    { duration: '10s', target: 10 }, // Sobe para 10 usuários em 10 segundos
    { duration: '40s', target: 55 }, // Sobe até 55 usuários e segura o estresse
    { duration: '10s', target: 0 },  // Desce a rampa limpando as conexões
  ],
};

export default function () {
  const url = 'http://localhost:3000/tarefas'; 

  const res = http.get(url);

  // Tags alteradas para destacar a Leitura no terminal
  check(res, {
    'LEITURA (GET) - status e 200': (r) => r.status === 200,
    'LEITURA (GET) - tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}