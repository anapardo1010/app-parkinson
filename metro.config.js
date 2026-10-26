// Configuración de Metro.
// En web la base de datos local usa sql.js (SQLite compilado a JavaScript). Su versión
// "asm" menciona módulos de Node (fs, crypto) que nunca se usan en el navegador,
// así que aquí se resuelven como módulos vacíos.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const resolverOriginal = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'node:fs' || moduleName === 'node:crypto')) {
    return { type: 'empty' };
  }
  return (resolverOriginal ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
