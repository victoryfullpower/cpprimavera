module.exports = {
  apps: [{
    name: "NextJS",
    script: "node_modules/next/dist/bin/next",
    args: "start",
    cwd: "D:/SistemaCCP_web/cpprimavera",  // Usa / en lugar de \
    interpreter: "node",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production"
    }
  }]
}