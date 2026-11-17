module.exports = {
  apps: [
    {
      name: "koz-doner-pos",
      script: "dist/server.cjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    }
  ]
};
