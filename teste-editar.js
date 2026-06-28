import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

// Contador local para não inundar o terminal de logs
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
  
  // Token inserido para garantir a autorização na rota protegida
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJjYWxvcy5lZHU4NkBnbWFpbC5jb20iLCJpYXQiOjE3ODI2NjI2MTEsImV4cCI6MTc4MzI2NzQxMX0.66mhp9Hz1gjoIDHns0MIhnd76BKffAqkPY64jM6qpSg";
  
  const payload = JSON.stringify({
    titulo: 'Tarefa Atualizada k6',
    status: 'concluida',
    versao: 1 
  });

  const params = { 
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ADICIONADO: Token de autenticação
    } 
  };
  
  const res = http.patch(url, payload, params);

  // Exibe no console quando a concorrência for barrada com sucesso (Status 409)
  if (exec.vu.idInTest === 1 && res.status === 409 && logsExibidos < 5) {
    console.log(`[LOCKING OTIMISTA] Concorrência barrada! | Status retornado: 409`);
    logsExibidos++; 
  }

  // Verifica se o resultado foi um sucesso (200) ou bloqueio consciente (409)
  check(res, {
    'EDITAR (PATCH) - status e 200 ou 409': (r) => r.status === 200 || r.status === 409,
    'EDITAR (PATCH) - tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}