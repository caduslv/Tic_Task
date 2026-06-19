import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

const MAX_RETRIES = 3;

console.log('🤖 Background Worker iniciado e monitorando a fila do Tic Task...');
async function limparCacheUsuario(userId){
  if (!userId) return;
  try {
    const chavesFiltros = await redis.keys(`tarefas:usuario:${userId}:filtros:*`);
    if (chavesFiltros.length > 0){
      await redis.del(chavesFiltros);
      console.log(`[WORKER] 🧼 Cache limpo para o usuário ${userId}`);
    } 
  } catch (cacheErr){
       console.error(`[WORKER] Falha ao limpar cache para o usuário:`, cacheErr);
    }
  }
async function processQueue() {
  while (true) {
    try {
      const result = await redis.brpop('fila:tarefas', 0);
      const messageJson = result[1];
      const message = JSON.parse(messageJson);

      // Log detalhado para cada mensagem recebida da fila com destaque para o ID da tarefa.
      console.log(`\n📦 [WORKER] Mensagem recebida! Processando tarefa ID: ${message.taskId}`);

      await handleTaskProcessing(message);

    } catch (error) {
      console.error('❌ [WORKER] Erro crítico no loop de leitura da fila:', error);
    }
  }
}

async function handleTaskProcessing(message) {
  try {
    console.log(`⚙️ [WORKER] Executando o evento: ${message.eventType}...`);
    
    // 🚀 O QUE MUDOU ESTÁ AQUI: Identifica se é uma exclusão ou outro processo
    switch (message.eventType) {
      case 'TASK_DELETED':
        console.log(`🗑️ [WORKER]Removendo agendamentos externos e limpando o cache para a tarefa deletada ${message.taskId}...`);

        await limparCacheUsuario(message.userId); // Limpa o cache relacionado ao usuário que teve a tarefa deletada.
        
        await new Promise((resolve) =>setTimeout(resolve, 1500)); // Simula o tempo gasto para limpar cache e remover agendamentos

        break;

        case 'TASK_UPDATED':
          console.log(`✏️[WORKER] Processando atualizações dos dados da tarefa ${message.taskId}...`);
          await limparCacheUsuario(message.userId); // Limpa o cache relacionado ao usuário que teve a tarefa atualizada. 

          if (message.status === 'concluida') {
            console.log(`🎉 [WORKER] [Produtividade] Usuário ${message.userId} concluiu a tarefa ${message.taskId}! Atualizando métricas de produtividade...`);
          } else{ 
            console.log(`🔄 [WORKER] Modificação aplicada à tarefa ${message.taskId}...`);
          }
          await new Promise ((resolve) => setTimeout(resolve, 1000)); // Simula o tempo gasto para processar a atualização
          break;

          case 'SYNC_EXTERNAL_CALENDAR':
          default:
            console.log(`📅 [WORKER] Sincronizando calendario externo para a tarefa ${message.taskId}...`);
    }

    console.log(`✅ [WORKER] Sucesso! Processamento da tarefa ${message.taskId} concluído em background.`);
  } catch (error) {
    console.error(`⚠️ [WORKER] Falha ao processar a tarefa ${message.taskId}.`);
    
    // Pequena trava de segurança: se a API não mandar o contador zerado, nós inicializamos aqui
    if (!message.tentativas) message.tentativas = 0;
    
    message.tentativas += 1;

    if (message.tentativas <= MAX_RETRIES) {
      console.log(`🔄 [WORKER] Tentativa ${message.tentativas} de ${MAX_RETRIES}. Devolvendo para a fila em 5s...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      message.status = "RETRYING";
      await redis.lpush('fila:tarefas', JSON.stringify(message));
    } else {
      console.error(`🚨 [WORKER] Limite de erros atingido. Movendo tarefa ${message.taskId} para a DLQ.`);
      message.status = "FAILED";
      await redis.lpush('fila:dlq', JSON.stringify(message));
    }
  }
}

processQueue();