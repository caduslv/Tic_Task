import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';

export const options = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '40s', target: 939 }, 
    { duration: '10s', target: 0 }, 
  ],
};

export default function () {
  const url = 'http://localhost:3000/tarefas'; 
  
  // Sem token para testar a camada de segurança sob estresse
  const res = http.get(url);

  // Limite de logs: Exibe apenas no VU 1 e a cada 5000 iterações
  if (exec.vu.idInTest === 1 && exec.vu.iterationInInstance % 5000 === 0) {
    console.log(`[ESTRESSE] Carga: 939 VUs | Status: ${res.status}`);
  }

  check(res, {
    'status é 401': (r) => r.status === 401,
  });
}