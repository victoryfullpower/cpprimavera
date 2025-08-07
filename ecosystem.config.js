module.exports = {
  apps: [{
    name: "CCPrimavera",
    script: "npm",
    args: "start",
    cwd: "D:/SistemaCCP_web/cpprimavera",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    env_development: {
      NODE_ENV: "development",
      PORT: 3000
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_file: "./logs/combined.log",
    time: true,
    // Fix for Windows path issues
    interpreter: "node",
    // Add environment variables
    env_file: ".env.local"
  }]
}