import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  stages: [
    { duration: '10s', target: 10 }, 
    { duration: '40s', target: 55 }, 
    { duration: '10s', target: 0 },  
  ],
};

export default function () {
  const url = 'http://localhost:3000/tarefas'; 
  
  // Token de autenticação para validar a rota protegida
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJjYWxvcy5lZHU4NkBnbWFpbC5jb20iLCJpYXQiOjE3ODI2NjI2MTEsImV4cCI6MTc4MzI2NzQxMX0.66mhp9Hz1gjoIDHns0MIhnd76BKffAqkPY64jM6qpSg";
  
  const params = { 
    headers: { 
      'Authorization': `Bearer ${token}` 
    } 
  };

  const res = http.get(url, params);

  // Validação dos resultados
  check(res, {
    'LEITURA (GET) - status 200': (r) => r.status === 200,
    'LEITURA (GET) - tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}