/** @type {import('next').NextConfig} */
process.env.TZ = 'America/Lima';
const nextConfig = {
   webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false }; // Para evitar errores de módulos Node.js
    return config;
  },
};

module.exports = nextConfig;