/**
 * Punto de entrada para Vercel Serverless Functions.
 *
 * Vercel detecta automáticamente este archivo y lo expone como una función
 * Node.js. Express se encarga del enrutamiento interno (auth, negocios, etc.).
 *
 * Requerido por el enunciado del proyecto: exportar la app con module.exports.
 */
const app = require('../backend/src/app');

module.exports = app;
