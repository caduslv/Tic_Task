import http from 'k6/http';
import { check } from 'k6';

export const options = {
  // Configuração focada em estresse máximo
  stages: [
    { duration: '10s', target: 939 }, // Rampa de subida
    { duration: '40s', target: 939 },  // Pico de estresse (sem sleep)
    { duration: '10s', target: 0 },  // Rampa de descida
  ],
};

export default function () {
  // Apenas a requisição, sem sleep, para atingir o limite de processamento
  const res = http.get('http://localhost:3000/tarefas');
  
  check(res, {
    'status é 200': (r) => r.status === 200,
  });
}