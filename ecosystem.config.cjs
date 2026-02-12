module.exports = {
  apps: [
    {
      name: "rich666-server",
      cwd: "./apps/server",
      script: "dist/index.js",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 3000
      }
    }
  ]
};
