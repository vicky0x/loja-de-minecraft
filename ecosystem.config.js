module.exports = {
  apps: [
    {
      name: "loja-minecraft",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      max_memory_restart: "500M"
    }
  ]
}; 