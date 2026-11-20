/**
 * Arranque local del backend.
 * En Vercel NO se usa este archivo: la función vive en /api/index.js.
 */
const app = require('./app');
const { env, assertEnv } = require('./config/env');

try {
  assertEnv();
} catch (error) {
  console.error(`\n[SazónLocal] ${error.message}`);
  console.error('Copia .env.example a .env y completa las credenciales.\n');
  process.exit(1);
}

app.listen(env.port, () => {
  console.log(`[SazónLocal] API escuchando en http://localhost:${env.port}/api`);
  console.log(`[SazónLocal] Entorno: ${env.nodeEnv}`);
});
