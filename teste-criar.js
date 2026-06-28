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
  
  // Token de autenticação para validar a rota protegida de escrita
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJjYWxvcy5lZHU4NkBnbWFpbC5jb20iLCJpYXQiOjE3ODI2NjI2MTEsImV4cCI6MTc4MzI2NzQxMX0.66mhp9Hz1gjoIDHns0MIhnd76BKffAqkPY64jM6qpSg";
  
  const payload = JSON.stringify({
    titulo: 'Nova Tarefa k6',
    descricao: 'Testando a performance de criacao do sistema',
    status: 'pendente'
  });

  const params = { 
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Autenticação incluída
    } 
  };
  
  const res = http.post(url, payload, params);

  // Validação dos resultados
  check(res, {
    'ESCRITA (POST) - status 201 ou 200': (r) => r.status === 201 || r.status === 200,
    'ESCRITA (POST) - tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}