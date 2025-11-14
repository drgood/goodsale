module.exports = {
  apps: [
    {
      name: "goodsale",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "./",

      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      max_memory_restart: "512M",

      env: {
        NODE_ENV: "development",
        NEXTAUTH_URL: "http://localhost:3000"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXTAUTH_URL: "https://goodsale.online"
      },

      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
