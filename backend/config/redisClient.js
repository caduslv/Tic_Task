import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || {
  host: process.env.REDIS_URL || 'localhost', 
  port: process.env.REDIS_URL || 6379,
});

redis.on('connect', () => {
  console.log('🚀 Conectado ao Redis com sucesso!');
});

redis.on('error', (err) => {
  console.error('❌ Erro na conexão com o Redis:', err);
});

export default redis;