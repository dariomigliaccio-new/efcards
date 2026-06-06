// PM2 ecosystem config
// Usage: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    {
      name: 'cardmatch-backend',
      cwd:  '/var/www/cardmatch/backend',
      script: 'src/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT:     4000,
      },
      error_file: '/var/log/cardmatch/backend-error.log',
      out_file:   '/var/log/cardmatch/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '512M',
    },
    {
      name: 'cardmatch-frontend',
      cwd:  '/var/www/cardmatch/frontend',
      script: 'node_modules/.bin/next',
      args:   'start -p 3000',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT:     3000,
      },
      error_file: '/var/log/cardmatch/frontend-error.log',
      out_file:   '/var/log/cardmatch/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '512M',
    },
  ],
};
