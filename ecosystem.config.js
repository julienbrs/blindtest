/**
 * PM2 Ecosystem Configuration for Blindtest Production
 *
 * Usage:
 *   npm install -g pm2
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup  # Enable auto-start on boot
 *
 * Commands:
 *   pm2 status           # Check status
 *   pm2 logs blindtest   # View logs
 *   pm2 restart blindtest # Restart app
 *   pm2 stop blindtest   # Stop app
 */
module.exports = {
  apps: [
    {
      name: 'blindtest',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // AUDIO_FOLDER_PATH should be set in .env.local or here
        // AUDIO_FOLDER_PATH: '/path/to/your/music',
        // NEXT_PUBLIC_SUPABASE_URL: 'your-supabase-url',
        // NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-supabase-anon-key',
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
}
