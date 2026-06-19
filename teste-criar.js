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
  
  const payload = JSON.stringify({
    titulo: 'Nova Tarefa k6',
    descricao: 'Testando a performance de criacao do sistema',
    status: 'pendente'
  });

  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);

  check(res, {
    'status e 201 ou 200': (r) => r.status === 201 || r.status === 200,
    'tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}