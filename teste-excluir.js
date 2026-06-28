import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

let logsExibidos = 0; 

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  stages: [
    { duration: '10s', target: 10 },
    { duration: '40s', target: 939 },
    { duration: '10s', target: 0 },
  ],
};

export default function () {
  const url = 'http://localhost:3000/tarefas/3'; 
  
  // Token inserido diretamente aqui:
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJjYWxvcy5lZHU4NkBnbWFpbC5jb20iLCJpYXQiOjE3ODI2NjI2MTEsImV4cCI6MTc4MzI2NzQxMX0.66mhp9Hz1gjoIDHns0MIhnd76BKffAqkPY64jM6qpSg";
  
  const params = { 
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    } 
  };
  
  const res = http.del(url, null, params);

  // console.log(`DEBUG: Status recebido: ${res.status} | Body: ${res.body}`);

  if (exec.vu.idInTest === 1 && res.status === 404 && logsExibidos < 5) {
    console.log(`[EXCLUSÃO CONCORRENTE] Tarefa já havia sido deletada! | Status: 404`);
    logsExibidos++; 
  }

  check(res, {
    'DELETAR (DELETE) - status e 200 ou 404': (r) => r.status === 200 || r.status === 404,
    'DELETAR (DELETE) - tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}