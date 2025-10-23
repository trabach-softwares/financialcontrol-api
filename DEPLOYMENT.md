# Deployment Guide

This guide explains how to deploy the Financial Control API to various platforms.

## Prerequisites

Before deploying, ensure you have:
1. A Supabase project with the database configured (see DATABASE.md)
2. Your environment variables ready
3. The repository pushed to GitHub

## Deploy to Vercel

Vercel is recommended for the easiest deployment experience.

### Steps:

1. **Install Vercel CLI** (optional):
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel
```

Or use the Vercel Dashboard:

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `ALLOWED_ORIGINS`
5. Click "Deploy"

### Important Notes:
- The `vercel.json` file is already configured
- Vercel will automatically detect and build your Node.js application
- Your API will be available at: `https://your-project.vercel.app`

## Deploy to Render

Render offers free hosting for Node.js applications.

### Steps:

1. Go to [render.com](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: financialcontrol-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free or Starter

5. Add environment variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (or leave blank for auto)
   - `SUPABASE_URL` = your_supabase_url
   - `SUPABASE_ANON_KEY` = your_key
   - `SUPABASE_SERVICE_ROLE_KEY` = your_key
   - `JWT_SECRET` = your_secret
   - `JWT_EXPIRES_IN` = `7d`
   - `ALLOWED_ORIGINS` = your_frontend_url

6. Click "Create Web Service"

### Important Notes:
- Free tier services may sleep after inactivity
- The service will auto-deploy on every push to your main branch
- Your API will be available at: `https://your-service.onrender.com`

## Deploy to Railway

Railway is another excellent option for deployment.

### Steps:

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Add environment variables (same as above)
6. Railway will automatically:
   - Detect your Node.js app
   - Install dependencies
   - Start the server

Your API will be available at: `https://your-project.railway.app`

## Deploy to Heroku

### Steps:

1. Install Heroku CLI:
```bash
npm install -g heroku
```

2. Login to Heroku:
```bash
heroku login
```

3. Create a new Heroku app:
```bash
heroku create financialcontrol-api
```

4. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_ANON_KEY=your_key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_key
heroku config:set JWT_SECRET=your_secret
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set ALLOWED_ORIGINS=your_origins
```

5. Create a `Procfile` (if it doesn't exist):
```bash
# Check if Procfile exists, create if it doesn't
if [ ! -f Procfile ]; then
  echo "web: npm start" > Procfile
fi
```

6. Deploy:
```bash
git push heroku main
```

Your API will be available at: `https://your-app.herokuapp.com`

## Deploy to DigitalOcean App Platform

### Steps:

1. Go to [DigitalOcean](https://www.digitalocean.com)
2. Navigate to "Apps" in the dashboard
3. Click "Create App"
4. Connect your GitHub repository
5. Configure:
   - **Name**: financialcontrol-api
   - **Environment**: Node.js
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`

6. Add environment variables (same as above)
7. Choose a plan (Basic is $5/month)
8. Click "Create Resources"

## Deploy with Docker

### Create Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Create .dockerignore:

```
node_modules
npm-debug.log
.env
.git
.gitignore
```

### Build and Run:

```bash
# Build
docker build -t financialcontrol-api .

# Run
docker run -p 3000:3000 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  -e JWT_SECRET=your_secret \
  -e JWT_EXPIRES_IN=7d \
  financialcontrol-api
```

### Deploy to Docker Hub:

```bash
docker tag financialcontrol-api yourusername/financialcontrol-api
docker push yourusername/financialcontrol-api
```

## Environment Variables

Make sure to set these environment variables in your deployment platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` (auto on most platforms) |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `JWT_SECRET` | Secret for JWT signing | Strong random string |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://yourapp.com` |

## Post-Deployment Checklist

After deployment:

1. ✅ Test the health endpoint: `GET /health`
2. ✅ Test authentication: Register and login
3. ✅ Verify CORS settings work with your frontend
4. ✅ Check logs for any errors
5. ✅ Test all critical endpoints
6. ✅ Monitor performance and errors
7. ✅ Set up SSL/HTTPS (most platforms do this automatically)
8. ✅ Configure custom domain (optional)

## Monitoring

Consider setting up monitoring with:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **New Relic** - APM
- **Datadog** - Infrastructure monitoring

## Scaling

For production at scale:
- Enable auto-scaling in your platform
- Use a CDN for static assets
- Implement rate limiting
- Add caching (Redis)
- Use a load balancer
- Monitor database performance

## Troubleshooting

### Common Issues:

**API returns 404 on all routes:**
- Check that `vercel.json` is properly configured
- Verify the start command is `node src/server.js`

**Database connection errors:**
- Verify Supabase environment variables are correct
- Check if Supabase project is active
- Verify database tables exist

**JWT errors:**
- Ensure `JWT_SECRET` is set
- Check token expiration settings

**CORS errors:**
- Add your frontend URL to `ALLOWED_ORIGINS`
- Use comma-separated list for multiple origins

## Support

For deployment issues:
1. Check the platform's documentation
2. Review deployment logs
3. Test locally with production environment variables
4. Open an issue on GitHub

## Security Recommendations

1. **Never commit** `.env` file to version control
2. Use **strong** JWT secrets (minimum 32 characters)
3. Enable **HTTPS** only in production
4. Implement **rate limiting** for auth endpoints
5. Keep dependencies **updated** regularly
6. Use **Supabase RLS** policies for data security
7. Monitor for **suspicious activity**
8. Implement **logging** for security events
