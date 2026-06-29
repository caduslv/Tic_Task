import cluster from 'cluster';
import os from 'os';
 
const NUM_WORKERS = process.env.NUM_WORKERS || os.cpus().length;
 
if (cluster.isPrimary) {
  console.log(`🧠 [MASTER] Iniciando ${NUM_WORKERS} processos Worker em paralelo (PID: ${process.pid})`);
 
  // Cria N processos filhos, cada um executando taskWorker.js de forma independente
  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }
 
  // Se um worker morrer (crash), o master cria outro automaticamente
  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ [MASTER] Worker PID ${worker.process.pid} caiu. Reiniciando...`);
    cluster.fork();
  });
 
} else {
  // Cada processo filho executa o worker real, consumindo a fila Redis
  console.log(`⚙️ [WORKER ${process.pid}] Processo iniciado e pronto para consumir a fila.`);
  import('./taskWorker.js');
}
 