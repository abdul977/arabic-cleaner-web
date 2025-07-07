# Vercel Deployment Guide - Arabic Text Cleaner

Your Next.js application is already deployed at: **https://arabic-cleaner-web-a91v.vercel.app**

This guide will help you deploy the Python document chunking service to enable large file processing (up to 500MB).

## Current Status

✅ **Next.js App**: Deployed on Vercel  
❌ **Python Service**: Not deployed (limited to 100MB files)

## Quick Deployment Options

### Option 1: Railway (Recommended - Free Tier Available)

Railway offers a generous free tier and easy Python deployment.

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy Python Service**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Choose "python-service" as the root directory
   - Railway will auto-detect Python and deploy

3. **Configure Environment Variables in Railway**
   ```
   HOST=0.0.0.0
   PORT=$PORT
   LOG_LEVEL=INFO
   ALLOWED_ORIGINS=https://arabic-cleaner-web-a91v.vercel.app,https://*.vercel.app
   DEFAULT_CHUNK_SIZE_WORDS=10000
   DEFAULT_OVERLAP_WORDS=100
   TEMP_FILE_CLEANUP_INTERVAL_HOURS=1
   TEMP_FILE_MAX_AGE_HOURS=1
   PYTHONUNBUFFERED=1
   PYTHONDONTWRITEBYTECODE=1
   ```

4. **Get Your Railway URL**
   - After deployment, Railway will provide a URL like: `https://your-service.railway.app`

5. **Update Vercel Environment Variables**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add environment variable:
     ```
     PYTHON_SERVICE_URL=https://your-service.railway.app
     ```
   - Redeploy your Vercel app

### Option 2: Heroku

1. **Create Heroku Account** at https://heroku.com

2. **Install Heroku CLI**
   ```bash
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

3. **Deploy Python Service**
   ```bash
   # Navigate to python-service directory
   cd python-service
   
   # Create Heroku app
   heroku create your-chunking-service
   
   # Create Procfile
   echo "web: uvicorn api_service:app --host 0.0.0.0 --port \$PORT" > Procfile
   
   # Set environment variables
   heroku config:set HOST=0.0.0.0
   heroku config:set LOG_LEVEL=INFO
   heroku config:set ALLOWED_ORIGINS=https://arabic-cleaner-web-a91v.vercel.app,https://*.vercel.app
   heroku config:set DEFAULT_CHUNK_SIZE_WORDS=10000
   heroku config:set DEFAULT_OVERLAP_WORDS=100
   heroku config:set PYTHONUNBUFFERED=1
   heroku config:set PYTHONDONTWRITEBYTECODE=1
   
   # Deploy
   git init
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

4. **Update Vercel Environment Variables**
   ```
   PYTHON_SERVICE_URL=https://your-chunking-service.herokuapp.com
   ```

### Option 3: Google Cloud Run

1. **Install Google Cloud CLI**
   ```bash
   # Download from https://cloud.google.com/sdk/docs/install
   ```

2. **Build and Deploy**
   ```bash
   # Navigate to python-service directory
   cd python-service
   
   # Build container
   gcloud builds submit --tag gcr.io/PROJECT_ID/chunking-service
   
   # Deploy to Cloud Run
   gcloud run deploy chunking-service \
     --image gcr.io/PROJECT_ID/chunking-service \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 2Gi \
     --timeout 300 \
     --set-env-vars="LOG_LEVEL=INFO,ALLOWED_ORIGINS=https://arabic-cleaner-web-a91v.vercel.app,DEFAULT_CHUNK_SIZE_WORDS=10000"
   ```

3. **Update Vercel Environment Variables**
   ```
   PYTHON_SERVICE_URL=https://chunking-service-hash-uc.a.run.app
   ```

## Vercel Environment Variables Setup

Once you have your Python service deployed, update your Vercel project:

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your `arabic-cleaner-web-a91v` project

2. **Navigate to Settings → Environment Variables**

3. **Add the following variables:**
   ```
   Name: PYTHON_SERVICE_URL
   Value: https://your-python-service-url.com
   Environment: Production, Preview, Development
   ```

4. **Redeploy Your Application**
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to trigger automatic deployment

## Testing Your Deployment

1. **Visit Your Site**: https://arabic-cleaner-web-a91v.vercel.app

2. **Check Service Status**
   - Look for the "Enhanced Processing Status" indicator
   - Should show "Available (up to 500MB per file)" if Python service is working

3. **Test Large File Upload**
   - Try uploading a file larger than 10MB
   - Should be processed using the Python service

4. **Monitor Logs**
   - Vercel: Check function logs in Vercel dashboard
   - Python Service: Check logs in your chosen platform (Railway/Heroku/GCP)

## Troubleshooting

### Python Service Not Detected

1. **Check Environment Variable**
   ```bash
   # Test the URL directly
   curl https://your-python-service-url.com/health
   ```

2. **Verify CORS Settings**
   - Ensure `ALLOWED_ORIGINS` includes your Vercel domain

3. **Check Service Logs**
   - Look for startup errors in your Python service platform

### File Upload Errors

1. **413 Request Entity Too Large**
   - Check if Python service is running
   - Verify environment variables are set correctly

2. **CORS Errors**
   - Update `ALLOWED_ORIGINS` in Python service
   - Redeploy Python service

### Performance Issues

1. **Increase Memory/Timeout**
   - Railway: Upgrade plan for more resources
   - Heroku: Use performance dynos
   - GCP: Increase memory allocation

## Cost Considerations

### Free Tier Limits
- **Railway**: 500 hours/month, 1GB RAM
- **Heroku**: 550 hours/month, 512MB RAM
- **Google Cloud**: $300 credit, pay-per-use after

### Recommended for Production
- **Railway Pro**: $5/month for better performance
- **Heroku Standard**: $7/month per dyno
- **Google Cloud Run**: Pay per request (very cost-effective)

## Next Steps

1. **Choose a deployment platform** (Railway recommended for simplicity)
2. **Deploy the Python service** using the guide above
3. **Update Vercel environment variables** with your Python service URL
4. **Test the integration** with large files
5. **Monitor performance** and adjust resources as needed

Your Arabic Text Cleaner will then support files up to 500MB with intelligent chunking!
