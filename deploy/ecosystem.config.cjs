module.exports = {
  apps: [
    {
      name: "koz-doner-pos",
      script: "dist/server.cjs",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M"
    }
  ]
};
