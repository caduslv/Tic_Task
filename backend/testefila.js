import redis from './config/redisClient.js';

async function enviarTarefaDeTeste(idUsuario, idTarefa, tipoEvento) {
  try {
    const messagePayload = {
      id_usuario: idUsuario,
      id_tarefa: idTarefa,
      tipo_evento: tipoEvento,
      tentativas: 0,
      status: "PENDING",
      created_at: new Date().toISOString(),
      payload: {
        version: 1,
        mensagem: `Iniciando processamento assíncrono para a tarefa ${idTarefa}`
      }
    };

    await redis.lpush('tic-task:queue', JSON.stringify(messagePayload));
    console.log(`[PRODUCER] Evento ${tipoEvento} enviado para a fila para a tarefa ${idTarefa}!`);
  } catch (error) {
    console.error('❌ Erro no Producer:', error);
  }
}

async function executar() {
  console.log('🛫 Disparando tarefas de teste...');
  
  await enviarTarefaDeTeste(762, 1045, 'SYNC_EXTERNAL_CALENDAR');
  await enviarTarefaDeTeste(762, 1046, 'SEND_NOTIFICATION');
  
  console.log('✅ Todas as tarefas foram postadas na fila!');
  process.exit(0);
}

setTimeout(executar, 1000);