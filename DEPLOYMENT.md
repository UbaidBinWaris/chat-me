# Deployment Guide

This guide explains how to deploy the Chat Application on a Linux server (e.g., Ubuntu) using Git.

## Prerequisites

- A Linux server (Ubuntu 20.04/22.04 recommended).
- Root or sudo access to the server.
- A domain name (optional, but recommended).
- Git installed on local machine and server.
- PostgreSQL database (can be on the same server or a managed database).

## 1. Server Setup

Update your server packages:
```bash
sudo apt update && sudo apt upgrade -y
```

Install Node.js (v18 or later recommended):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Install Git and PM2 (Process Manager):
```bash
sudo apt install -y git
sudo npm install -g pm2
```

## 2. Clone the Repository

Navigate to your desired directory (e.g., `/var/www`):
```bash
cd /var/www
sudo git clone <YOUR_GIT_REPOSITORY_URL> chat-app
cd chat-app
```
*Replace `<YOUR_GIT_REPOSITORY_URL>` with your actual repository URL.*

## 3. Install Dependencies

```bash
npm install
```

## 4. Environment Configuration

Create a `.env` file in the root directory:
```bash
nano .env
```

Paste your environment variables (similiar to your local `.env`), ensuring they are correct for production:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://your-domain-or-ip"
socket_url="http://your-domain-or-ip:3000"
# Add other variables as needed
NODE_ENV=production
```
*Press `Ctrl+X`, then `Y`, then `Enter` to save and exit.*

## 5. Database Setup

Run Prisma migrations to set up your database schema:
```bash
npx prisma migrate deploy
npx prisma generate
```

## 6. Build the Application

Build the Next.js application:
```bash
npm run build
```

## 7. Start the Application with PM2

Since this project uses a custom server (`server.ts`) for Socket.io, you must run `server.ts` instead of the default Next.js start command.

**Important:** Ensure `server.ts` is listening on the correct host. If it's hardcoded to `localhost`, change it to `0.0.0.0` or remove the hostname argument in `server.listen`.

Build and start using `tsx` (or compile manually):

```bash
# Start with PM2 using tsx interpreter
pm2 start server.ts --name "chat-app" --interpreter ./node_modules/.bin/tsx
```

Save the PM2 list so it restarts on reboot:
```bash
pm2 save
pm2 startup
```
*Follow the command output by `pm2 startup`.*

## 8. Nginx Reverse Proxy (Recommended)

Install Nginx:
```bash
sudo apt install -y nginx
```

Create a new configuration file:
```bash
sudo nano /etc/nginx/sites-available/chat-app
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com; # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 9. Firewall Setup (UFW)

Allow SSH, HTTP, and HTTPS:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Troubleshooting

- **Check logs:** `pm2 logs chat-app`
- **Restart app:** `pm2 restart chat-app`
- **Database issues:** Check `DATABASE_URL` and ensure Postgres is running.

## Updating the App

To update your deployment with new changes:
```bash
cd /var/www/chat-app
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart chat-app
```
