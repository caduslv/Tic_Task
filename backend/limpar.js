// limpar.js
import redis from './config/redisClient.js';

async function flush() {
    try {
        console.log("🧹 Limpando a memória do Redis...");
        await redis.flushall();
        console.log("✨ Redis limpinho com sucesso! Pode dar F5 na tela.");
    } catch (err) {
        console.error("❌ Erro ao limpar o Redis:", err);
    } finally {
        process.exit(0);
    }
}

flush();